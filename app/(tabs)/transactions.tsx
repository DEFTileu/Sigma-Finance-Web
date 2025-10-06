import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, TextInput, Modal } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Filter, Search, Calendar } from 'lucide-react-native';
import { apiService } from '@/services/api';
import TransactionReceipt from '@/components/TransactionReceipt';

interface Transaction {
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

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  // Загружаем актуальные данные при каждом возврате на страницу
  useFocusEffect(
    React.useCallback(() => {
      loadTransactions();
    }, [])
  );

  useEffect(() => {
    applyFilters();
  }, [transactions, searchQuery, filterType]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const transactionsData = await apiService.getTransactions();
      setTransactions(transactionsData);
    } catch (error) {
      console.error('Error loading transactions:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить историю операций');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = transactions;

    if (filterType !== 'all') {
      if (filterType === 'incoming') {
        filtered = filtered.filter(t => t.direction === 'INCOMING');
      } else if (filterType === 'outgoing') {
        filtered = filtered.filter(t => t.direction === 'OUTGOING');
      } else {
        filtered = filtered.filter(t => t.type.toLowerCase() === filterType.toLowerCase());
      }
    }

    if (searchQuery) {
      filtered = filtered.filter(t => 
        (t.counterpartyName && t.counterpartyName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.counterpartyPhone && t.counterpartyPhone.includes(searchQuery)) ||
        (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        t.amount.toString().includes(searchQuery)
      );
    }

    setFilteredTransactions(filtered);
  };

  const getTransactionIcon = (direction: string, type: string) => {
    if (direction === 'INCOMING') return '↙️';
    if (direction === 'OUTGOING') return '↗️';

    switch (type.toLowerCase()) {
      case 'deposit': return '💰';
      case 'withdrawal': return '💸';
      default: return '💳';
    }
  };

  const getTransactionColor = (direction: string) => {
    return direction === 'INCOMING' ? '#059669' : '#DC2626';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTransactionTitle = (transaction: Transaction) => {
    if (transaction.type === 'TRANSFER') {
      return transaction.direction === 'INCOMING' ? 'Поступление' : 'Перевод';
    }
    switch (transaction.type.toLowerCase()) {
      case 'deposit': return 'Пополнение';
      case 'withdrawal': return 'Списание';
      default: return 'Операция';
    }
  };

  const getTransactionSubtitle = (transaction: Transaction) => {
    if (transaction.counterpartyName) {
      return transaction.counterpartyName;
    }
    if (transaction.direction === 'INCOMING' && transaction.sourceAccountNumber) {
      return `С карты ${transaction.sourceAccountNumber}`;
    }
    if (transaction.direction === 'OUTGOING' && transaction.targetAccountNumber) {
      return `На карту ${transaction.targetAccountNumber}`;
    }
    return transaction.description || 'Системная операция';
  };

  const getStatusText = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLETED': return 'Завершено';
      case 'PENDING': return 'В обработке';
      case 'FAILED': return 'Отклонено';
      default: return status;
    }
  };

