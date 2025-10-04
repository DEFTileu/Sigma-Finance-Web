import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image, ActivityIndicator, Modal, Switch } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { ArrowLeft, User } from 'lucide-react-native';
import { apiService } from '@/services/api';
import TransactionReceipt from '@/components/TransactionReceipt';

interface Recipient {
  id: string;
  name: string;
  surname: string;
  avatar: string | null;
}

interface Account {
  id: string;
  accountNumber: string;
  balance: number;
  currency: string;
  accountType: string;
  bonusBalance?: number;
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

export default function TransferPhone() {
  const [phone, setPhone] = useState('');
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [mainAccount, setMainAccount] = useState<Account | null>(null);
  const [useBonuses, setUseBonuses] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [transactionData, setTransactionData] = useState<TransactionHistory | null>(null);
  const [userId, setUserId] = useState<string>('');

  // Загружаем свежие данные при входе на страницу
  useFocusEffect(
    React.useCallback(() => {
      loadMainAccount();
      loadUserId();
    }, [])
  );

  const loadUserId = async () => {
    try {
      const profileData = await apiService.getUserProfile();
      setUserId(profileData.id);
    } catch (error) {
      console.error('Error loading user ID:', error);
    }
  };

  const loadMainAccount = async () => {
    try {
      setInitialLoading(true);
      const accountsData = await apiService.getAccounts();

      // Ищем основной счет (CURRENT)
      const mainAcc = accountsData.find((acc: Account) =>
        acc.accountType === 'CURRENT'
      );

      // Ищем бонусный счет
      const bonusAcc = accountsData.find((acc: Account) =>
        acc.accountType === 'BONUS'
      );

      // Если нашли основной счет
      if (mainAcc) {
        setMainAccount({
          ...mainAcc,
          bonusBalance: bonusAcc ? bonusAcc.balance : 0,
        });
      } else {
        Alert.alert('Ошибка', 'Не найден основной счет');
      }
    } catch (error) {
      console.error('Error loading account:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить данные счета');
    } finally {
      setInitialLoading(false);
    }
  };

  // Оставляем только допустимые символы для телефона: ведущий + и цифры
  const handlePhoneChange = (raw: string) => {
    let value = raw.replace(/[^+\d]/g, '');
    // Разрешаем только один ведущий +
    if (value.includes('+')) {
      value = value.replace(/\+/g, '');
      value = '+' + value;
    }
    setPhone(value);
  };

  // Санитизация суммы: цифры и одна точка, заменяем запятую на точку
  const handleAmountChange = (raw: string) => {
    const replaced = raw.replace(/,/g, '.');
    // Удаляем все, кроме цифр и точки
    let cleaned = replaced.replace(/[^0-9.]/g, '');
    // Разрешаем только одну точку
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('');
    }
    setAmount(cleaned);
  };

  const checkRecipient = async () => {
    if (!phone) {
      Alert.alert('Ошибка', 'Введите номер телефона');
      return;
    }

    setChecking(true);
    try {
      const recipientData = await apiService.checkPhone({ phone });
      setRecipient(recipientData);
      console.log('Recipient data:', recipientData);
    } catch (error: any) {
      console.error('Check phone error:', error);
      Alert.alert('Ошибка', error.message || 'Получатель не найден');
      setRecipient(null);
    } finally {
      setChecking(false);
    }
  };

  const calculatePayment = () => {
    if (!mainAccount || !amount) return null;

    const transferAmount = parseFloat(amount);
    const bonusBalance = mainAccount.bonusBalance || 0;

    if (useBonuses && bonusBalance > 0) {
      const fromBonuses = Math.min(bonusBalance, transferAmount);
      const fromMain = Math.max(0, transferAmount - bonusBalance);
      return { fromBonuses, fromMain };
    }

    return { fromBonuses: 0, fromMain: transferAmount };
  };

