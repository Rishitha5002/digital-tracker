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

const TripDetailScreen = ({ navigation, route }) => {
  const { tripId } = route.params || {};
  const [trip, setTrip] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchTripDetail = async () => {
    try {
      setError(null);
      const data = await tripService.getTripDetail(tripId);
      setTrip(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load trip details. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (tripId) {
      fetchTripDetail();
    } else {
      setError('No Trip ID provided.');
      setIsLoading(false);
    }
  }, [tripId]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchTripDetail();
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

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !trip) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text style={styles.errorText}>{error || 'Trip not found'}</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trip Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#4F46E5']} />
        }
      >
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: trip.status === 'active' ? '#10B981' : '#4F46E5' }
              ]}
            />
            <Text
              style={[
                styles.statusText,
                { color: trip.status === 'active' ? '#10B981' : '#4F46E5' }
              ]}
            >
              {trip.status === 'active' ? 'Active' : 'Completed'}
            </Text>
          </View>
          <Text style={styles.dateText}>{formatDate(trip.startTime)}</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="play-outline" size={20} color="#4F46E5" />
            <Text style={styles.statLabel}>Started At</Text>
            <Text style={styles.statVal}>{formatTime(trip.startTime)}</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="stop-outline" size={20} color="#4F46E5" />
            <Text style={styles.statLabel}>Ended At</Text>
            <Text style={styles.statVal}>
              {trip.endTime ? formatTime(trip.endTime) : 'Ongoing'}
            </Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="hourglass-outline" size={20} color="#4F46E5" />
            <Text style={styles.statLabel}>Duration</Text>
            <Text style={styles.statVal}>
              {formatDuration(trip.startTime, trip.endTime)}
            </Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="speedometer-outline" size={20} color="#4F46E5" />
            <Text style={styles.statLabel}>Distance</Text>
            <Text style={styles.statVal}>{formatDistance(trip.distance)}</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="location-outline" size={20} color="#4F46E5" />
            <Text style={styles.statLabel}>GPS Points</Text>
            <Text style={styles.statVal}>{trip.path?.length || 0} pts</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="pause-circle-outline" size={20} color="#4F46E5" />
            <Text style={styles.statLabel}>Stop Time</Text>
            <Text style={styles.statVal}>{trip.stoppedTime || 0} min</Text>
          </View>
        </View>

        {/* Start / End Locations */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Locations</Text>
          <View style={styles.locationRow}>
            <Ionicons name="radio-button-on" size={16} color="#10B981" />
            <View style={styles.locationDetail}>
              <Text style={styles.locationLabel}>Start Location</Text>
              <Text style={styles.locationText}>
                {trip.startLocation?.address ||
                  `Lat: ${trip.startLocation?.latitude?.toFixed(4)}, Lon: ${trip.startLocation?.longitude?.toFixed(4)}`}
              </Text>
            </View>
          </View>
          <View style={styles.lineConnector} />
          <View style={styles.locationRow}>
            <Ionicons name="location" size={16} color="#EF4444" />
            <View style={styles.locationDetail}>
              <Text style={styles.locationLabel}>End Location</Text>
              <Text style={styles.locationText}>
                {trip.endTime
                  ? trip.endLocation?.address ||
                    `Lat: ${trip.endLocation?.latitude?.toFixed(4)}, Lon: ${trip.endLocation?.longitude?.toFixed(4)}`
                  : 'Ongoing trip'}
              </Text>
            </View>
          </View>
        </View>

        {/* Stops List */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Stops Details ({trip.stops?.length || 0})</Text>
          {(!trip.stops || trip.stops.length === 0) ? (
            <Text style={styles.emptyStopsText}>No significant stops recorded on this trip.</Text>
          ) : (
            trip.stops.map((stop, idx) => (
              <View key={stop._id || idx} style={styles.stopItem}>
                <View style={styles.stopTimeline}>
                  <View style={styles.stopIconCircle}>
                    <Ionicons name="pause" size={12} color="#4F46E5" />
                  </View>
                  {idx !== trip.stops.length - 1 && <View style={styles.timelineLine} />}
                </View>
                <View style={styles.stopInfo}>
                  <Text style={styles.stopAddress}>{stop.address || 'Unknown Stop'}</Text>
                  <Text style={styles.stopTime}>
                    {formatTime(stop.startTime)} - {stop.endTime ? formatTime(stop.endTime) : 'Present'}
                  </Text>
                  <Text style={styles.stopDuration}>Duration: {stop.duration || 0} min</Text>
                  {stop.reason ? <Text style={styles.stopReason}>Reason: {stop.reason}</Text> : null}
                </View>
              </View>
            ))
          )}
        </View>

        {/* Add Expense Button */}
        <TouchableOpacity
          style={styles.addExpenseBtn}
          onPress={() => navigation.navigate('AddExpense', { tripId: trip._id })}
        >
          <Ionicons name="wallet-outline" size={20} color="#FFFFFF" />
          <Text style={styles.addExpenseText}>Log Expense for Trip</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#6B7280' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorText: { fontSize: 16, color: '#EF4444', marginVertical: 16, textAlign: 'center' },
  backButton: { backgroundColor: '#4F46E5', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  backButtonText: { color: '#FFFFFF', fontWeight: 'bold' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 100 },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  statusText: { fontSize: 16, fontWeight: 'bold' },
  dateText: { fontSize: 14, color: '#6B7280' },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 6 },
  statVal: { fontSize: 15, fontWeight: '700', color: '#1F2937', marginTop: 2 },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 12 },
  locationRow: { flexDirection: 'row', alignItems: 'flex-start' },
  locationDetail: { marginLeft: 12, flex: 1 },
  locationLabel: { fontSize: 12, color: '#9CA3AF' },
  locationText: { fontSize: 14, color: '#1F2937', fontWeight: '500', marginTop: 2 },
  lineConnector: {
    width: 2,
    height: 24,
    backgroundColor: '#E5E7EB',
    marginLeft: 7,
    marginVertical: 4,
  },
  emptyStopsText: { color: '#9CA3AF', fontSize: 14, textAlign: 'center', marginVertical: 10 },
  stopItem: { flexDirection: 'row', marginBottom: 16 },
  stopTimeline: { alignItems: 'center', width: 24, marginRight: 8 },
  stopIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#4F46E5',
  },
  timelineLine: { flex: 1, width: 2, backgroundColor: '#E5E7EB', marginTop: 4 },
  stopInfo: { flex: 1, marginLeft: 8 },
  stopAddress: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  stopTime: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  stopDuration: { fontSize: 12, color: '#4F46E5', fontWeight: '500', marginTop: 2 },
  stopReason: { fontSize: 12, color: '#F59E0B', fontStyle: 'italic', marginTop: 2 },
  addExpenseBtn: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
  },
  addExpenseText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});

export default TripDetailScreen;
