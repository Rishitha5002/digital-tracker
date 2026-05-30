import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { expenseService } from '../api/expenseService';

const CATEGORY_ICONS = {
  fuel: { icon: 'flame', color: '#EF4444' },
  food: { icon: 'restaurant', color: '#F59E0B' },
  toll: { icon: 'car', color: '#4F46E5' },
  parking: { icon: 'business', color: '#8B5CF6' },
  other: { icon: 'wallet', color: '#6B7280' },
};

const STATUS_CONFIG = {
  pending: { color: '#F59E0B', bg: '#FEF3C7', label: 'Pending' },
  approved: { color: '#10B981', bg: '#D1FAE5', label: 'Approved' },
  rejected: { color: '#EF4444', bg: '#FEE2E2', label: 'Rejected' },
};

const MyExpensesScreen = ({ navigation }) => {
  const [expenses, setExpenses] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  useFocusEffect(
    useCallback(() => {
      loadExpenses();
    }, [])
  );

  const loadExpenses = async () => {
    try {
      const [data, statsData] = await Promise.all([
        expenseService.getMyExpenses(),
        expenseService.getMyStats()
      ]);
      setExpenses(data);
      setStats(statsData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadExpenses();
    setIsRefreshing(false);
  };

  const filteredExpenses = filter === 'all'
    ? expenses
    : expenses.filter(e => e.status === filter);

  const formatDate = (dateStr) => {
    if (!dateStr) return '--';
    return new Date(dateStr).toLocaleDateString([], {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  const renderItem = ({ item }) => {
    const cat = CATEGORY_ICONS[item.category] || CATEGORY_ICONS.other;
    const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;

    return (
      <View style={styles.expenseCard}>
        <View style={styles.cardLeft}>
          <View style={[styles.catIcon, { backgroundColor: cat.color + '20' }]}>
            <Ionicons name={cat.icon} size={22} color={cat.color} />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.description} numberOfLines={1}>
              {item.description}
            </Text>
            <Text style={styles.category}>
              {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
            </Text>
            <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>
        <View style={styles.cardRight}>
          <Text style={styles.amount}>₹{item.amount.toFixed(2)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusText, { color: status.color }]}>
              {status.label}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading expenses...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={filteredExpenses}
        renderItem={renderItem}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        ListHeaderComponent={
          <View>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>My Expenses</Text>
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => navigation.navigate('AddExpense')}
              >
                <Ionicons name="add" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Stats */}
            {stats && (
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{stats.total}</Text>
                  <Text style={styles.statLabel}>Total</Text>
                </View>
                <View style={[styles.statCard, { borderTopColor: '#F59E0B' }]}>
                  <Text style={styles.statValue}>{stats.pending}</Text>
                  <Text style={styles.statLabel}>Pending</Text>
                </View>
                <View style={[styles.statCard, { borderTopColor: '#10B981' }]}>
                  <Text style={styles.statValue}>₹{stats.approvedAmount?.toFixed(0)}</Text>
                  <Text style={styles.statLabel}>Approved</Text>
                </View>
              </View>
            )}

            {/* Filter */}
            <View style={styles.filterRow}>
              {['all', 'pending', 'approved', 'rejected'].map(f => (
                <TouchableOpacity
                  key={f}
                  style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
                  onPress={() => setFilter(f)}
                >
                  <Text style={[
                    styles.filterText,
                    filter === f && styles.filterTextActive
                  ]}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="wallet-outline" size={56} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No Expenses</Text>
            <Text style={styles.emptySubtitle}>
              Add your first expense by tapping the + button
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  listContent: { padding: 16, paddingBottom: 100 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#6B7280' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 26, fontWeight: 'bold', color: '#1F2937' },
  addBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#4F46E5',
    justifyContent: 'center', alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  statCard: {
    flex: 1, backgroundColor: '#FFFFFF',
    borderRadius: 12, padding: 12,
    alignItems: 'center', borderTopWidth: 3,
    borderTopColor: '#4F46E5', elevation: 2,
  },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  statLabel: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  filterRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    elevation: 1,
  },
  filterBtn: {
    flex: 1, paddingVertical: 8,
    borderRadius: 8, alignItems: 'center',
  },
  filterBtnActive: { backgroundColor: '#4F46E5' },
  filterText: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  filterTextActive: { color: '#FFFFFF', fontWeight: '700' },
  expenseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14, padding: 14,
    marginBottom: 10, elevation: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 3,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  catIcon: {
    width: 44, height: 44, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 12,
  },
  cardInfo: { flex: 1 },
  description: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  category: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  date: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  cardRight: { alignItems: 'flex-end' },
  amount: { fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 4 },
  statusBadge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  statusText: { fontSize: 11, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#6B7280', marginTop: 12 },
  emptySubtitle: { fontSize: 13, color: '#9CA3AF', marginTop: 6, textAlign: 'center' },
});

export default MyExpensesScreen;