  const handleTransactionPress = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowReceipt(true);
  };

  const handleCloseReceipt = () => {
    setShowReceipt(false);
    setSelectedTransaction(null);
  };

  const handleShareReceipt = () => {
    Alert.alert('Поделиться', 'Функция поделиться чеком');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Загрузка операций...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>История операций</Text>
        <TouchableOpacity onPress={() => setShowFilters(!showFilters)}>
          <Filter size={24} color="#1E293B" />
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View style={styles.filtersContainer}>
          <View style={styles.searchContainer}>
            <Search size={20} color="#64748B" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Поиск по операциям..."
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterButtons}>
            <TouchableOpacity
              style={[styles.filterButton, filterType === 'all' && styles.filterButtonActive]}
              onPress={() => setFilterType('all')}
            >
              <Text style={[styles.filterButtonText, filterType === 'all' && styles.filterButtonTextActive]}>
                Все
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filterType === 'incoming' && styles.filterButtonActive]}
              onPress={() => setFilterType('incoming')}
            >
              <Text style={[styles.filterButtonText, filterType === 'incoming' && styles.filterButtonTextActive]}>
                Поступления
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filterType === 'outgoing' && styles.filterButtonActive]}
              onPress={() => setFilterType('outgoing')}
            >
              <Text style={[styles.filterButtonText, filterType === 'outgoing' && styles.filterButtonTextActive]}>
                Переводы
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filterType === 'transfer' && styles.filterButtonActive]}
              onPress={() => setFilterType('transfer')}
            >
              <Text style={[styles.filterButtonText, filterType === 'transfer' && styles.filterButtonTextActive]}>
                Переводы
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filterType === 'deposit' && styles.filterButtonActive]}
              onPress={() => setFilterType('deposit')}
            >
              <Text style={[styles.filterButtonText, filterType === 'deposit' && styles.filterButtonTextActive]}>
                Пополнения
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      <ScrollView style={styles.transactionsList}>
        {filteredTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Calendar size={48} color="#94A3B8" />
            <Text style={styles.emptyText}>Операции не найдены</Text>
          </View>
        ) : (
          filteredTransactions.map((transaction) => (
            <TouchableOpacity
              key={transaction.id}
              style={styles.transactionItem}
              onPress={() => handleTransactionPress(transaction)}
            >
              <View style={styles.transactionIcon}>
                <Text style={styles.transactionIconText}>
                  {getTransactionIcon(transaction.direction, transaction.type)}
                </Text>
              </View>
              
              <View style={styles.transactionInfo}>
                <Text style={styles.transactionTitle}>
                  {getTransactionTitle(transaction)}
                </Text>
                <Text style={styles.transactionSubtitle}>
                  {getTransactionSubtitle(transaction)}
                </Text>
                <Text style={styles.transactionDate}>
                  {formatDate(transaction.createdAt)} в {formatTime(transaction.createdAt)}
                </Text>
              </View>

              <View style={styles.transactionAmount}>
                <Text style={[styles.amount, { color: getTransactionColor(transaction.direction) }]}>
                  {transaction.direction === 'OUTGOING' ? '-' : '+'}
                  {transaction.amount.toLocaleString('ru-RU', { minimumFractionDigits: 2 })} {transaction.currency}
                </Text>
                <Text style={styles.status}>{getStatusText(transaction.status)}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Модальное окно с чеком транзакции */}
      <Modal
        visible={showReceipt}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseReceipt}
      >
        {selectedTransaction && (
          <TransactionReceipt
            transaction={{
              id: selectedTransaction.id,
              amount: selectedTransaction.amount,
              currency: selectedTransaction.currency,
              sourceAccountNumber: selectedTransaction.sourceAccountNumber || '',
              targetAccountNumber: selectedTransaction.targetAccountNumber || '',
              counterpartyName: selectedTransaction.counterpartyName || '',
              counterpartyPhone: selectedTransaction.counterpartyPhone,
              createdAt: selectedTransaction.createdAt,
              status: selectedTransaction.status,
              type: selectedTransaction.type,
              direction: selectedTransaction.direction,
              description: selectedTransaction.description || undefined,
            }}
            onClose={handleCloseReceipt}
            onShare={handleShareReceipt}
          />
        )}
      </Modal>
    </View>
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
    color: '#1E293B',
  },
  filtersContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1E293B',
  },
  filterButtons: {
    flexDirection: 'row',
  },
  filterButton: {
    backgroundColor: 'white',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterButtonActive: {
    backgroundColor: '#1E3A8A',
    borderColor: '#1E3A8A',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#64748B',
  },
  filterButtonTextActive: {
    color: 'white',
  },
  transactionsList: {
    flex: 1,
    paddingHorizontal: 20,
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
  transactionItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionIconText: {
    fontSize: 20,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  transactionSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#94A3B8',
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  status: {
    fontSize: 12,
    color: '#64748B',
    textTransform: 'capitalize',
  },
});