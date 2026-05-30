import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { adminService } from '../api/adminService';
import storage from '../utils/storage';

const AdminDashboard = ({ navigation }) => {
  const scrollRef = useRef(null);
  const employeesSectionY = useRef(0);
  const [userData, setUserData] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [adminStats, setAdminStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    totalTrips: 0,
    activeTrips: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [expandedEmployee, setExpandedEmployee] = useState(null);
  const [employeeTrips, setEmployeeTrips] = useState({});
  const [loadingTrips, setLoadingTrips] = useState({});

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const user = await storage.getUserData();
      setUserData(user);
      await loadEmployees();
    } catch (error) {
      setError('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const [data, stats] = await Promise.all([
        adminService.getEmployees(),
        adminService.getStats()
      ]);
      setEmployees(data);
      setAdminStats(stats);
    } catch (error) {
      setError('Failed to load employees');
    }
  };

  const scrollToEmployees = () => {
    scrollRef.current?.scrollTo({ y: employeesSectionY.current, animated: true });
  };

  const loadEmployeeTrips = async (employeeId) => {
    if (employeeTrips[employeeId]) return;
    setLoadingTrips(prev => ({ ...prev, [employeeId]: true }));
    try {
      const trips = await adminService.getEmployeeTrips(employeeId);
      setEmployeeTrips(prev => ({ ...prev, [employeeId]: trips }));
    } catch (error) {
      Alert.alert('Error', 'Failed to load trips');
    } finally {
      setLoadingTrips(prev => ({ ...prev, [employeeId]: false }));
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setEmployeeTrips({});
    await loadEmployees();
    setIsRefreshing(false);
  };

  const handleEmployeePress = (employee) => {
    if (expandedEmployee === employee._id) {
      setExpandedEmployee(null);
    } else {
      setExpandedEmployee(employee._id);
      loadEmployeeTrips(employee._id);
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '--';
    return new Date(dateStr).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '--';
    return new Date(dateStr).toLocaleDateString([], {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDistance = (distance) => {
    if (!distance) return '0 km';
    return `${(distance / 1000).toFixed(2)} km`;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.welcomeText}>Admin Dashboard</Text>
            <Text style={styles.userName}>{userData?.name || 'Admin'}</Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {userData?.name?.charAt(0).toUpperCase() || 'A'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="warning-outline" size={18} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            <TouchableOpacity
              style={[styles.statCard, { borderTopColor: '#4F46E5' }]}
              onPress={scrollToEmployees}
              activeOpacity={0.7}
            >
              <Ionicons name="people" size={28} color="#4F46E5" />
              <Text style={styles.statValue}>{adminStats.totalEmployees}</Text>
              <Text style={styles.statLabel}>Total Employees</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.statCard, { borderTopColor: '#10B981' }]}
              onPress={scrollToEmployees}
              activeOpacity={0.7}
            >
              <Ionicons name="person-outline" size={28} color="#10B981" />
              <Text style={styles.statValue}>{adminStats.activeEmployees}</Text>
              <Text style={styles.statLabel}>On Active Trips</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.statCard, { borderTopColor: '#F59E0B' }]}
              onPress={scrollToEmployees}
              activeOpacity={0.7}
            >
              <Ionicons name="map" size={28} color="#F59E0B" />
              <Text style={styles.statValue}>{adminStats.totalTrips}</Text>
              <Text style={styles.statLabel}>Total Trips</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.statCard, { borderTopColor: '#EF4444' }]}
              onPress={scrollToEmployees}
              activeOpacity={0.7}
            >
              <Ionicons name="location" size={28} color="#EF4444" />
              <Text style={styles.statValue}>{adminStats.activeTrips}</Text>
              <Text style={styles.statLabel}>Active Trips</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Employees */}
        <View
          style={styles.section}
          onLayout={(e) => { employeesSectionY.current = e.nativeEvent.layout.y; }}
        >
          <Text style={styles.sectionTitle}>
            Employees ({employees.length})
          </Text>

          {employees.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={56} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No Employees Found</Text>
              <Text style={styles.emptySubtitle}>
                No employees registered yet
              </Text>
            </View>
          ) : (
            employees.map((employee) => {
              const isExpanded = expandedEmployee === employee._id;
              const trips = employeeTrips[employee._id] || [];
              const isLoadingEmp = loadingTrips[employee._id];

              return (
                <View key={employee._id} style={styles.employeeWrapper}>
                  <TouchableOpacity
                    style={[
                      styles.employeeCard,
                      isExpanded && styles.employeeCardExpanded
                    ]}
                    onPress={() => handleEmployeePress(employee)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.employeeLeft}>
                      <View style={styles.avatarSmall}>
                        <Text style={styles.avatarSmallText}>
                          {employee.name?.charAt(0).toUpperCase() || '?'}
                        </Text>
                      </View>
                      <View style={styles.employeeInfo}>
                        <Text style={styles.employeeName}>
                          {employee.name || 'Unknown'}
                        </Text>
                        <Text style={styles.employeeEmail}>
                          {employee.email}
                        </Text>
                        <View style={styles.roleBadge}>
                          <Text style={styles.roleText}>
                            {employee.role}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color="#9CA3AF"
                    />
                  </TouchableOpacity>

                  {/* Expanded Trips */}
                  {isExpanded && (
                    <View style={styles.tripsPanel}>
                      {isLoadingEmp ? (
                        <View style={styles.tripsLoading}>
                          <ActivityIndicator size="small" color="#4F46E5" />
                          <Text style={styles.tripsLoadingText}>
                            Loading trips...
                          </Text>
                        </View>
                      ) : trips.length === 0 ? (
                        <View style={styles.noTrips}>
                          <Ionicons
                            name="map-outline"
                            size={32}
                            color="#D1D5DB"
                          />
                          <Text style={styles.noTripsText}>No trips yet</Text>
                        </View>
                      ) : (
                        <>
                          <Text style={styles.tripsPanelTitle}>
                            {trips.length} Trip{trips.length > 1 ? 's' : ''}
                          </Text>
                          {trips.map((trip) => (
                            <View key={trip._id} style={styles.tripRow}>
                              <View style={styles.tripRowLeft}>
                                <View
                                  style={[
                                    styles.tripStatusDot,
                                    {
                                      backgroundColor:
                                        trip.status === 'active'
                                          ? '#10B981'
                                          : '#4F46E5'
                                    }
                                  ]}
                                />
                                <View>
                                  <Text style={styles.tripRowDate}>
                                    {formatDate(trip.startTime)}
                                  </Text>
                                  <Text style={styles.tripRowTime}>
                                    {formatTime(trip.startTime)}
                                    {trip.endTime
                                      ? ` → ${formatTime(trip.endTime)}`
                                      : ' → Ongoing'}
                                  </Text>
                                </View>
                              </View>
                              <View style={styles.tripRowRight}>
                                <Text style={styles.tripDistance}>
                                  {formatDistance(trip.distance)}
                                </Text>
                                <View
                                  style={[
                                    styles.tripBadge,
                                    {
                                      backgroundColor:
                                        trip.status === 'active'
                                          ? '#D1FAE5'
                                          : '#EEF2FF'
                                    }
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.tripBadgeText,
                                      {
                                        color:
                                          trip.status === 'active'
                                            ? '#059669'
                                            : '#4F46E5'
                                      }
                                    ]}
                                  >
                                    {trip.status}
                                  </Text>
                                </View>
                              </View>
                            </View>
                          ))}
                        </>
                      )}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#6B7280' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: { flex: 1 },
  welcomeText: { fontSize: 13, color: '#6B7280', marginBottom: 2 },
  userName: { fontSize: 22, fontWeight: 'bold', color: '#1F2937' },
  profileButton: { marginLeft: 12 },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    margin: 16,
    padding: 12,
    borderRadius: 8,
  },
  errorText: { color: '#EF4444', fontSize: 14, marginLeft: 8 },
  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderTopWidth: 3,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: { fontSize: 12, color: '#6B7280', textAlign: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
  },
  emptySubtitle: { fontSize: 13, color: '#9CA3AF', marginTop: 4 },
  employeeWrapper: { marginBottom: 10 },
  employeeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  employeeCardExpanded: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#EEF2FF',
  },
  employeeLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatarSmall: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarSmallText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  employeeInfo: { flex: 1 },
  employeeName: { fontSize: 15, fontWeight: '600', color: '#1F2937' },
  employeeEmail: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  roleBadge: {
    marginTop: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  roleText: { fontSize: 11, color: '#4F46E5', fontWeight: '600' },
  tripsPanel: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    padding: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  tripsLoading: { flexDirection: 'row', alignItems: 'center', padding: 8 },
  tripsLoadingText: { marginLeft: 8, color: '#6B7280', fontSize: 14 },
  noTrips: { alignItems: 'center', paddingVertical: 20 },
  noTripsText: { color: '#9CA3AF', fontSize: 14, marginTop: 8 },
  tripsPanelTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tripRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tripRowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  tripStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  tripRowDate: { fontSize: 13, fontWeight: '600', color: '#1F2937' },
  tripRowTime: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  tripRowRight: { alignItems: 'flex-end' },
  tripDistance: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  tripBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  tripBadgeText: { fontSize: 11, fontWeight: '600' },
});

export default AdminDashboard;