import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, TextInput, Modal
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

const AdminExpensesScreen = ({ navigation }) => {
  const [expenses, setExpenses] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState('pending');
  const [rejectModal, setRejectModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState({});

  useFocusEffect(
    useCallback(() => {
      loadExpenses();
    }, [filter])
  );

  const loadExpenses = async () => {
    try {
      const [data, statsData] = await Promise.all([
        expenseService.getAllExpenses(filter === 'all' ? null : filter),
        expenseService.getAdminStats()
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

  const handleApprove = async (expense) => {
    Alert.alert(
      'Approve Expense',
      `Approve ₹${expense.amount} from ${expense.employee?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            setActionLoading(prev => ({ ...prev, [expense._id]: true }));
            try {
              await expenseService.approveExpense(expense._id);
              await loadExpenses();
              Alert.alert('✅ Approved!', 'Expense has been approved.');
            } catch (err) {
              Alert.alert('Error', 'Failed to approve expense.');
            } finally {
              setActionLoading(prev => ({ ...prev, [expense._id]: false }));
            }
          }
        }
      ]
    );
  };

  const handleReject = (expense) => {
    setSelectedExpense(expense);
    setRejectReason('');
    setRejectModal(true);
  };

  const confirmReject = async () => {
    if (!rejectReason.trim()) {
      Alert.alert('Required', 'Please provide a reason for rejection.');
      return;
    }
    setActionLoading(prev => ({ ...prev, [selectedExpense._id]: true }));
    try {
      await expenseService.rejectExpense(selectedExpense._id, rejectReason);
      setRejectModal(false);
      await loadExpenses();
      Alert.alert('❌ Rejected', 'Expense has been rejected.');
    } catch (err) {
      Alert.alert('Error', 'Failed to reject expense.');
    } finally {
      setActionLoading(prev => ({ ...prev, [selectedExpense._id]: false }));
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '--';
    return new Date(dateStr).toLocaleDateString([], {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  const renderItem = ({ item }) => {
    const cat = CATEGORY_ICONS[item.category] || CATEGORY_ICONS.other;
    const isPending = item.status === 'pending';
    const isActioning = actionLoading[item._id];

    return (
      <View style={styles.expenseCard}>
        {/* Employee Info */}
        <View style={styles.employeeRow}>
          <View style={styles.empAvatar}>
            <Text style={styles.empAvatarText}>
              {item.employee?.name?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
          <View style={styles.empInfo}>
            <Text style={styles.empName}>{item.employee?.name || 'Unknown'}</Text>
            <Text style={styles.empEmail}>{item.employee?.email || '--'}</Text>
          </View>
          <Text style={styles.expenseDate}>{formatDate(item.createdAt)}</Text>
        </View>

        {/* Expense Detail */}
        <View style={styles.expenseDetail}>
          <View style={[styles.catIcon, { backgroundColor: cat.color + '20' }]}>
            <Ionicons name={cat.icon} size={20} color={cat.color} />
          </View>
          <View style={styles.expenseInfo}>
            <Text style={styles.expenseDesc} numberOfLines={2}>
              {item.description}
            </Text>
            <Text style={styles.expenseCat}>
              {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
            </Text>
            {item.receiptNote ? (
              <Text style={styles.receiptNote}>📝 {item.receiptNote}</Text>
            ) : null}
          </View>
          <Text style={styles.expenseAmount}>₹{item.amount.toFixed(2)}</Text>
        </View>

        {/* Rejection Reason */}
        {item.status === 'rejected' && item.rejectionReason && (
          <View style={styles.rejectionBox}>
            <Ionicons name="close-circle" size={14} color="#EF4444" />
            <Text style={styles.rejectionText}>{item.rejectionReason}</Text>
          </View>
        )}

        {/* Actions for pending */}
        {isPending && (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.rejectBtn]}
              onPress={() => handleReject(item)}
              disabled={isActioning}
            >
              {isActioning ? (
                <ActivityIndicator size="small" color="#EF4444" />
              ) : (
                <>
                  <Ionicons name="close-circle" size={16} color="#EF4444" />
                  <Text style={styles.rejectBtnText}>Reject</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.approveBtn]}
              onPress={() => handleApprove(item)}
              disabled={isActioning}
            >
              {isActioning ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                  <Text style={styles.approveBtnText}>Approve</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Status badge for non-pending */}
        {!isPending && (
          <View style={[
            styles.statusBadge,
            { backgroundColor: item.status === 'approved' ? '#D1FAE5' : '#FEE2E2' }
          ]}>
            <Ionicons
              name={item.status === 'approved' ? 'checkmark-circle' : 'close-circle'}
              size={14}
              color={item.status === 'approved' ? '#10B981' : '#EF4444'}
            />
            <Text style={[
              styles.statusText,
              { color: item.status === 'approved' ? '#10B981' : '#EF4444' }
            ]}>
              {item.status === 'approved' ? 'Approved' : 'Rejected'}
            </Text>
          </View>
        )}
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
        data={expenses}
        renderItem={renderItem}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        ListHeaderComponent={
          <View>
            <Text style={styles.title}>Expense Approvals</Text>
            {stats && (
              <View style={styles.statsRow}>
                <View style={[styles.statCard, { borderTopColor: '#F59E0B' }]}>
                  <Text style={styles.statValue}>{stats.pending}</Text>
                  <Text style={styles.statLabel}>Pending</Text>
                </View>
                <View style={[styles.statCard, { borderTopColor: '#10B981' }]}>
                  <Text style={styles.statValue}>{stats.approved}</Text>
                  <Text style={styles.statLabel}>Approved</Text>
                </View>
                <View style={[styles.statCard, { borderTopColor: '#4F46E5' }]}>
                  <Text style={styles.statValue}>₹{stats.totalAmount?.toFixed(0)}</Text>
                  <Text style={styles.statLabel}>Total ₹</Text>
                </View>
              </View>
            )}
            <View style={styles.filterRow}>
              {['pending', 'approved', 'rejected', 'all'].map(f => (
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
            <Text style={styles.emptyTitle}>No {filter} expenses</Text>
          </View>
        }
      />

      {/* Reject Modal */}
      <Modal
        visible={rejectModal}
        transparent
        animationType="slide"
        onRequestClose={() => setRejectModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Reject Expense</Text>
            <Text style={styles.modalSubtitle}>
              ₹{selectedExpense?.amount} from {selectedExpense?.employee?.name}
            </Text>
            <TextInput
              style={styles.reasonInput}
              placeholder="Reason for rejection..."
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              numberOfLines={3}
              placeholderTextColor="#9CA3AF"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setRejectModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalRejectBtn}
                onPress={confirmReject}
              >
                <Text style={styles.modalRejectText}>Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  listContent: { padding: 16, paddingBottom: 100 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#6B7280' },
  title: { fontSize: 26, fontWeight: 'bold', color: '#1F2937', marginBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statCard: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12,
    padding: 12, alignItems: 'center', borderTopWidth: 3, elevation: 2,
  },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  statLabel: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  filterRow: {
    flexDirection: 'row', backgroundColor: '#FFFFFF',
    borderRadius: 12, padding: 4, marginBottom: 16, elevation: 1,
  },
  filterBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  filterBtnActive: { backgroundColor: '#4F46E5' },
  filterText: { fontSize: 11, color: '#6B7280', fontWeight: '500' },
  filterTextActive: { color: '#FFFFFF', fontWeight: '700' },
  expenseCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14,
    padding: 14, marginBottom: 12, elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 3,
  },
  employeeRow: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 12, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  empAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#4F46E5', justifyContent: 'center',
    alignItems: 'center', marginRight: 10,
  },
  empAvatarText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },
  empInfo: { flex: 1 },
  empName: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  empEmail: { fontSize: 12, color: '#6B7280' },
  expenseDate: { fontSize: 11, color: '#9CA3AF' },
  expenseDetail: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  catIcon: {
    width: 40, height: 40, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', marginRight: 10,
  },
  expenseInfo: { flex: 1 },
  expenseDesc: { fontSize: 14, fontWeight: '500', color: '#1F2937' },
  expenseCat: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  receiptNote: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  expenseAmount: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  rejectionBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FEE2E2', padding: 8, borderRadius: 8, marginBottom: 8,
  },
  rejectionText: { fontSize: 12, color: '#EF4444', marginLeft: 6, flex: 1 },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', paddingVertical: 10,
    borderRadius: 10, gap: 6,
  },
  rejectBtn: { borderWidth: 1.5, borderColor: '#EF4444' },
  approveBtn: { backgroundColor: '#10B981' },
  rejectBtnText: { color: '#EF4444', fontWeight: '600', fontSize: 14 },
  approveBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center',
    alignSelf: 'flex-start', paddingHorizontal: 10,
    paddingVertical: 4, borderRadius: 10, marginTop: 4, gap: 4,
  },
  statusText: { fontSize: 12, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 16, color: '#6B7280', marginTop: 12 },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF', borderTopLeftRadius: 24,
    borderTopRightRadius: 24, padding: 24,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 4 },
  modalSubtitle: { fontSize: 14, color: '#6B7280', marginBottom: 16 },
  reasonInput: {
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10,
    padding: 12, fontSize: 14, color: '#1F2937',
    textAlignVertical: 'top', backgroundColor: '#F9FAFB', marginBottom: 16,
  },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalCancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center',
  },
  modalCancelText: { fontSize: 15, color: '#6B7280', fontWeight: '600' },
  modalRejectBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    backgroundColor: '#EF4444', alignItems: 'center',
  },
  modalRejectText: { fontSize: 15, color: '#FFFFFF', fontWeight: '700' },
});

export default AdminExpensesScreen;