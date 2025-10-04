type ErrorCallback = (message: string) => void;

let globalErrorHandler: ErrorCallback | null = null;

interface ErrorResponse {
  message: string;
  status?: number;
}

export const setGlobalErrorHandler = (handler: ErrorCallback) => {
  globalErrorHandler = handler;
};

export const handleApiError = async (error: any) => {
  let errorMessage = 'Произошла ошибка';

  // Проверяем, есть ли сообщение об ошибке напрямую
  if (error.message) {
    errorMessage = error.message;
  } else if (error.response) {
    try {
      const errorData: ErrorResponse = await error.response.json();
      errorMessage = errorData.message || errorMessage;
    } catch (e) {
      // Если не удалось распарсить JSON, используем стандартные сообщения
      const status = error.status || error.response.status;
      switch (status) {
        case 400:
          errorMessage = 'Неверный запрос';
          break;
        case 401:
          errorMessage = 'Необходима авторизация';
          break;
        case 403:
          errorMessage = 'Доступ запрещен';
          break;
        case 404:
          errorMessage = 'Ресурс не найден';
          break;
        case 500:
          errorMessage = 'Внутренняя ошибка сервера';
          break;
      }
    }
  } else if (error.request) {
    errorMessage = 'Ошибка сети. Проверьте подключение к интернету';
  }

  if (globalErrorHandler) {
    globalErrorHandler(errorMessage);
  }

  throw error;
};
