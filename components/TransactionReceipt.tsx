import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { CheckCircle, X, Share2 } from 'lucide-react-native';

interface TransactionReceiptProps {
  transaction: {
    id: string;
    amount: number;
    currency: string;
    sourceAccountNumber: string;
    targetAccountNumber: string;
    counterpartyName: string;
    counterpartyPhone?: string;
    createdAt: string;
    status: string;
    type: string;
    direction: string;
    description?: string;
  };
  onClose: () => void;
  onShare?: () => void;
}

export default function TransactionReceipt({ transaction, onClose, onShare }: TransactionReceiptProps) {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return `${amount.toFixed(2)} ${currency}`;
  };

  const getTransactionTitle = () => {
    if (transaction.type === 'TRANSFER') {
      if (transaction.counterpartyName === 'Собственный счет') {
        return 'Перевод между счетами';
      }
      return transaction.direction === 'OUTGOING' ? 'Перевод отправлен' : 'Перевод получен';
    }
    return 'Операция выполнена';
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <View style={styles.successIcon}>
            <CheckCircle size={64} color="#10B981" strokeWidth={2} />
          </View>

          <Text style={styles.successTitle}>{getTransactionTitle()}</Text>
          <Text style={styles.successSubtitle}>Операция завершена</Text>

          <View style={styles.amountContainer}>
            <Text style={styles.amountLabel}>Сумма {transaction.direction === 'OUTGOING' ? 'перевода' : 'получения'}</Text>
            <Text style={[styles.amount, transaction.direction === 'INCOMING' ? styles.amountIncoming : undefined]}>
              {transaction.direction === 'OUTGOING' ? '-' : '+'}{formatAmount(transaction.amount, transaction.currency)}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailsContainer}>
            <Text style={styles.sectionTitle}>Детали операции</Text>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Номер операции</Text>
              <Text style={styles.detailValue}>#{transaction.id.slice(0, 8)}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Дата и время</Text>
              <Text style={styles.detailValue}>{formatDate(transaction.createdAt)}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Статус</Text>
              <View style={[styles.statusBadge,
                { backgroundColor: transaction.status === 'COMPLETED' ? '#D1FAE5' : '#FEF3C7' }]}>
                <Text style={[styles.statusText,
                  { color: transaction.status === 'COMPLETED' ? '#059669' : '#D97706' }]}>
                  {transaction.status === 'COMPLETED' ? 'Выполнено' : 'В обработке'}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{transaction.direction === 'OUTGOING' ? 'Со счёта' : 'На счёт'}</Text>
              <Text style={styles.detailValue}>{transaction.sourceAccountNumber}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{transaction.direction === 'OUTGOING' ? 'На счёт' : 'Со счёта'}</Text>
              <Text style={styles.detailValue}>{transaction.targetAccountNumber}</Text>
            </View>

            {transaction.counterpartyName && transaction.counterpartyName !== 'Собственный счет' && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Получатель</Text>
                <Text style={styles.detailValue}>{transaction.counterpartyName}</Text>
              </View>
            )}

            {transaction.counterpartyPhone && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Телефон получателя</Text>
                <Text style={styles.detailValue}>{transaction.counterpartyPhone}</Text>
              </View>
            )}

            {transaction.description && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Описание</Text>
                <Text style={styles.detailValue}>{transaction.description}</Text>
              </View>
            )}
          </View>
        </ScrollView>

        {onShare && (
          <TouchableOpacity onPress={onShare} style={styles.shareButton}>
            <Share2 size={24} color="#ffffff" />
            <Text style={styles.shareButtonText}>Поделиться чеком</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '90%',
    maxHeight: '85%',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 16,
  },
  closeButton: {
    padding: 4,
  },
  successIcon: {
    alignItems: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
  },
  amountContainer: {
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  amountLabel: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  amount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  amountIncoming: {
    color: '#059669',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 20,
  },
  detailsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748B',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  statusBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  buttonContainer: {
    gap: 12,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E3A8A',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    marginTop: 16,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
