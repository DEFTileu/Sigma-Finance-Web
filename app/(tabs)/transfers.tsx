import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Phone, ArrowLeftRight, User, CreditCard } from 'lucide-react-native';

export default function Transfers() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Переводы</Text>
        <Text style={styles.subtitle}>Выберите тип перевода</Text>
      </View>

      <View style={styles.transferOptions}>
        <TouchableOpacity
          style={styles.transferOption}
          onPress={() => router.push('/transfer-phone')}
        >
          <View style={styles.transferIconContainer}>
            <Phone size={32} color="#1E3A8A" />
          </View>
          <View style={styles.transferInfo}>
            <Text style={styles.transferTitle}>По номеру телефона</Text>
            <Text style={styles.transferDescription}>
              Переведите деньги другому пользователю по номеру телефона
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.transferOption}
          onPress={() => router.push('/transfer-internal')}
        >
          <View style={styles.transferIconContainer}>
            <ArrowLeftRight size={32} color="#059669" />
          </View>
          <View style={styles.transferInfo}>
            <Text style={styles.transferTitle}>Между своими счетами</Text>
            <Text style={styles.transferDescription}>
              Переведите средства между своими счетами
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.transferOption, styles.disabledOption]}>
          <View style={styles.transferIconContainer}>
            <User size={32} color="#94A3B8" />
          </View>
          <View style={styles.transferInfo}>
            <Text style={[styles.transferTitle, styles.disabledText]}>По реквизитам</Text>
            <Text style={[styles.transferDescription, styles.disabledText]}>
              Скоро будет доступно
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.transferOption, styles.disabledOption]}>
          <View style={styles.transferIconContainer}>
            <CreditCard size={32} color="#94A3B8" />
          </View>
          <View style={styles.transferInfo}>
            <Text style={[styles.transferTitle, styles.disabledText]}>На карту</Text>
            <Text style={[styles.transferDescription, styles.disabledText]}>
              Скоро будет доступно
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
  },
  transferOptions: {
    paddingHorizontal: 20,
  },
  transferOption: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledOption: {
    opacity: 0.5,
  },
  transferIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  transferInfo: {
    flex: 1,
  },
  transferTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  transferDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  disabledText: {
    color: '#94A3B8',
  },
});