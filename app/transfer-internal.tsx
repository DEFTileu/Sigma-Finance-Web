import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Modal } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { ArrowLeft, ChevronDown } from 'lucide-react-native';
import { apiService } from '@/services/api';
import TransactionReceipt from '@/components/TransactionReceipt';

interface Account {
  id: string;
  accountNumber: string;
  balance: number;
  currency: string;
  accountType: string;
}

interface TransactionHistory {
  id: string;
  amount: number;
  currency: string;
  sourceAccountNumber: string;
  destinationAccountNumber: string;
  sourceAccountType?: string;
  destinationAccountType?: string;
  transactionDate: string;
  status: string;
  transactionType?: string;
  description?: string;
}

export default function TransferInternal() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [fromAccount, setFromAccount] = useState<Account | null>(null);
  const [toAccount, setToAccount] = useState<Account | null>(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showReceipt, setShowReceipt] = useState(false);
  const [transactionData, setTransactionData] = useState<TransactionHistory | null>(null);

  // Загружаем свежие данные при входе на страницу
  useFocusEffect(
    React.useCallback(() => {
      loadAccounts();
    }, [])
  );

  const loadAccounts = async () => {
    try {
      setInitialLoading(true);
      const accountsData = await apiService.getAccounts();
      setAccounts(accountsData);
    } catch (error) {
      console.error('Error loading accounts:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить счета');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!fromAccount || !toAccount || !amount) {
      Alert.alert('Ошибка', 'Заполните все поля');
      return;
    }

    if (fromAccount.id === toAccount.id) {
      Alert.alert('Ошибка', 'Нельзя перевести на тот же счёт');
      return;
    }

    if (parseFloat(amount) <= 0) {
      Alert.alert('Ошибка', 'Сумма должна быть больше 0');
      return;
    }

    if (parseFloat(amount) > fromAccount.balance) {
      Alert.alert('Ошибка', 'Недостаточно средств на счёте');
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.internalTransfer({
        fromAccountId: fromAccount.id,
        toAccountId: toAccount.id,
        amount: parseFloat(amount),
      });

      // Сохраняем данные транзакции из ответа API
      setTransactionData({
        id: response.id || response.transactionId || 'N/A',
        amount: parseFloat(amount),
        currency: fromAccount.currency,
        sourceAccountNumber: fromAccount.accountNumber,
        destinationAccountNumber: toAccount.accountNumber,
        sourceAccountType: fromAccount.accountType,
        destinationAccountType: toAccount.accountType,
        transactionDate: response.transactionDate || response.date || new Date().toISOString(),
        status: response.status || 'SUCCESS',
        transactionType: response.transactionType || response.type || 'SELF_TRANSFER',
        description: response.description,
      });

      // Показываем чек
      setShowReceipt(true);

      // Обновляем список счетов для актуальных балансов
      await loadAccounts();

      // Сбрасываем форму
      setAmount('');
      setFromAccount(null);
      setToAccount(null);
    } catch (error: any) {
      console.error('Transfer error:', error);
      Alert.alert('Ошибка', error.message || 'Не удалось выполнить перевод');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseReceipt = () => {
    setShowReceipt(false);
    setTransactionData(null);
  };

  const handleShareReceipt = () => {
    // Здесь можно добавить логику для шаринга чека
    Alert.alert('Функция поделиться', 'Скоро будет доступна');
  };

  const AccountSelector = ({
    title, 
    selectedAccount, 
    onSelect, 
    excludeAccount 
  }: {
    title: string;
    selectedAccount: Account | null;
    onSelect: (account: Account) => void;
    excludeAccount?: Account | null;
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const availableAccounts = excludeAccount
      ? accounts.filter(acc => acc.id !== excludeAccount.id)
      : accounts;

    return (
      <View style={styles.inputContainer}>
        <Text style={styles.label}>{title}</Text>
        <TouchableOpacity
          style={styles.selectorButton}
          onPress={() => setIsOpen(!isOpen)}
          disabled={initialLoading}
        >
          <Text style={[styles.selectorText, !selectedAccount && styles.placeholderText]}>
            {selectedAccount 
              ? `${selectedAccount.accountType} (•••• ${selectedAccount.accountNumber.slice(-4)}) - ${selectedAccount.balance.toFixed(2)} ${selectedAccount.currency}`
              : 'Выберите счёт'
            }
          </Text>
          <ChevronDown size={20} color="#64748B" />
        </TouchableOpacity>
        
        {isOpen && (
          <View style={styles.dropdown}>
            {availableAccounts.length === 0 ? (
              <View style={styles.dropdownItem}>
                <Text style={styles.dropdownItemText}>Нет доступных счетов</Text>
              </View>
            ) : (
              availableAccounts.map((account) => (
                <TouchableOpacity
                  key={account.id}
                  style={styles.dropdownItem}
                  onPress={() => {
                    onSelect(account);
                    setIsOpen(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>
                    {account.accountType} (•••• {account.accountNumber.slice(-4)})
                  </Text>
                  <Text style={styles.dropdownItemBalance}>
                    {account.balance.toFixed(2)} {account.currency}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
      </View>
    );
  };

  if (initialLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.title}>Перевод между счетами</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E3A8A" />
          <Text style={styles.loadingText}>Загрузка счетов...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.title}>Перевод между счетами</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <AccountSelector
          title="Со счёта"
          selectedAccount={fromAccount}
          onSelect={(account) => {
            setFromAccount(account);
            // Если выбранный счёт получателя совпадает с новым отправителем, сбрасываем получателя
            if (toAccount?.id === account.id) {
              setToAccount(null);
            }
          }}
          excludeAccount={null}
        />

        <AccountSelector
          title="На счёт"
          selectedAccount={toAccount}
          onSelect={setToAccount}
          excludeAccount={fromAccount}
        />

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Сумма</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={(raw) => {
              const replaced = raw.replace(/,/g, '.');
              let cleaned = replaced.replace(/[^0-9.]/g, '');
              const parts = cleaned.split('.');
              if (parts.length > 2) {
                cleaned = parts[0] + '.' + parts.slice(1).join('');
              }
              setAmount(cleaned);
            }}
            placeholder="0.00"
            keyboardType="decimal-pad"
          />
          {fromAccount && (
            <Text style={styles.balanceHint}>
              Доступно: {fromAccount.balance.toFixed(2)} {fromAccount.currency}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={[styles.transferButton, loading && styles.transferButtonDisabled]}
          onPress={handleTransfer}
          disabled={loading}
        >
          <Text style={styles.transferButtonText}>
            {loading ? 'Выполнение...' : 'Выполнить перевод'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Модальное окно с чеком */}
      <Modal
        visible={showReceipt}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseReceipt}
      >
        {transactionData && (
          <TransactionReceipt
            transaction={{
              id: transactionData.id,
              amount: transactionData.amount,
              currency: transactionData.currency,
              fromAccountNumber: transactionData.sourceAccountNumber,
              toAccountNumber: transactionData.destinationAccountNumber,
              fromAccountType: transactionData.sourceAccountType,
              toAccountType: transactionData.destinationAccountType,
              date: transactionData.transactionDate,
              status: transactionData.status,
              type: transactionData.transactionType,
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
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
  balanceHint: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  selectorButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectorText: {
    fontSize: 16,
    color: '#1E293B',
    flex: 1,
  },
  placeholderText: {
    color: '#94A3B8',
  },
  dropdown: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#1E293B',
    marginBottom: 4,
  },
  dropdownItemBalance: {
    fontSize: 14,
    color: '#64748B',
  },
  transferButton: {
    backgroundColor: '#1E3A8A',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  transferButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  transferButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
  },
});

