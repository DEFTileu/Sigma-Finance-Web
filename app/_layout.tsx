import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { apiService } from '@/services/api';
import { ToastProvider, useToast } from '@/context/ToastContext';

function RootLayoutContent() {
  const { showToast } = useToast();
  useFrameworkReady();

  useEffect(() => {
    // Инициализация глобального обработчика ошибок
    import('@/services/apiErrorHandler').then(({ setGlobalErrorHandler }) => {
      setGlobalErrorHandler((message) => {
        showToast(message, 'error');
      });
    });

    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('jwt_token');
      if (token) {
        try {
          await apiService.getAccounts();
          router.replace('/(tabs)');
        } catch (error) {
          await AsyncStorage.multiRemove(['jwt_token', 'refresh_token', 'user_id', 'user_data']);
          router.replace('/login');
        }
      } else {
        router.replace('/login');
      }
    } catch (error) {
      router.replace('/login');
    }
  };

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="transfer-phone" />
        <Stack.Screen name="transfer-internal" />
        <Stack.Screen name="statement" />
        <Stack.Screen name="test-auth" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}

export default function RootLayout() {
  return (
    <ToastProvider>
      <RootLayoutContent />
    </ToastProvider>
  );
}
