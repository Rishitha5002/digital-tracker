import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { tripService } from '../api/tripService';
import storage from '../utils/storage';
import formatters from '../utils/formatters';

const EmployeeDashboard = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState(null);
  const [activeTrip, setActiveTrip] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Get user data from storage
      const userData = await storage.getUserData();
      setUserData(userData);

      // Load stats and check for active trip
      await Promise.all([
        loadStats(),
        checkActiveTrip()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await tripService.getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const checkActiveTrip = async () => {
    try {
      // For now, we'll check if there's an active trip by trying to get history
      // and looking for a trip with 'active' status
      const history = await tripService.getHistory();
      const active = history.find(trip => trip.status === 'active');
      setActiveTrip(active);
    } catch (error) {
      console.error('Error checking active trip:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDashboardData();
    setIsRefreshing(false);
  };

  const handleStartTrip = () => {
    navigation.navigate('StartTrip');
  };

  const handleStopTrip = () => {
    if (activeTrip) {
      navigation.navigate('StopTrip', { tripId: activeTrip._id });
    }
  };

  const handleViewHistory = () => {
    navigation.navigate('TripHistory');
  };

  const handleProfile = () => {
    navigation.navigate('Profile');
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
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>{userData?.name || 'User'}</Text>
            <Text style={styles.userRole}>{userData?.role || 'Employee'}</Text>
          </View>
          <TouchableOpacity style={styles.profileButton} onPress={handleProfile}>
            <Ionicons name="person-circle" size={40} color="#4F46E5" />
          </TouchableOpacity>
        </View>

        {/* Today's Date */}
        <View style={styles.dateContainer}>
          <Text style={styles.dateText}>
            {formatters.formatDate(new Date())}
          </Text>
        </View>

        {/* Active Trip Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Ionicons 
              name={activeTrip ? "location" : "walk"} 
              size={24} 
              color={activeTrip ? "#10B981" : "#6B7280"} 
            />
            <Text style={styles.statusTitle}>
              {activeTrip ? 'Trip in Progress' : 'No Active Trip'}
            </Text>
          </View>
          {activeTrip && (
            <View style={styles.activeTripInfo}>
              <Text style={styles.activeTripText}>
                Started: {formatters.formatTime(activeTrip.startTime)}
              </Text>
              <Text style={styles.activeTripText}>
                Duration: {formatters.formatDuration(
                  Math.floor((Date.now() - new Date(activeTrip.startTime)) / 1000)
                )}
              </Text>
            </View>
          )}
        </View>

        {/* Statistics Cards */}
        {stats && (
          <View style={styles.statsContainer}>
            <Text style={styles.sectionTitle}>Your Statistics</Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Ionicons name="trail-sign" size={32} color="#4F46E5" />
                <Text style={styles.statValue}>{stats.totalTrips || 0}</Text>
                <Text style={styles.statLabel}>Total Trips</Text>
              </View>

              <View style={styles.statCard}>
                <Ionicons name="speedometer" size={32} color="#10B981" />
                <Text style={styles.statValue}>{stats.totalDistance || '0'}</Text>
                <Text style={styles.statLabel}>Total Distance (km)</Text>
              </View>

              <View style={styles.statCard}>
                <Ionicons name="time" size={32} color="#F59E0B" />
                <Text style={styles.statValue}>{stats.avgWaitTime || '0'}</Text>
                <Text style={styles.statLabel}>Avg Wait Time (min)</Text>
              </View>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          {!activeTrip ? (
            <TouchableOpacity style={styles.primaryButton} onPress={handleStartTrip}>
              <Ionicons name="play-circle" size={24} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Start Trip</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.dangerButton} onPress={handleStopTrip}>
              <Ionicons name="stop-circle" size={24} color="#FFFFFF" />
              <Text style={styles.dangerButtonText}>Stop Trip</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.secondaryButton} onPress={handleViewHistory}>
            <Ionicons name="list" size={24} color="#4F46E5" />
            <Text style={styles.secondaryButtonText}>View History</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  welcomeText: {
    fontSize: 16,
    color: '#6B7280',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  userRole: {
    fontSize: 14,
    color: '#4F46E5',
    textTransform: 'capitalize',
  },
  profileButton: {
    padding: 8,
  },
  dateContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  dateText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#374151',
  },
  statusCard: {
    margin: 20,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 12,
  },
  activeTripInfo: {
    paddingLeft: 36,
  },
  activeTripText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  statsContainer: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  actionsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 12,
  },
  dangerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 16,
  },
  secondaryButtonText: {
    color: '#4F46E5',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default EmployeeDashboard;
