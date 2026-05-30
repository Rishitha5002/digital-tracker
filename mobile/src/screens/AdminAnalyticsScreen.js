import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { analyticsService } from '../api/analyticsService';
import BarChart from '../components/BarChart';

const AdminAnalyticsScreen = () => {
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchAdminAnalytics = async () => {
    try {
      setError(null);
      const data = await analyticsService.getAdminAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch admin analytics.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAdminAnalytics();
    }, [])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchAdminAnalytics();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading admin analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !analytics) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.centerContainer}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        >
          <Ionicons name="cloud-offline-outline" size={64} color="#EF4444" />
          <Text style={styles.errorText}>{error || 'Something went wrong'}</Text>
          <Text style={styles.subErrorText}>Pull down to refresh</Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Analytics</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#4F46E5']} />
        }
      >
        {/* Core Admin Metrics Grid */}
        <View style={styles.grid}>
          <View style={styles.metricCard}>
            <View style={[styles.iconBadge, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="people-outline" size={20} color="#4F46E5" />
            </View>
            <Text style={styles.metricLabel}>Total Employees</Text>
            <Text style={styles.metricValue}>{analytics.totalEmployees || 0}</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.iconBadge, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="pulse" size={20} color="#10B981" />
            </View>
            <Text style={styles.metricLabel}>Active Trips</Text>
            <Text style={styles.metricValue}>{analytics.activeTrips || 0}</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.iconBadge, { backgroundColor: '#FFFBEB' }]}>
              <Ionicons name="today-outline" size={20} color="#D97706" />
            </View>
            <Text style={styles.metricLabel}>Today's Trips</Text>
            <Text style={styles.metricValue}>{analytics.todayTrips || 0}</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.iconBadge, { backgroundColor: '#FDF2F8' }]}>
              <Ionicons name="alert-circle-outline" size={20} color="#DB2777" />
            </View>
            <Text style={styles.metricLabel}>Pending Expenses</Text>
            <Text style={styles.metricValue}>{analytics.pendingExpenses || 0}</Text>
          </View>
        </View>

        {/* Trips Chart Card */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Total Trips: Last 7 Days</Text>
          <BarChart data={analytics.dailyData || []} />
        </View>

        {/* Top Employees Leaderboard */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Employee Leaderboard (Distance)</Text>
          {(!analytics.employeeStats || analytics.employeeStats.length === 0) ? (
            <Text style={styles.emptyText}>No employee trip data available.</Text>
          ) : (
            analytics.employeeStats.map((item, idx) => (
              <View key={item.email || idx} style={styles.leaderboardRow}>
                <View style={styles.rankBox}>
                  <Text style={[styles.rankText, idx < 3 && styles.topRankText]}>{idx + 1}</Text>
                </View>
                <View style={styles.empDetails}>
                  <Text style={styles.empName}>{item.name}</Text>
                  <Text style={styles.empEmail}>{item.email}</Text>
                </View>
                <View style={styles.empStats}>
                  <Text style={styles.distanceValue}>{item.totalDistance?.toFixed(1) || 0} km</Text>
                  <Text style={styles.tripsValue}>{item.totalTrips || 0} trips</Text>
                  {item.activeTrip && (
                    <View style={styles.activeIndicator}>
                      <View style={styles.activeDot} />
                      <Text style={styles.activeText}>Active Now</Text>
                    </View>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 12, fontSize: 16, color: '#6B7280' },
  errorText: { fontSize: 16, color: '#EF4444', fontWeight: 'bold', marginTop: 16 },
  subErrorText: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 100 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricLabel: { fontSize: 12, color: '#6B7280' },
  metricValue: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginTop: 4 },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 12 },
  emptyText: { color: '#9CA3AF', fontSize: 14, textAlign: 'center', paddingVertical: 10 },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  rankBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: { fontSize: 13, fontWeight: 'bold', color: '#6B7280' },
  topRankText: { color: '#4F46E5' },
  empDetails: { flex: 1 },
  empName: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  empEmail: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  empStats: { alignItems: 'flex-end' },
  distanceValue: { fontSize: 14, fontWeight: 'bold', color: '#1F2937' },
  tripsValue: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  activeIndicator: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981', marginRight: 4 },
  activeText: { fontSize: 9, color: '#10B981', fontWeight: 'bold' },
});

export default AdminAnalyticsScreen;