  const handleTransfer = async () => {
    if (!recipient || !amount || !mainAccount || !userId) {
      Alert.alert('Ошибка', 'Заполните все поля');
      return;
    }

    if (parseFloat(amount) <= 0) {
      Alert.alert('Ошибка', 'Сумма должна быть больше 0');
      return;
    }

    const payment = calculatePayment();
    if (payment && payment.fromMain > mainAccount.balance) {
      Alert.alert('Ошибка', 'Недостаточно средств на счёте');
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.transferByPhone({
        sourceAccountId: userId,
        destinationAccountId: recipient.id,
        amount: parseFloat(amount),
        description: description || undefined,
        useBonuses,
      });

      // Сохраняем данные транзакции из ответа API
      setTransactionData({
        id: response.id || response.transactionId || 'N/A',
        amount: parseFloat(amount),
        currency: mainAccount.currency,
        sourceAccountNumber: mainAccount.accountNumber,
        destinationAccountNumber: recipient.id,
        sourceAccountType: mainAccount.accountType,
        transactionDate: response.transactionDate || response.date || new Date().toISOString(),
        status: response.status || 'SUCCESS',
        transactionType: response.transactionType || response.type || 'PHONE_TRANSFER',
        description: description,
      });

      // Показываем чек
      setShowReceipt(true);

      // Обновляем счет для актуальных балансов
      await loadMainAccount();

      // Сбрасываем форму
      setAmount('');
      setDescription('');
      setPhone('');
      setRecipient(null);
      setUseBonuses(false);
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
    Alert.alert('Функция поделиться', 'Скоро будет доступна');
  };

  if (initialLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.title}>Перевод по телефону</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E3A8A" />
          <Text style={styles.loadingText}>Загрузка данных...</Text>
        </View>
      </View>
    );
  }

  const payment = calculatePayment();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.title}>Перевод по телефону</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {/* Информация об основном счете */}
        {mainAccount && (
          <View style={styles.accountInfoContainer}>
            <Text style={styles.accountInfoLabel}>Основной счет</Text>
            <Text style={styles.accountInfoValue}>
              {mainAccount.accountType} (•••• {mainAccount.accountNumber.slice(-4)})
            </Text>
            <View style={styles.balanceRow}>
              <View style={styles.balanceItem}>
                <Text style={styles.balanceLabel}>Баланс</Text>
                <Text style={styles.balanceValue}>
                  {mainAccount.balance.toFixed(2)} {mainAccount.currency}
                </Text>
              </View>
              {mainAccount.bonusBalance !== undefined && mainAccount.bonusBalance > 0 && (
                <View style={styles.balanceItem}>
                  <Text style={styles.balanceLabel}>Бонусы</Text>
                  <Text style={styles.bonusValue}>
                    {mainAccount.bonusBalance.toFixed(2)} {mainAccount.currency}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Номер телефона получателя</Text>
          <View style={styles.phoneInputContainer}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={phone}
              onChangeText={handlePhoneChange}
              placeholder="+7 (999) 123-45-67"
              keyboardType="phone-pad"
            />
            <TouchableOpacity
              style={[styles.checkButton, checking && styles.checkButtonDisabled]}
              onPress={checkRecipient}
              disabled={checking}
            >
              <Text style={styles.checkButtonText}>
                {checking ? 'Проверка...' : 'Проверить'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {recipient && (
          <View style={styles.recipientContainer}>
            <View style={styles.recipientIconContainer}>
              {recipient.avatar ? (
                <Image
                  source={{ uri: recipient.avatar }}
                  style={styles.recipientAvatar}
                />
              ) : (
                <View style={styles.recipientIcon}>
                  <User size={24} color="#1E3A8A" />
                </View>
              )}
            </View>
            <View style={styles.recipientInfo}>
              <Text style={styles.recipientName}>
                {recipient.name} {recipient.surname}
              </Text>
              <Text style={styles.recipientPhone}>{phone}</Text>
            </View>
          </View>
        )}

        {recipient && (
          <>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Сумма</Text>
              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={handleAmountChange}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />
              {mainAccount && (
                <Text style={styles.balanceHint}>
                  Доступно: {mainAccount.balance.toFixed(2)} {mainAccount.currency}
                </Text>
              )}
            </View>

            {/* Тоггл использования бонусов */}
            {mainAccount && mainAccount.bonusBalance !== undefined && mainAccount.bonusBalance > 0 && (
              <View style={styles.switchContainer}>
                <View style={styles.switchTextContainer}>
                  <Text style={styles.switchLabel}>Использовать бонусы</Text>
                  {useBonuses && payment && (
                    <Text style={styles.switchHint}>
                      {payment.fromBonuses > 0 && `Бонусы: ${payment.fromBonuses.toFixed(2)} ${mainAccount.currency}`}
                      {payment.fromMain > 0 && payment.fromBonuses > 0 && ' + '}
                      {payment.fromMain > 0 && `Счет: ${payment.fromMain.toFixed(2)} ${mainAccount.currency}`}
                    </Text>
                  )}
                </View>
                <Switch
                  value={useBonuses}
                  onValueChange={setUseBonuses}
                  trackColor={{ false: '#E2E8F0', true: '#1E3A8A' }}
                  thumbColor={useBonuses ? '#FFFFFF' : '#94A3B8'}
                />
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Описание (необязательно)</Text>
              <TextInput
                style={styles.input}
                value={description}
                onChangeText={setDescription}
                placeholder="Комментарий к переводу"
              />
            </View>

            <TouchableOpacity
              style={[styles.transferButton, loading && styles.transferButtonDisabled]}
              onPress={handleTransfer}
              disabled={loading}
            >
              <Text style={styles.transferButtonText}>
                {loading ? 'Отправка...' : 'Отправить'}
              </Text>
            </TouchableOpacity>
          </>
        )}
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
              toAccountNumber: `${recipient?.name} ${recipient?.surname}`,
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
  phoneInputContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  checkButton: {
    backgroundColor: '#1E3A8A',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    justifyContent: 'center',
  },
  checkButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  checkButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  recipientContainer: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  recipientIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#BFDBFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recipientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  recipientInfo: {
    flex: 1,
  },
  recipientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  recipientPhone: {
    fontSize: 14,
    color: '#475569',
    marginTop: 4,
  },
  currencyDisplay: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  currencyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  switchContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  switchTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  switchHint: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  transferButton: {
    backgroundColor: '#1E3A8A',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
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
  balanceHint: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  accountInfoContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  accountInfoLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  accountInfoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  balanceRow: {
    flexDirection: 'row',
    gap: 16,
  },
  balanceItem: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  bonusValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
  },
  recipientIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#BFDBFE',
    justifyContent: 'center',
    alignItems: 'center',
  },

});
