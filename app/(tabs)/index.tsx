import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Eye, EyeOff, Send, Repeat, FileText, CreditCard } from 'lucide-react-native';
import { apiService } from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Account {
  id: string;
  accountNumber: string;
  balance: number;
  currency: string;
  accountType: string;
}

interface BonusAccount {
  balance: number;
  currency: string;
}

export default function Dashboard() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [bonusAccount, setBonusAccount] = useState<BonusAccount | null>(null);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Загружаем актуальные данные при каждом возврате на страницу
  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const token = await AsyncStorage.getItem('jwt_token');
      if (!token) {
        router.replace('/login');
        return;
      }

      const accountsData = await apiService.getAccounts();

      // Разделяем обычные счета и бонусный счет
      const regularAccounts = accountsData.filter((account: Account) => account.accountType !== 'BONUS');
      const bonusAccounts = accountsData.filter((account: Account) => account.accountType === 'BONUS');

      setAccounts(regularAccounts);

      // Если есть бонусный счет, используем его данные
      if (bonusAccounts.length > 0) {
        const bonusAcc = bonusAccounts[0];
        setBonusAccount({
          balance: bonusAcc.balance,
          currency: bonusAcc.currency
        });
      } else {
        setBonusAccount(null);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить данные');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const formatBalance = (balance: number, currency: string) => {
    if (!balanceVisible) return '••••••';

    if (balance === undefined || balance === null || isNaN(balance)) {
      return `0.00 ${currency || 'KZT'}`;
    }

    return `${balance.toLocaleString('ru-RU', { minimumFractionDigits: 2 })} ${currency || 'KZT'}`;
  };

  const getAccountTypeColor = (type: string) => {
    if (!type || typeof type !== 'string') {
      return '#1E3A8A';
    }

    switch (type.toLowerCase()) {
      case 'checking': return '#1E3A8A';
      case 'savings': return '#059669';
      case 'credit': return '#DC2626';
      case 'bonus': return '#F59E0B';
      default: return '#1E3A8A';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Загрузка...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Sigma Finance</Text>
        <TouchableOpacity onPress={() => setBalanceVisible(!balanceVisible)}>
          {balanceVisible ? (
            <EyeOff size={24} color="#64748B" />
          ) : (
            <Eye size={24} color="#64748B" />
          )}
        </TouchableOpacity>
      </View>

      {bonusAccount && (
        <View style={[styles.card, styles.bonusCard]}>
          <Text style={styles.bonusTitle}>Бонусный счёт</Text>
          <Text style={styles.bonusBalance}>
            {formatBalance(bonusAccount.balance, bonusAccount.currency)}
          </Text>
        </View>
      )}

      <View style={styles.accountsSection}>
        <Text style={styles.sectionTitle}>Мои счета</Text>
        {accounts.length === 0 ? (
          <View style={styles.emptyAccountsContainer}>
            <Text style={styles.emptyAccountsText}>
              У вас пока нет дополнительных счетов
            </Text>
          </View>
        ) : (
          accounts.map((account) => (
            <View key={account.id} style={styles.accountCard}>
              <View style={styles.accountInfo}>
                <View
                  style={[
                    styles.accountTypeIndicator,
                    { backgroundColor: getAccountTypeColor(account.accountType) }
                  ]}
                />
                <View style={styles.accountDetails}>
                  <Text style={styles.accountNumber}>
                    •••• {account.accountNumber.slice(-4)}
                  </Text>
                  <Text style={styles.accountType}>
                    {account.accountType}
                  </Text>
                </View>
              </View>
              <Text style={styles.accountBalance}>
                {formatBalance(account.balance, account.currency)}
              </Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>Быстрые действия</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/transfer-phone')}
          >
            <Send size={24} color="#1E3A8A" />
            <Text style={styles.actionText}>Перевод</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/transfer-internal')}
          >
            <Repeat size={24} color="#1E3A8A" />
            <Text style={styles.actionText}>Между счетами</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/statement')}
          >
            <FileText size={24} color="#1E3A8A" />
            <Text style={styles.actionText}>Выписка</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/cards')}
          >
            <CreditCard size={24} color="#1E3A8A" />
            <Text style={styles.actionText}>Карты</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E3A8A',
  },
  card: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bonusCard: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  bonusTitle: {
    fontSize: 16,
    color: '#92400E',
    marginBottom: 8,
  },
  bonusBalance: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#92400E',
  },
  accountsSection: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  emptyAccountsContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyAccountsText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
  },
  accountCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountTypeIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  accountDetails: {
    flex: 1,
  },
  accountNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  accountType: {
    fontSize: 14,
    color: '#64748B',
    textTransform: 'capitalize',
  },
  accountBalance: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  actionsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: 'white',
    width: '48%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  actionText: {
    fontSize: 14,
    color: '#1E293B',
    marginTop: 8,
    textAlign: 'center',
  },
});