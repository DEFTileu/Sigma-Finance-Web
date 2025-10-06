import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { apiService } from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Register() {
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [username, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Функция форматирования телефона в формате +7(XXX) XXX XXXX
  const formatPhoneNumber = (value: string) => {
    // Удаляем все, кроме цифр
    const numbers = value.replace(/\D/g, '');

    // Если начинается с 8, заменяем на 7
    let cleaned = numbers;
    if (cleaned.startsWith('8')) {
      cleaned = '7' + cleaned.slice(1);
    }

    // Ограничиваем до 11 цифр (7 + 10 цифр)
    if (cleaned.length > 11) {
      cleaned = cleaned.slice(0, 11);
    }

    // Форматируем
    if (cleaned.length === 0) {
      return '';
    }

    let formatted = '+7';

    if (cleaned.length > 1) {
      formatted += '(' + cleaned.slice(1, 4);
    }

    if (cleaned.length >= 5) {
      formatted += ') ' + cleaned.slice(4, 7);
    }

    if (cleaned.length >= 8) {
      formatted += ' ' + cleaned.slice(7, 11);
    }

    return formatted;
  };

  // Функция для получения чистого номера (только цифры) для отправки на бэкенд
  const getCleanPhoneNumber = (formatted: string) => {
    const numbers = formatted.replace(/\D/g, '');
    if (numbers.startsWith('7')) {
      return '+' + numbers;
    }
    return formatted;
  };

  // Обработчик изменения номера телефона с форматированием
  const handlePhoneChange = (raw: string) => {
    const formatted = formatPhoneNumber(raw);
    setPhoneNumber(formatted);
  };

  const validateForm = () => {
    if (!name || !surname || !username || !phoneNumber || !password || !confirmPassword) {
      Alert.alert('Ошибка', 'Пожалуйста, заполните все поля');
      return false;
    }

    // Проверяем, что номер телефона полностью введен (11 цифр)
    const numbers = phoneNumber.replace(/\D/g, '');
    if (numbers.length !== 11) {
      Alert.alert('Ошибка', 'Введите полный номер телефона в формате +7(XXX) XXX XXXX');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Ошибка', 'Пароли не совпадают');
      return false;
    }

    if (password.length < 6) {
      Alert.alert('Ошибка', 'Пароль должен содержать минимум 6 символов');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const cleanPhone = getCleanPhoneNumber(phoneNumber);
      console.log('Attempting registration with:', { name, surname, username, phoneNumber: cleanPhone });
      const response = await apiService.register({
        name,
        surname,
        username,
        phoneNumber: cleanPhone,
        password,
      });
      
      console.log('Registration response:', response);

      // Если регистрация вернула токены, автоматически авторизуем пользователя
      if (response.accessToken) {
        await AsyncStorage.setItem('jwt_token', response.accessToken);
        console.log('Access token saved after registration');

        if (response.refreshToken) {
          await AsyncStorage.setItem('refresh_token', response.refreshToken);
          console.log('Refresh token saved after registration');
        }

        if (response.user && response.user.id) {
          await AsyncStorage.setItem('user_id', response.user.id.toString());
          await AsyncStorage.setItem('user_data', JSON.stringify(response.user));
          console.log('User data saved after registration');
        }

        // Переходим сразу в главное приложение
        router.replace('/(tabs)');

        setTimeout(() => {
          Alert.alert('Успешно', 'Добро пожаловать в Sigma Finance!');
        }, 500);
      } else {
        // Если токены не вернулись, переходим к логину
        router.replace('/login');
        setTimeout(() => {
          Alert.alert('Успешно', 'Регистрация завершена! Войдите в свой аккаунт.');
        }, 500);
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Ошибка', 'Не удалось создать аккаунт. Попробуйте еще раз.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Создать аккаунт</Text>
            <Text style={styles.subtitle}>Присоединяйтесь к Sigma Finance</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Имя</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Введите имя"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Фамилия</Text>
              <TextInput
                style={styles.input}
                value={surname}
                onChangeText={setSurname}
                placeholder="Введите фамилию"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setEmail}
                placeholder="example@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Телефон</Text>
              <TextInput
                style={styles.input}
                value={phoneNumber}
                onChangeText={handlePhoneChange}
                placeholder="+7(999) 123 4567"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Пароль</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Минимум 6 символов"
                secureTextEntry
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Подтверждение пароля</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Повторите пароль"
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Создание аккаунта...' : 'Создать аккаунт'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => router.push('/login')}
            >
              <Text style={styles.linkText}>
                Уже есть аккаунт? Войти
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1E293B',
  },
  button: {
    backgroundColor: '#1E3A8A',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: '#94A3B8',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  linkButton: {
    alignItems: 'center',
  },
  linkText: {
    color: '#1E3A8A',
    fontSize: 16,
  },
});