import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { CreditCard, Eye, EyeOff, LogOut } from 'lucide-react-native';
import { apiService } from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Account {
  id: string;
  accountNumber: string;
  accountType: string;
  balance: number;
  currency: string;
  status: string;
  owner: any;
  createdAt: string;
  updatedAt: string;
}

export default function Cards() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCards, setVisibleCards] = useState<{ [key: string]: boolean }>({});
  const { showToast } = useToast();

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    try {
      setLoading(true);
      const accountsData = await apiService.getAccounts();
      setAccounts(accountsData);
    } catch (error) {
      console.error('Error loading accounts:', error);
      // Toast будет показан автоматически через глобальный обработчик ошибок
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Локально очищаем хранилище и выходим
      await AsyncStorage.multiRemove(['jwt_token', 'refresh_token', 'user_id', 'user_data']);
      showToast('Вы вышли из аккаунта', 'info');
      router.replace('/login');
    } catch (error) {
      console.error('Error during logout:', error);
      // Toast будет показан автоматически через глобальный обработчик ошибок
    }
  };

  const toggleCardVisibility = (cardId: string) => {
    setVisibleCards(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };

  const formatAccountNumber = (number: string, isVisible: boolean) => {
    if (!isVisible) {
      return `•••• •••• •••• ${number.slice(-4)}`;
    }
    return number.replace(/(.{4})/g, '$1 ').trim();
  };

  const getAccountTypeColor = (type: string) => {
    if (!type) {
      return '#1E3A8A';
    }

    switch (type.toLowerCase()) {
      case 'bonus': return '#4DB45E';
      case 'debit': return '#1A1F71';
      case 'credit': return '#EB001B';
      case 'savings': return '#7C3AED';
      default: return '#1E3A8A';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Загрузка счетов...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Мои счета</Text>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <LogOut color="#EF4444" size={24} />
          </TouchableOpacity>
        </View>
      </View>

      {accounts.length === 0 ? (
        <View style={styles.emptyState}>
          <CreditCard size={64} color="#94A3B8" />
          <Text style={styles.emptyText}>У вас пока нет счетов</Text>
        </View>
      ) : (
        <View style={styles.cardsContainer}>
          {accounts.map((account) => (
            <View key={account.id} style={[styles.cardContainer, { borderLeftColor: getAccountTypeColor(account.accountType) }]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.cardType, { color: getAccountTypeColor(account.accountType) }]}>
                  {account.accountType ? account.accountType.toUpperCase() : 'СЧЕТ'}
                </Text>
                <TouchableOpacity onPress={() => toggleCardVisibility(account.id)}>
                  {visibleCards[account.id] ? <EyeOff color="#1E293B" /> : <Eye color="#1E293B" />}
                </TouchableOpacity>
              </View>

              <View style={styles.cardInfo}>
                <View style={styles.cardNumberContainer}>
                  <Text style={styles.cardNumberLabel}>Номер счета</Text>
                  <Text style={styles.cardNumber}>
                    {formatAccountNumber(account.accountNumber, visibleCards[account.id] || false)}
                  </Text>
                </View>

                <View style={styles.cardDetailsRow}>
                  <View style={styles.cardDetail}>
                    <Text style={styles.cardDetailLabel}>Баланс</Text>
                    <Text style={styles.cardDetailValue}>
                      {visibleCards[account.id] ? `${account.balance} ${account.currency}` : '•••• •••'}
                    </Text>
                  </View>

                  <View style={styles.cardDetail}>
                    <Text style={styles.cardDetailLabel}>Статус</Text>
                    <Text style={styles.cardDetailValue}>
                      {visibleCards[account.id] ? account.status : '••••••'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  logoutButton: {
    padding: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 16,
  },
  cardsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  cardContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardType: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  cardInfo: {
    flex: 1,
  },
  cardNumberContainer: {
    marginBottom: 20,
  },
  cardNumberLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardNumber: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'monospace',
  },
  cardDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardDetail: {
    flex: 1,
  },
  cardDetailLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardDetailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'monospace',
  },
});