import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { analyticsService } from '../api/analyticsService';
import BarChart from '../components/BarChart';

const AnalyticsScreen = () => {
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchAnalytics = async () => {
    try {
      setError(null);
      const data = await analyticsService.getMyAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch analytics data.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAnalytics();
    }, [])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchAnalytics();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading analytics...</Text>
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
        <Text style={styles.headerTitle}>My Analytics</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#4F46E5']} />
        }
      >
        {/* Core metrics grid */}
        <View style={styles.grid}>
          <View style={styles.metricCard}>
            <View style={[styles.iconBadge, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="map-outline" size={20} color="#4F46E5" />
            </View>
            <Text style={styles.metricLabel}>Total Trips</Text>
            <Text style={styles.metricValue}>{analytics.totalTrips || 0}</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.iconBadge, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="calendar-outline" size={20} color="#10B981" />
            </View>
            <Text style={styles.metricLabel}>Weekly Trips</Text>
            <Text style={styles.metricValue}>{analytics.weeklyTrips || 0}</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.iconBadge, { backgroundColor: '#FDF2F8' }]}>
              <Ionicons name="navigate-outline" size={20} color="#DB2777" />
            </View>
            <Text style={styles.metricLabel}>Distance (km)</Text>
            <Text style={styles.metricValue}>{analytics.totalDistance?.toFixed(1) || 0}</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.iconBadge, { backgroundColor: '#FFFBEB' }]}>
              <Ionicons name="hourglass-outline" size={20} color="#D97706" />
            </View>
            <Text style={styles.metricLabel}>Avg Duration</Text>
            <Text style={styles.metricValue}>{analytics.avgDuration || 0}m</Text>
          </View>
        </View>

        {/* Trips Chart Card */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Trips: Last 7 Days</Text>
          <BarChart data={analytics.dailyData || []} />
        </View>

        {/* Stop Statistics */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Stop Analytics</Text>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Ionicons name="pause-circle-outline" size={22} color="#4F46E5" />
              <View style={styles.detailTexts}>
                <Text style={styles.detailLabel}>Total Stops</Text>
                <Text style={styles.detailValue}>{analytics.totalStops || 0}</Text>
              </View>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="time-outline" size={22} color="#10B981" />
              <View style={styles.detailTexts}>
                <Text style={styles.detailLabel}>Total Stop Time</Text>
                <Text style={styles.detailValue}>{analytics.totalStopTime || 0} min</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Expense Summary */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Expense Summary</Text>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Ionicons name="wallet-outline" size={22} color="#D97706" />
              <View style={styles.detailTexts}>
                <Text style={styles.detailLabel}>Total Submitted</Text>
                <Text style={styles.detailValue}>{analytics.totalExpenses || 0}</Text>
              </View>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="checkmark-circle-outline" size={22} color="#10B981" />
              <View style={styles.detailTexts}>
                <Text style={styles.detailLabel}>Approved Amount</Text>
                <Text style={styles.detailValue}>₹{analytics.totalExpenseAmount || 0}</Text>
              </View>
            </View>
          </View>
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
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
  },
  detailTexts: {
    marginLeft: 8,
    flex: 1,
  },
  detailLabel: { fontSize: 11, color: '#6B7280' },
  detailValue: { fontSize: 15, fontWeight: 'bold', color: '#1F2937', marginTop: 2 },
});

export default AnalyticsScreen;
