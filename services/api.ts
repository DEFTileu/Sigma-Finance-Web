import { handleApiError } from './apiErrorHandler';

const API_BASE_URL = 'http://localhost:8080/api';
const FILE_UPLOAD_URL = 'https://task-flow-spring-boot-a7b12abc3f71.herokuapp.com/api/files/upload-to-project';
const SECRET_KEY = "95e6a68e941573ef7188f07bb213ee05";

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface TransferByPhoneParams {
  sourceAccountId: string;
  destinationAccountId: string;
  amount: number;
  description?: string;
  useBonuses?: boolean;
}

class ApiService {
  private async getToken(): Promise<string | null> {
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      return await AsyncStorage.getItem('jwt_token');
    } catch {
      return null;
    }
  }

  private async getRefreshToken(): Promise<string | null> {
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      return await AsyncStorage.getItem('refresh_token');
    } catch {
      return null;
    }
  }

  private async refreshAccessToken(): Promise<string | null> {
    try {
      const refreshToken = await this.getRefreshToken();
      if (!refreshToken) return null;

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) return null;

      const data = await response.json();
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      if (data?.accessToken) {
        await AsyncStorage.setItem('jwt_token', data.accessToken);
        return data.accessToken;
      }
      return null;
    } catch {
      return null;
    }
  }

  private async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
      const token = await this.getToken();
      const baseHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) baseHeaders.Authorization = `Bearer ${token}`;

      const config: RequestInit = {
        method: options.method || 'GET',
        headers: { ...baseHeaders, ...(options.headers as any) },
        body: options.body,
      };

      let response = await fetch(`${API_BASE_URL}${endpoint}`, config);

      // Try refresh on 401
      if (response.status === 401 && token) {
        const newToken = await this.refreshAccessToken();
        if (newToken) {
          const retryHeaders = { ...baseHeaders, Authorization: `Bearer ${newToken}`, ...(options.headers as any) };
          response = await fetch(`${API_BASE_URL}${endpoint}`, { ...config, headers: retryHeaders });
        }
      }

      const rawText = await response.text();
      let data: any = {};
      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        data = {};
      }

      if (!response.ok) {
        const error = {
          message: data?.message || `Ошибка запроса (${response.status})`,
          status: response.status,
        };
        await handleApiError(error);
        throw error;
      }

      return data as T;
    } catch (error) {
      await handleApiError(error);
      throw error;
    }
  }

  // Auth
  async register(userData: {
    name: string;
    surname: string;
    username: string;
    phoneNumber: string;
    password: string;
  }) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(credentials: { username: string; password: string }) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async logout() {
    try {
      const refreshToken = await this.getRefreshToken();
      if (refreshToken) {
        try {
          await fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });
        } catch {}
      }
    } finally {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      await AsyncStorage.multiRemove(['jwt_token', 'refresh_token', 'user_id', 'user_data']);
    }
  }

  // Accounts
  async getAccounts() {
    return this.request('/accounts');
  }

  // Users
  async getUserProfile() {
    return this.request('/users/profile');
  }

  async updateUserProfile(data: {
    name?: string;
    surname?: string;
    patronymic?: string;
  }) {
    return this.request('/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async updateAvatar(avatarUrl: string) {
    return this.request('/users/profile/avatar', {
      method: 'POST',
      body: JSON.stringify({ url: avatarUrl }),
    });
  }

  /**
   * Генерирует токен доступа для загрузки файлов
   */
  async _generateAccessToken(projectName: string, fileType: string): Promise<string> {
    const timestamp = Date.now();
    const data = `${projectName}|${fileType}|${timestamp}|${SECRET_KEY}`;

    // Генерируем SHA-256 хеш
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);

    // Конвертируем в Base64
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashBase64 = btoa(String.fromCharCode(...hashArray));

    // Формат: timestamp|hash
    const token = `${timestamp}|${hashBase64}`;
    return btoa(token);
  }

  /**
   * Загружает аватар через внешний сервис
   */
  async uploadAvatar(file: Blob | File): Promise<{ url: string }> {
    try {
      const projectName = 'Sigma Finance';
      const fileType = 'avatar';

      // Генерируем токен доступа
      const accessToken = await this._generateAccessToken(projectName, fileType);

      // Подготавливаем FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('projectName', projectName);
      formData.append('fileType', fileType);
      formData.append('accessToken', accessToken);

      // Отправляем запрос
      const response = await fetch(FILE_UPLOAD_URL, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = 'Не удалось загрузить аватар';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          // Игнорируем ошибку парсинга
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();

      // После успешной загрузки файла, сохраняем URL в профиль через ваш API
      await this.updateAvatar(result.url);

      return { url: result.url };
    } catch (error: any) {
      const err = { message: error.message || 'Не удалось загрузить аватар', status: 500 };
      await handleApiError(err);
      throw err;
    }
  }

  /**
   * Загружает файл в проект (универсальный метод)
   */
  async uploadFileToProject(
    file: Blob | File,
    fileType: string = 'documents'
  ): Promise<{ url: string; projectName: string; fileType: string }> {
    try {
      const projectName = 'Sigma Finance';

      // Генерируем токен доступа
      const accessToken = await this._generateAccessToken(projectName, fileType);

      // Подготавливаем FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('projectName', projectName);
      formData.append('fileType', fileType);
      formData.append('accessToken', accessToken);

      // Отправляем запрос
      const response = await fetch(FILE_UPLOAD_URL, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = 'Не удалось загрузить файл';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          // Игнорируем ошибку парсинга
        }
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error: any) {
      const err = { message: error.message || 'Не удалось загрузить файл', status: 500 };
      await handleApiError(err);
      throw err;
    }
  }

  async checkPhone(data: { phone: string }) {
    return this.request('/users/check-phone', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Transfers
  async transferByPhone(data: TransferByPhoneParams) {
    return this.request('/transactions/phone', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async internalTransfer(data: {
    fromAccountId: string;
    toAccountId: string;
    amount: number;
  }) {
    return this.request('/transactions/self-transfer', {
      method: 'POST',
      body: JSON.stringify({
        fromAccountId: data.fromAccountId,
        toAccountId: data.toAccountId,
        amount: data.amount,
      }),
    });
  }

  // Transactions
  async getTransactions(filters?: {
    type?: string;
    startDate?: string;
    endDate?: string;
    minAmount?: number;
    maxAmount?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) queryParams.append(key, String(value));
      });
    }
    const query = queryParams.toString();
    return this.request(`/transactions/history${query ? `?${query}` : ''}`);
  }

  async getTransactionDetails(transactionId: string) {
    return this.request(`/transactions/${transactionId}`);
  }

  // Statements
  async downloadStatement(data: {
    format: 'pdf' | 'excel';
    startDate: string;
    endDate: string;
  }) {
    const queryParams = new URLSearchParams({
      format: data.format,
      startDate: data.startDate,
      endDate: data.endDate,
    });
    return `${API_BASE_URL}/transactions/download?${queryParams.toString()}`;
  }

  async downloadStatementFile(data: {
    format: 'pdf' | 'excel';
    startDate: string;
    endDate: string;
  }): Promise<{ blob: Blob; filename: string; contentType: string }> {
    let token = await this.getToken();
    const queryParams = new URLSearchParams({
      format: data.format,
      startDate: data.startDate,
      endDate: data.endDate,
    });

    const accept = data.format === 'pdf'
      ? 'application/pdf'
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    const makeReq = (auth?: string) => fetch(`${API_BASE_URL}/transactions/download?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
        Accept: accept,
      },
    });

    let res = await makeReq(token || undefined);

    // Try refresh on 401
    if (res.status === 401 && token) {
      const newToken = await this.refreshAccessToken();
      if (newToken) {
        token = newToken;
        res = await makeReq(newToken);
      }
    }

    if (!res.ok) {
      let message = `Ошибка запроса (${res.status})`;
      try {
        const text = await res.text();
        try {
          const parsed = text ? JSON.parse(text) : null;
          if (parsed?.message) message = parsed.message;
        } catch {
          if (text) message = text;
        }
      } catch {}
      const error = { message, status: res.status } as any;
      await handleApiError(error);
      throw error;
    }

    const contentType = res.headers.get('Content-Type') || accept;
    const disposition = res.headers.get('Content-Disposition') || '';
    let filename = '';
    const match = disposition.match(/filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i);
    if (match) {
      filename = decodeURIComponent(match[1] || match[2] || '');
    }
    if (!filename) {
      const start = data.startDate.slice(0, 10);
      const end = data.endDate.slice(0, 10);
      const ext = data.format === 'pdf' ? 'pdf' : 'xlsx';
      filename = `statement_${start}_${end}.${ext}`;
    }

    const blob = await res.blob();
    return { blob, filename, contentType };
  }
}

export const apiService = new ApiService();
