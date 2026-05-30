import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { tripService } from '../api/tripService';

const TripHistoryScreen = ({ navigation }) => {
  const [trips, setTrips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useFocusEffect(
    useCallback(() => {
      loadTripHistory();
    }, [])
  );

  const loadTripHistory = async () => {
    try {
      setError(null);
      const history = await tripService.getHistory();
      setTrips(history);
    } catch (error) {
      setError('Failed to load trip history.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadTripHistory();
    setIsRefreshing(false);
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '--';
    return new Date(dateStr).toLocaleTimeString([], {
      hour: '2-digit', minute: '2-digit'
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '--';
    return new Date(dateStr).toLocaleDateString([], {
      weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  const formatDuration = (start, end) => {
    const startTime = new Date(start);
    const endTime = end ? new Date(end) : new Date();
    const mins = Math.floor((endTime - startTime) / 60000);
    if (mins < 60) return `${mins} min`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  const formatDistance = (distance) => {
    if (!distance) return '0 km';
    return `${(distance / 1000).toFixed(2)} km`;
  };

  const renderTripItem = ({ item, index }) => {
    const isActive = item.status === 'active';

    return (
      <TouchableOpacity
        style={[styles.tripCard, isActive && styles.activeTripCard]}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('TripDetail', { tripId: item._id })}
      >
        {/* Status Row */}
        <View style={styles.tripHeader}>
          <View style={styles.statusRow}>
            <View style={[
              styles.statusDot,
              { backgroundColor: isActive ? '#10B981' : '#4F46E5' }
            ]} />
            <Text style={[
              styles.statusText,
              { color: isActive ? '#10B981' : '#4F46E5' }
            ]}>
              {isActive ? 'Active' : 'Completed'}
            </Text>
          </View>
          <Text style={styles.dateText}>{formatDate(item.startTime)}</Text>
        </View>

        {/* Details */}
        <View style={styles.detailsGrid}>
          <View style={styles.detailBox}>
            <Ionicons name="time-outline" size={18} color="#6B7280" />
            <Text style={styles.detailLabel}>Start</Text>
            <Text style={styles.detailValue}>{formatTime(item.startTime)}</Text>
          </View>

          <View style={styles.detailBox}>
            <Ionicons name="time-outline" size={18} color="#6B7280" />
            <Text style={styles.detailLabel}>End</Text>
            <Text style={styles.detailValue}>
              {item.endTime ? formatTime(item.endTime) : 'Ongoing'}
            </Text>
          </View>

          <View style={styles.detailBox}>
            <Ionicons name="hourglass-outline" size={18} color="#6B7280" />
            <Text style={styles.detailLabel}>Duration</Text>
            <Text style={styles.detailValue}>
              {formatDuration(item.startTime, item.endTime)}
            </Text>
          </View>

          <View style={styles.detailBox}>
            <Ionicons name="speedometer-outline" size={18} color="#6B7280" />
            <Text style={styles.detailLabel}>Distance</Text>
            <Text style={styles.detailValue}>
              {formatDistance(item.distance)}
            </Text>
          </View>
        </View>

        {/* Active Badge */}
        {isActive && (
          <View style={styles.activeBadge}>
            <Ionicons name="pulse" size={14} color="#10B981" />
            <Text style={styles.activeBadgeText}>Currently Active</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading trips...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={trips}
        renderItem={renderTripItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Trip History</Text>
            <Text style={styles.subtitle}>
              {trips.length} {trips.length === 1 ? 'trip' : 'trips'} recorded
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="map-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No Trips Yet</Text>
            <Text style={styles.emptySubtitle}>
              Start your first trip to see history here
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation.navigate('StartTrip')}
            >
              <Ionicons name="play-circle" size={20} color="#FFFFFF" />
              <Text style={styles.emptyButtonText}>Start First Trip</Text>
            </TouchableOpacity>
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
  header: { marginBottom: 16 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#1F2937', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#6B7280' },
  tripCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  activeTripCard: {
    borderWidth: 1.5,
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center' },
  statusDot: {
    width: 8, height: 8, borderRadius: 4, marginRight: 6
  },
  statusText: { fontSize: 14, fontWeight: '700' },
  dateText: { fontSize: 13, color: '#6B7280' },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  detailBox: {
    width: '48%',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    alignItems: 'center',
  },
  detailLabel: { fontSize: 11, color: '#9CA3AF', marginTop: 4 },
  detailValue: { fontSize: 14, fontWeight: '700', color: '#1F2937', marginTop: 2 },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  activeBadgeText: { fontSize: 12, color: '#10B981', fontWeight: '600', marginLeft: 4 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: '#1F2937', marginTop: 16, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 24 },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  emptyButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600', marginLeft: 8 },
});

export default TripHistoryScreen;