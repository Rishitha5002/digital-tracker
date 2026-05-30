import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import storage from '../utils/storage';
import apiClient from '../api/client';

const DEFAULT_SETTINGS = {
  tripAlerts: true,
  employeeUpdates: true,
  systemMessages: true,
  emailNotifications: false,
  pushNotifications: true
};

const NotificationsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await apiClient.get('/auth/notification-settings');
      const settings = { ...DEFAULT_SETTINGS, ...response.data };
      setNotifications(settings);
      await storage.saveNotificationSettings(settings);
    } catch {
      const local = await storage.getNotificationSettings();
      if (local) setNotifications({ ...DEFAULT_SETTINGS, ...local });
    } finally {
      setLoading(false);
    }
  };

  const toggleNotification = async (key) => {
    const updated = { ...notifications, [key]: !notifications[key] };
    setNotifications(updated);
    await storage.saveNotificationSettings(updated);
    try {
      await apiClient.put('/auth/notification-settings', updated);
    } catch (err) {
      console.error('Failed to sync notification settings', err);
    }
  };

  const NotificationItem = ({ icon, title, subtitle, value, onToggle }) => (
    <View style={styles.notificationItem}>
      <View style={styles.notificationLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={22} color="#4F46E5" />
        </View>
        <View style={styles.notificationText}>
          <Text style={styles.notificationTitle}>{title}</Text>
          <Text style={styles.notificationSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#E5E7EB', true: '#4F46E5' }}
        thumbColor="#FFFFFF"
        ios_backgroundColor="#E5E7EB"
      />
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#4F46E5" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trip Notifications</Text>
          <NotificationItem
            icon="map-outline"
            title="Trip Alerts"
            subtitle="Get notified when trips start or end"
            value={notifications.tripAlerts}
            onToggle={() => toggleNotification('tripAlerts')}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Employee Notifications</Text>
          <NotificationItem
            icon="people-outline"
            title="Employee Updates"
            subtitle="Updates when employees join or leave"
            value={notifications.employeeUpdates}
            onToggle={() => toggleNotification('employeeUpdates')}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Notifications</Text>
          <NotificationItem
            icon="settings-outline"
            title="System Messages"
            subtitle="Important system updates and alerts"
            value={notifications.systemMessages}
            onToggle={() => toggleNotification('systemMessages')}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Method</Text>
          <NotificationItem
            icon="mail-outline"
            title="Email Notifications"
            subtitle="Receive notifications via email"
            value={notifications.emailNotifications}
            onToggle={() => toggleNotification('emailNotifications')}
          />
          <NotificationItem
            icon="notifications-outline"
            title="Push Notifications"
            subtitle="Receive push notifications on device"
            value={notifications.pushNotifications}
            onToggle={() => toggleNotification('pushNotifications')}
          />
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color="#6B7280" />
          <Text style={styles.infoText}>
            Settings are saved to your account and synced across devices.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: { width: 40 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  placeholder: { width: 40 },
  scrollView: { flex: 1 },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  notificationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  notificationLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationText: { flex: 1 },
  notificationTitle: { fontSize: 15, fontWeight: '500', color: '#1F2937', marginBottom: 2 },
  notificationSubtitle: { fontSize: 13, color: '#6B7280' },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    margin: 16,
    padding: 12,
    borderRadius: 8,
    alignItems: 'flex-start',
  },
  infoText: { flex: 1, fontSize: 13, color: '#92400E', marginLeft: 8, lineHeight: 18 },
});

export default NotificationsScreen;
