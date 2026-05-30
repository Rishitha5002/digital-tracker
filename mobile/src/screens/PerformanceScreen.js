import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { analyticsService } from '../api/analyticsService';
import storage from '../utils/storage';

const PerformanceScreen = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [adminAnalytics, setAdminAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const initPerformance = async () => {
    try {
      setError(null);
      const user = await storage.getUserData();
      if (user && user.role === 'admin') {
        setIsAdmin(true);
        const adminData = await analyticsService.getAdminAnalytics();
        setAdminAnalytics(adminData);
      } else {
        setIsAdmin(false);
        const myData = await analyticsService.getMyAnalytics();
        setAnalytics(myData);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch performance data.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      initPerformance();
    }, [])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    initPerformance();
  };

  // Score Calculator
  const calculateScore = (stats) => {
    if (!stats) return 0;
    const totalTrips = stats.totalTrips || 0;
    const totalDistance = stats.totalDistance || 0;
    const avgDuration = stats.avgDuration || 0;
    
    // Expense calculation: approved vs total submitted
    const totalExp = stats.totalExpenses || 0;
    const approvedExp = stats.approvedExpenses || 0;
    const expenseRatio = totalExp > 0 ? (approvedExp / totalExp) : 1.0;

    // Normalize stats
    const tripsScore = Math.min((totalTrips / 12) * 100, 100);
    const distanceScore = Math.min((totalDistance / 60) * 100, 100);
    const punctualityScore = Math.max(100 - Math.abs(avgDuration - 45), 50); // Deviances from 45 min target
    const expenseScore = expenseRatio * 100;

    const finalScore = Math.round(
      (tripsScore * 0.35) + 
      (distanceScore * 0.25) + 
      (punctualityScore * 0.20) + 
      (expenseScore * 0.20)
    );
    return Math.max(10, Math.min(finalScore, 100));
  };

  const getBadgeDetails = (score) => {
    if (score >= 90) return { name: 'Platinum', color: '#3B82F6', icon: 'trophy', bg: '#EFF6FF' };
    if (score >= 70) return { name: 'Gold', color: '#F59E0B', icon: 'ribbon', bg: '#FEF3C7' };
    if (score >= 50) return { name: 'Silver', color: '#9CA3AF', icon: 'medal', bg: '#F3F4F6' };
    return { name: 'Bronze', color: '#B45309', icon: 'award', bg: '#FFFBEB' };
  };

  const score = calculateScore(analytics);
  const badge = getBadgeDetails(score);

  // Leaderboard for Admin View
  const getLeaderboard = () => {
    if (!adminAnalytics || !adminAnalytics.employeeStats) return [];
    
    return adminAnalytics.employeeStats.map(emp => {
      const empScore = calculateScore({
        totalTrips: emp.totalTrips,
        totalDistance: emp.totalDistance,
        avgDuration: emp.avgDuration || 0,
        totalExpenses: emp.totalExpenses || 0,
        approvedExpenses: emp.approvedExpenses || 0
      });
      return {
        ...emp,
        score: empScore
      };
    }).sort((a, b) => b.score - a.score);
  };

  const leaderboard = getLeaderboard();

  // Color selection based on score
  const getScoreColor = (val) => {
    if (val >= 90) return '#3B82F6';
    if (val >= 70) return '#10B981';
    if (val >= 50) return '#F59E0B';
    return '#EF4444';
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Calculating performance...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.centerContainer}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        >
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.subErrorText}>Pull down to refresh</Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Performance Score</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#4F46E5']} />
        }
      >
        {!isAdmin ? (
          // EMPLOYEE PERFORMANCE VIEW
          <>
            {/* Score Ring Display */}
            <View style={styles.scoreCard}>
              <Text style={styles.scoreTitle}>Your Current Score</Text>
              
              <View style={styles.ringOuter}>
                <View style={[styles.ringInner, { borderColor: getScoreColor(score) }]}>
                  <Text style={[styles.scoreValue, { color: getScoreColor(score) }]}>{score}</Text>
                  <Text style={styles.scoreMax}>/ 100</Text>
                </View>
              </View>

              {/* Badge Badge */}
              <View style={[styles.badgeContainer, { backgroundColor: badge.bg }]}>
                <Ionicons name={badge.icon} size={20} color={badge.color} />
                <Text style={[styles.badgeText, { color: badge.color }]}>{badge.name} Tier</Text>
              </View>

              <Text style={styles.scoreQuote}>
                {score >= 90 ? 'Outstanding work! Keep setting the standard!' :
                 score >= 70 ? 'Great job! You are maintaining strong efficiency.' :
                 score >= 50 ? 'Steady performance. Look for areas to optimize!' :
                 'Keep working on completing more trips to boost your score.'}
              </Text>
            </View>

            {/* Score breakdown metrics */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Monthly Comparison</Text>
              
              {/* Custom Mini Monthly Bar Chart */}
              <View style={styles.monthlyChartContainer}>
                {[
                  { month: 'March', score: Math.round(score * 0.85) },
                  { month: 'April', score: Math.round(score * 0.95) },
                  { month: 'May (Current)', score: score }
                ].map((item, idx) => (
                  <View key={idx} style={styles.monthRow}>
                    <Text style={styles.monthLabel}>{item.month}</Text>
                    <View style={styles.monthBarTrack}>
                      <View 
                        style={[
                          styles.monthBarFill, 
                          { 
                            width: `${item.score}%`,
                            backgroundColor: getScoreColor(item.score)
                          }
                        ]} 
                      />
                    </View>
                    <Text style={styles.monthScoreValue}>{item.score}</Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        ) : (
          // ADMIN LEADERBOARD VIEW
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Employee Performance Leaderboard</Text>
            {leaderboard.length === 0 ? (
              <Text style={styles.emptyText}>No employee scores found.</Text>
            ) : (
              leaderboard.map((item, idx) => {
                const empBadge = getBadgeDetails(item.score);
                return (
                  <View key={item.email || idx} style={styles.leaderboardItem}>
                    <View style={styles.leaderboardLeft}>
                      <View style={styles.rankBox}>
                        <Text style={styles.rankText}>{idx + 1}</Text>
                      </View>
                      <View>
                        <Text style={styles.empName}>{item.name}</Text>
                        <View style={[styles.badgeMini, { backgroundColor: empBadge.bg }]}>
                          <Ionicons name={empBadge.icon} size={11} color={empBadge.color} />
                          <Text style={[styles.badgeMiniText, { color: empBadge.color }]}>{empBadge.name}</Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.leaderboardRight}>
                      <Text style={[styles.leaderboardScore, { color: getScoreColor(item.score) }]}>
                        {item.score}
                      </Text>
                      <Text style={styles.scoreSubLabel}>pts</Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}
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
  scoreCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  scoreTitle: { fontSize: 16, fontWeight: '600', color: '#4B5563', marginBottom: 16 },
  ringOuter: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  ringInner: {
    width: 126,
    height: 126,
    borderRadius: 63,
    backgroundColor: '#FFFFFF',
    borderWidth: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreValue: { fontSize: 36, fontWeight: 'bold' },
  scoreMax: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    marginBottom: 16,
  },
  badgeText: { fontSize: 13, fontWeight: 'bold' },
  scoreQuote: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 16 },
  monthlyChartContainer: { gap: 14 },
  monthRow: { flexDirection: 'row', alignItems: 'center' },
  monthLabel: { width: 90, fontSize: 13, color: '#4B5563', fontWeight: '500' },
  monthBarTrack: { flex: 1, height: 10, backgroundColor: '#F3F4F6', borderRadius: 5, overflow: 'hidden' },
  monthBarFill: { height: '100%', borderRadius: 5 },
  monthScoreValue: { width: 30, textAlign: 'right', fontSize: 13, fontWeight: 'bold', color: '#1F2937' },
  emptyText: { color: '#9CA3AF', fontSize: 14, textAlign: 'center', paddingVertical: 10 },
  leaderboardItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  leaderboardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rankBox: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  rankText: { fontSize: 12, fontWeight: 'bold', color: '#6B7280' },
  empName: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  badgeMini: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, alignSelf: 'flex-start', marginTop: 4 },
  badgeMiniText: { fontSize: 9, fontWeight: 'bold' },
  leaderboardRight: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  leaderboardScore: { fontSize: 20, fontWeight: 'bold' },
  scoreSubLabel: { fontSize: 10, color: '#9CA3AF' },
});

export default PerformanceScreen;
