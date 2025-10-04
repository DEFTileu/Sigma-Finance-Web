import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, Image, Platform, ScrollView } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { apiService } from '@/services/api';
import { User, LogOut, Edit2, Camera, Save, X } from 'lucide-react-native';

interface UserProfile {
  id: string;
  name: string;
  surname: string;
  patronymic?: string;
  username: string;
  phoneNumber: string;
  email?: string;
  avatarUrl?: string;
}

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  // Поля для редактирования
  const [editedName, setEditedName] = useState('');
  const [editedSurname, setEditedSurname] = useState('');
  const [editedPatronymic, setEditedPatronymic] = useState('');


  // Загружаем актуальные данные при каждом возврате на страницу
  useFocusEffect(
    React.useCallback(() => {
      loadProfile();
    }, [])
  );

  const loadProfile = async () => {
    try {
      setLoading(true);
      const profileData = await apiService.getUserProfile();
      setProfile(profileData);
      setEditedName(profileData.name || '');
      setEditedSurname(profileData.surname || '');
      setEditedPatronymic(profileData.patronymic || '');
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить профиль');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!editedName.trim() || !editedSurname.trim()) {
      Alert.alert('Ошибка', 'Имя и фамилия обязательны для заполнения');
      return;
    }

    try {
      setSaving(true);
      await apiService.updateUserProfile({
        name: editedName.trim(),
        surname: editedSurname.trim(),
        patronymic: editedPatronymic.trim() || undefined,
      });

      await loadProfile();
      setEditMode(false);
      Alert.alert('Успешно', 'Профиль обновлён');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Ошибка', 'Не удалось обновить профиль');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (profile) {
      setEditedName(profile.name || '');
      setEditedSurname(profile.surname || '');
      setEditedPatronymic(profile.patronymic || '');
    }
    setEditMode(false);
  };

  const handleChangeAvatar = () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e: any) => {
        const file = e.target?.files?.[0];
        if (file) {
          try {
            setSaving(true);
            // uploadAvatar теперь автоматически сохраняет URL через API
            await apiService.uploadAvatar(file);
            await loadProfile();
            Alert.alert('Успешно', 'Аватар обновлён');
          } catch (error) {
            console.error('Error uploading avatar:', error);
            Alert.alert('Ошибка', 'Не удалось загрузить аватар');
          } finally {
            setSaving(false);
          }
        }
      };
      input.click();
    } else {
      Alert.alert('Загрузка аватара', 'Функция доступна только в веб-версии');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Выход',
      'Вы уверены, что хотите выйти из аккаунта?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Выйти',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.logout();
              router.replace('/login');
            } catch (error) {
              console.error('Logout error:', error);
              router.replace('/login');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Загрузка профиля...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Не удалось загрузить профиль</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadProfile}>
          <Text style={styles.retryButtonText}>Повторить</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Профиль</Text>
        {!editMode && (
          <TouchableOpacity onPress={() => setEditMode(true)}>
            <Edit2 size={24} color="#1E293B" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.content}>
        {/* Аватар */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            {profile.avatarUrl ? (
              <Image source={{ uri: profile.avatarUrl }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <User size={48} color="#1E3A8A" />
              </View>
            )}
            <TouchableOpacity
              style={styles.avatarEditButton}
              onPress={handleChangeAvatar}
              disabled={saving}
            >
              <Camera size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Информация о пользователе */}
        <View style={styles.infoCard}>
          {editMode ? (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Имя *</Text>
                <TextInput
                  style={styles.input}
                  value={editedName}
                  onChangeText={setEditedName}
                  placeholder="Введите имя"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Фамилия *</Text>
                <TextInput
                  style={styles.input}
                  value={editedSurname}
                  onChangeText={setEditedSurname}
                  placeholder="Введите фамилию"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Отчество</Text>
                <TextInput
                  style={styles.input}
                  value={editedPatronymic}
                  onChangeText={setEditedPatronymic}
                  placeholder="Введите отчество (необязательно)"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.editActions}>
                <TouchableOpacity
                  style={[styles.editButton, styles.cancelButton]}
                  onPress={handleCancelEdit}
                  disabled={saving}
                >
                  <X size={20} color="#64748B" />
                  <Text style={styles.cancelButtonText}>Отмена</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.editButton, styles.saveButton]}
                  onPress={handleSaveProfile}
                  disabled={saving}
                >
                  <Save size={20} color="white" />
                  <Text style={styles.saveButtonText}>
                    {saving ? 'Сохранение...' : 'Сохранить'}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <InfoRow label="Имя" value={profile.name} />
              <InfoRow label="Фамилия" value={profile.surname} />
              {profile.patronymic && (
                <InfoRow label="Отчество" value={profile.patronymic} />
              )}
              <InfoRow label="Логин" value={profile.username} />
              <InfoRow label="Телефон" value={profile.phoneNumber} />
              {profile.email && (
                <InfoRow label="Email" value={profile.email} />
              )}
            </>
          )}
        </View>

        {/* Кнопка выхода */}
        {!editMode && (
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={24} color="#DC2626" />
            <Text style={styles.logoutButtonText}>Выйти из аккаунта</Text>
          </TouchableOpacity>
        )}

        <View style={styles.footer}>
          <Text style={styles.version}>Sigma Finance v1.0.0</Text>
          <Text style={styles.copyright}>© 2025 Все права защищены</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#DC2626',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#1E3A8A',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
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
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E2E8F0',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEditButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E3A8A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#F8FAFC',
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748B',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#1E293B',
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  cancelButton: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  saveButton: {
    backgroundColor: '#1E3A8A',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  version: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  copyright: {
    fontSize: 12,
    color: '#94A3B8',
  },
});