import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { apiService } from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TestAuth() {
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const testLogin = async () => {
    try {
      addResult('🔄 Тестирование входа...');
      const response = await apiService.login({
        username: 'test@example.com',
        password: 'testpassword123'
      });
      
      if (response.accessToken) {
        addResult('✅ Вход успешен');
        addResult(`   - Access Token: ${response.accessToken ? '✅' : '❌'}`);
        addResult(`   - Refresh Token: ${response.refreshToken ? '✅' : '❌'}`);
        addResult(`   - User Data: ${response.user ? '✅' : '❌'}`);
      } else {
        addResult('❌ Вход не удался: нет токена');
      }
    } catch (error) {
      addResult(`❌ Ошибка входа: ${error.message}`);
    }
  };

  const testAccounts = async () => {
    try {
      addResult('🔄 Тестирование доступа к аккаунтам...');
      const accounts = await apiService.getAccounts();
      addResult('✅ Доступ к аккаунтам работает');
      addResult(`   - Количество аккаунтов: ${accounts.length}`);
    } catch (error) {
      addResult(`❌ Ошибка доступа к аккаунтам: ${error.message}`);
    }
  };

  const testLogout = async () => {
    try {
      addResult('🔄 Тестирование выхода...');
      await apiService.logout();
      addResult('✅ Выход выполнен');
      
      // Проверяем, что токены удалены
      const token = await AsyncStorage.getItem('jwt_token');
      const refreshToken = await AsyncStorage.getItem('refresh_token');
      addResult(`   - JWT Token удален: ${!token ? '✅' : '❌'}`);
      addResult(`   - Refresh Token удален: ${!refreshToken ? '✅' : '❌'}`);
    } catch (error) {
      addResult(`❌ Ошибка выхода: ${error.message}`);
    }
  };

  const checkTokens = async () => {
    try {
      addResult('🔄 Проверка токенов...');
      const token = await AsyncStorage.getItem('jwt_token');
      const refreshToken = await AsyncStorage.getItem('refresh_token');
      const userId = await AsyncStorage.getItem('user_id');
      const userData = await AsyncStorage.getItem('user_data');
      
      addResult(`   - JWT Token: ${token ? '✅' : '❌'}`);
      addResult(`   - Refresh Token: ${refreshToken ? '✅' : '❌'}`);
      addResult(`   - User ID: ${userId ? '✅' : '❌'}`);
      addResult(`   - User Data: ${userData ? '✅' : '❌'}`);
    } catch (error) {
      addResult(`❌ Ошибка проверки токенов: ${error.message}`);
    }
  };

  const runAllTests = async () => {
    clearResults();
    addResult('🚀 Запуск всех тестов...');
    
    await checkTokens();
    await testLogin();
    await testAccounts();
    await testLogout();
    await checkTokens();
    
    addResult('🏁 Все тесты завершены!');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Тест аутентификации</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={testLogin}>
          <Text style={styles.buttonText}>Тест входа</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={testAccounts}>
          <Text style={styles.buttonText}>Тест аккаунтов</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={testLogout}>
          <Text style={styles.buttonText}>Тест выхода</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={checkTokens}>
          <Text style={styles.buttonText}>Проверить токены</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={runAllTests}>
          <Text style={styles.buttonText}>Все тесты</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.clearButton]} onPress={clearResults}>
          <Text style={styles.buttonText}>Очистить</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.resultsContainer}>
        {testResults.map((result, index) => (
          <Text key={index} style={styles.resultText}>
            {result}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#64748B',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#1E3A8A',
  },
  clearButton: {
    backgroundColor: '#DC2626',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
  },
  resultText: {
    fontSize: 14,
    color: '#1E293B',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
});

