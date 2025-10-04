import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Download, Calendar } from 'lucide-react-native';
import { apiService } from '@/services/api';

export default function Statement() {
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [loading, setLoading] = useState(false);

  const downloadStatement = async (format: 'pdf' | 'excel') => {
    if (startDate > endDate) {
      Alert.alert('Ошибка', 'Дата начала не может быть позже даты окончания');
      return;
    }

    setLoading(true);
    try {
      const startISO = startDate.toISOString();
      const endISO = endDate.toISOString();

      if (Platform.OS === 'web') {
        const { blob, filename } = await apiService.downloadStatementFile({
          format,
          startDate: startISO,
          endDate: endISO,
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // На native можно реализовать сохранение через expo-file-system / expo-sharing
        // Пока уведомим пользователя о готовности
        await apiService.downloadStatementFile({
          format,
          startDate: startISO,
          endDate: endISO,
        });
        Alert.alert(
          'Успешно',
          `Выписка в формате ${format.toUpperCase()} готова к скачиванию`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Statement download error:', error);
      Alert.alert('Ошибка', 'Не удалось сгенерировать выписку');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const setDateRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    setStartDate(start);
    setEndDate(end);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.title}>Выписка по счёту</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Выберите период</Text>
        
        <View style={styles.quickDateOptions}>
          <TouchableOpacity
            style={styles.dateOptionButton}
            onPress={() => setDateRange(30)}
          >
            <Text style={styles.dateOptionText}>Последние 30 дней</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.dateOptionButton}
            onPress={() => setDateRange(90)}
          >
            <Text style={styles.dateOptionText}>Последние 3 месяца</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.dateOptionButton}
            onPress={() => setDateRange(365)}
          >
            <Text style={styles.dateOptionText}>Последний год</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dateSelection}>
          <View style={styles.dateInputContainer}>
            <Text style={styles.dateLabel}>С</Text>
            <TouchableOpacity style={styles.dateInput}>
              <Calendar size={20} color="#64748B" />
              <Text style={styles.dateText}>{formatDate(startDate)}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.dateInputContainer}>
            <Text style={styles.dateLabel}>По</Text>
            <TouchableOpacity style={styles.dateInput}>
              <Calendar size={20} color="#64748B" />
              <Text style={styles.dateText}>{formatDate(endDate)}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.formatSection}>
          <Text style={styles.sectionTitle}>Формат выписки</Text>
          <Text style={styles.sectionDescription}>
            Выберите удобный формат для загрузки выписки
          </Text>

          <View style={styles.downloadButtons}>
            <TouchableOpacity
              style={[styles.downloadButton, styles.pdfButton]}
              onPress={() => downloadStatement('pdf')}
              disabled={loading}
            >
              <Download size={24} color="white" />
              <Text style={styles.downloadButtonText}>
                {loading ? 'Подготовка...' : 'Скачать PDF'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.downloadButton, styles.excelButton]}
              onPress={() => downloadStatement('excel')}
              disabled={loading}
            >
              <Download size={24} color="white" />
              <Text style={styles.downloadButtonText}>
                {loading ? 'Подготовка...' : 'Скачать Excel'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Информация о выписке</Text>
          <Text style={styles.infoText}>
            • Выписка содержит все операции за выбранный период
          </Text>
          <Text style={styles.infoText}>
            • PDF формат подходит для печати и хранения
          </Text>
          <Text style={styles.infoText}>
            • Excel формат удобен для анализа данных
          </Text>
          <Text style={styles.infoText}>
            • Максимальный период выписки - 1 год
          </Text>
        </View>
      </View>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 20,
  },
  quickDateOptions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 30,
  },
  dateOptionButton: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dateOptionText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  dateSelection: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 40,
  },
  dateInputContainer: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  dateInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontSize: 16,
    color: '#1E293B',
  },
  formatSection: {
    marginBottom: 30,
  },
  downloadButtons: {
    gap: 12,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  pdfButton: {
    backgroundColor: '#DC2626',
  },
  excelButton: {
    backgroundColor: '#059669',
  },
  downloadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  infoCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 4,
  },
});