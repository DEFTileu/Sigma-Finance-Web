import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Copy, Share } from 'lucide-react-native';
import { apiService } from '@/services/api';
import TransactionReceipt from '@/components/TransactionReceipt';

interface TransactionDetails {
  id: string;
  type: string; // "TRANSFER", "DEPOSIT", "WITHDRAWAL", etc.
  direction: string; // "INCOMING", "OUTGOING"
  status: string; // "COMPLETED", "PENDING", "FAILED"
  amount: number;
  currency: string;
  description?: string | null;
  sourceAccountId?: string;
  sourceAccountNumber?: string;
  targetAccountId?: string;
  targetAccountNumber?: string;
  counterpartyName?: string;
  counterpartyPhone?: string;
  createdAt: string;
  updatedAt: string;
}

export default function TransactionDetails() {
  const { id } = useLocalSearchParams();
  const [transaction, setTransaction] = useState<TransactionDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactionDetails();
  }, [id]);

  const loadTransactionDetails = async () => {
    try {
      setLoading(true);
      const transactionData = await apiService.getTransactionDetails(id as string);
      setTransaction(transactionData);
    } catch (error) {
      console.error('Error loading transaction details:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить детали операции');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const copyTransactionNumber = () => {
    if (transaction) {
      // In a real app, you would use Clipboard API
      Alert.alert('Скопировано', `Номер операции ${transaction.id} скопирован`);
    }
  };

  const getTransactionTypeText = (type: string, direction: string) => {
    if (type === 'TRANSFER') {
      return direction === 'INCOMING' ? 'Поступление' : 'Перевод';
    }
    switch (type.toLowerCase()) {
      case 'deposit': return 'Пополнение';
      case 'withdrawal': return 'Списание';
      default: return 'Операция';
    }
  };

  const getStatusColor = (status: string) => {
    if (!status || typeof status !== 'string') {
      return '#64748B';
    }

    switch (status.toUpperCase()) {
      case 'COMPLETED': return '#059669';
      case 'PENDING': return '#F59E0B';
      case 'FAILED': return '#DC2626';
      default: return '#64748B';
    }
  };

  const getStatusText = (status: string) => {
    if (!status || typeof status !== 'string') {
      return 'Неизвестно';
    }

    switch (status.toUpperCase()) {
      case 'COMPLETED': return 'Завершено';
      case 'PENDING': return 'В обработке';
      case 'FAILED': return 'Отклонено';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading || !transaction) {
    return (
      <View style={styles.container}>
        <Text>Загрузка...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TransactionReceipt
        transaction={{
          id: transaction.id,
          amount: transaction.amount,
          currency: transaction.currency,
          sourceAccountNumber: transaction.sourceAccountNumber || '',
          targetAccountNumber: transaction.targetAccountNumber || '',
          counterpartyName: transaction.counterpartyName || '',
          counterpartyPhone: transaction.counterpartyPhone || undefined,
          createdAt: transaction.createdAt,
          status: transaction.status,
          type: transaction.type,
          direction: transaction.direction,
          description: transaction.description || undefined
        }}
        onClose={() => router.back()}
        onShare={() => {
          // Implement share functionality
          Alert.alert('Поделиться', 'Функция поделиться чеком');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  }
});