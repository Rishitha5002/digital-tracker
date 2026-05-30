import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { tripService } from '../api/tripService';
import storage from '../utils/storage';
import locationSocket from '../sockets/locationSocket';

const STOP_THRESHOLD_SECONDS = 60;
const LOCATION_INTERVAL_MS = 10000;

const StopTripScreen = ({ navigation }) => {
  const [activeTrip, setActiveTrip] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [distance, setDistance] = useState(0);
  const [path, setPath] = useState([]);
  const [stops, setStops] = useState([]);
  const [currentStop, setCurrentStop] = useState(null);
  const [isStopped, setIsStopped] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(true);
  const [isLiveTracking, setIsLiveTracking] = useState(false);

  const timerRef = useRef(null);
  const locationRef = useRef(null);
  const lastMovingRef = useRef(Date.now());
  const lastLocationRef = useRef(null);
  const pathRef = useRef([]);
  const stopsRef = useRef([]);
  const currentStopRef = useRef(null);

  useEffect(() => {
    loadActiveTrip();
    return () => {
      clearInterval(timerRef.current);
      if (locationRef.current) locationRef.current.remove();
    };
  }, []);

  const loadActiveTrip = async () => {
    try {
      const trip = await tripService.getActiveTrip();
      if (trip) {
        setActiveTrip(trip);
        startTracking(trip);
      } else {
        setIsGettingLocation(false);
      }
    } catch (err) {
      setIsGettingLocation(false);
    }
  };

  const startTracking = async (trip) => {
    const startTime = new Date(trip.startTime);
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    const user = await storage.getUserData();
    const userId = user?.id || user?._id;
    if (userId && trip._id) {
      locationSocket.connect();
      locationSocket.joinTracking(userId, trip._id);
      setTimeout(() => setIsLiveTracking(locationSocket.isConnected()), 500);
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;

    locationRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: LOCATION_INTERVAL_MS,
        distanceInterval: 5,
      },
      (loc) => {
        const { latitude, longitude } = loc.coords;
        const newPoint = { latitude, longitude, timestamp: Date.now() };

        setCurrentLocation({ latitude, longitude });

        if (lastLocationRef.current) {
          const dist = calculateDistance(
            lastLocationRef.current.latitude,
            lastLocationRef.current.longitude,
            latitude,
            longitude
          );

          setDistance(prev => {
            const newDist = prev + dist;
            return newDist;
          });

          const speed = loc.coords.speed || 0;
          const isMoving = speed > 0.5 || dist > 10;

          if (!isMoving) {
            if (!currentStopRef.current) {
              const stop = {
                location: { latitude, longitude },
                address: '',
                startTime: new Date().toISOString(),
                duration: 0
              };
              currentStopRef.current = stop;
              setCurrentStop(stop);
              setIsStopped(true);

              Location.reverseGeocodeAsync({ latitude, longitude })
                .then(results => {
                  if (results.length > 0) {
                    const r = results[0];
                    const addr = [r.street, r.city].filter(Boolean).join(', ');
                    if (currentStopRef.current) {
                      currentStopRef.current.address = addr;
                      setCurrentStop(prev => prev ? { ...prev, address: addr } : null);
                    }
                  }
                }).catch(() => {});
            }
          } else {
            if (currentStopRef.current) {
              const stopDuration = Math.floor(
                (Date.now() - new Date(currentStopRef.current.startTime)) / 1000 / 60
              );
              if (stopDuration >= 1) {
                const completedStop = {
                  ...currentStopRef.current,
                  endTime: new Date().toISOString(),
                  duration: stopDuration
                };
                stopsRef.current = [...stopsRef.current, completedStop];
                setStops([...stopsRef.current]);
              }
              currentStopRef.current = null;
              setCurrentStop(null);
              setIsStopped(false);
            }
          }
        }

        lastLocationRef.current = newPoint;
        pathRef.current = [...pathRef.current, newPoint];
        setPath([...pathRef.current]);
        setIsGettingLocation(false);

        locationSocket.sendLocationUpdate(latitude, longitude);
      }
    );
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatStopTime = (dateStr) => {
    if (!dateStr) return '--';
    return new Date(dateStr).toLocaleTimeString([], {
      hour: '2-digit', minute: '2-digit'
    });
  };

  const handleStopTrip = async () => {
    if (!activeTrip) return;
    Alert.alert(
      'Stop Trip',
      'Are you sure you want to stop this trip?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Stop', style: 'destructive', onPress: confirmStop }
      ]
    );
  };

  const confirmStop = async () => {
    setIsLoading(true);
    try {
      clearInterval(timerRef.current);
      if (locationRef.current) locationRef.current.remove();

      let finalStops = [...stopsRef.current];
      if (currentStopRef.current) {
        const stopDuration = Math.floor(
          (Date.now() - new Date(currentStopRef.current.startTime)) / 1000 / 60
        );
        finalStops.push({
          ...currentStopRef.current,
          endTime: new Date().toISOString(),
          duration: stopDuration
        });
      }

      let endLocation = null;
      if (lastLocationRef.current) {
        endLocation = {
          latitude: lastLocationRef.current.latitude,
          longitude: lastLocationRef.current.longitude,
        };
        try {
          const results = await Location.reverseGeocodeAsync(endLocation);
          if (results.length > 0) {
            const r = results[0];
            endLocation.address = [r.street, r.city].filter(Boolean).join(', ');
          }
        } catch (_) {}
      }

      const stoppedTime = finalStops.reduce((sum, s) => sum + (s.duration || 0), 0) * 60;

      await tripService.stopTrip({
        tripId: activeTrip._id,
        path: pathRef.current,
        distance: Math.round(distance),
        stoppedTime,
        stops: finalStops,
        endLocation
      });

      locationSocket.endTracking();

      Alert.alert(
        '✅ Trip Completed!',
        `Duration: ${formatTime(elapsed)}\nDistance: ${(distance / 1000).toFixed(2)} km\nStops: ${finalStops.length}`,
        [{ text: 'OK', onPress: () => navigation.navigate('TripHistory') }]
      );
    } catch (err) {
      Alert.alert('Error', 'Failed to stop trip. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Stop Trip</Text>
          <Text style={styles.subtitle}>
            Your trip is being tracked{isLiveTracking ? ' (live to admin)' : ''}
          </Text>
        </View>

        {/* Timer Card */}
        <View style={styles.timerCard}>
          <View style={[
            styles.statusBadge,
            { backgroundColor: isStopped ? '#FEF3C7' : '#D1FAE5' }
          ]}>
            <View style={[
              styles.statusDot,
              { backgroundColor: isStopped ? '#F59E0B' : '#10B981' }
            ]} />
            <Text style={[
              styles.statusText,
              { color: isStopped ? '#D97706' : '#059669' }
            ]}>
              {isStopped ? '🅿️ Stopped' : '🚗 Moving'}
            </Text>
          </View>

          <Text style={styles.timer}>{formatTime(elapsed)}</Text>
          <Text style={styles.timerLabel}>Elapsed Time</Text>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Ionicons name="speedometer-outline" size={20} color="#4F46E5" />
              <Text style={styles.statValue}>
                {(distance / 1000).toFixed(2)}
              </Text>
              <Text style={styles.statLabel}>km</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Ionicons name="pause-circle-outline" size={20} color="#F59E0B" />
              <Text style={styles.statValue}>{stops.length}</Text>
              <Text style={styles.statLabel}>Stops</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Ionicons name="location-outline" size={20} color="#10B981" />
              <Text style={styles.statValue}>{path.length}</Text>
              <Text style={styles.statLabel}>Points</Text>
            </View>
          </View>
        </View>

        {/* Current Location */}
        {isGettingLocation ? (
          <View style={styles.locationCard}>
            <ActivityIndicator size="small" color="#4F46E5" />
            <Text style={styles.gettingText}>Getting location...</Text>
          </View>
        ) : currentLocation && (
          <View style={styles.locationCard}>
            <View style={styles.locationHeader}>
              <Ionicons name="location" size={18} color="#4F46E5" />
              <Text style={styles.locationTitle}>Current Location</Text>
            </View>
            
            {/* Map View */}
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              region={{
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
            >
              <Marker
                coordinate={{
                  latitude: currentLocation.latitude,
                  longitude: currentLocation.longitude,
                }}
                title="Current Location"
                description="Your current GPS position"
              />
              {path.length > 0 && (
                <Polyline
                  coordinates={path}
                  strokeColor="#4F46E5"
                  strokeWidth={3}
                />
              )}
            </MapView>

            <Text style={styles.coordsText}>
              {currentLocation.latitude.toFixed(5)}, {currentLocation.longitude.toFixed(5)}
            </Text>
          </View>
        )}

        {/* Current Stop */}
        {currentStop && (
          <View style={styles.currentStopCard}>
            <View style={styles.currentStopHeader}>
              <Ionicons name="time" size={18} color="#D97706" />
              <Text style={styles.currentStopTitle}>Currently Stopped</Text>
            </View>
            <Text style={styles.currentStopTime}>
              Since {formatStopTime(currentStop.startTime)}
            </Text>
            {currentStop.address ? (
              <Text style={styles.currentStopAddress}>{currentStop.address}</Text>
            ) : null}
          </View>
        )}

        {/* Stops List */}
        {stops.length > 0 && (
          <View style={styles.stopsCard}>
            <Text style={styles.stopsTitle}>
              Stops Recorded ({stops.length})
            </Text>
            {stops.map((stop, index) => (
              <View key={index} style={styles.stopItem}>
                <View style={styles.stopNumber}>
                  <Text style={styles.stopNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.stopInfo}>
                  <Text style={styles.stopAddress}>
                    {stop.address || 'Unknown Location'}
                  </Text>
                  <Text style={styles.stopTime}>
                    {formatStopTime(stop.startTime)} → {formatStopTime(stop.endTime)}
                  </Text>
                  <Text style={styles.stopDuration}>
                    ⏱ {stop.duration} min
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

      </ScrollView>

      {/* Stop Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.stopButton, isLoading && styles.disabledButton]}
          onPress={handleStopTrip}
          disabled={isLoading || !activeTrip}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Ionicons name="stop-circle" size={24} color="#FFFFFF" />
              <Text style={styles.stopButtonText}>Stop Trip</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 100 },
  header: { marginBottom: 16 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#1F2937' },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  timerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  statusDot: {
    width: 8, height: 8, borderRadius: 4, marginRight: 6,
  },
  statusText: { fontSize: 14, fontWeight: '600' },
  timer: { fontSize: 52, fontWeight: 'bold', color: '#1F2937', letterSpacing: 2 },
  timerLabel: { fontSize: 13, color: '#9CA3AF', marginTop: 4, marginBottom: 20 },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-around',
  },
  statBox: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#1F2937', marginTop: 4 },
  statLabel: { fontSize: 11, color: '#9CA3AF' },
  statDivider: { width: 1, height: 40, backgroundColor: '#E5E7EB' },
  locationCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  locationHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  locationTitle: { fontSize: 13, fontWeight: '600', color: '#4F46E5', marginLeft: 6 },
  coordsText: { fontSize: 12, color: '#4F46E5', marginLeft: 4, marginTop: 8 },
  gettingText: { fontSize: 14, color: '#6B7280', marginLeft: 8 },
  map: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 8,
  },
  currentStopCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  currentStopHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  currentStopTitle: { fontSize: 14, fontWeight: '600', color: '#D97706', marginLeft: 6 },
  currentStopTime: { fontSize: 13, color: '#92400E', marginBottom: 4 },
  currentStopAddress: { fontSize: 13, color: '#78350F' },
  stopsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  stopsTitle: { fontSize: 15, fontWeight: '700', color: '#1F2937', marginBottom: 12 },
  stopItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  stopNumber: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#4F46E5',
    justifyContent: 'center', alignItems: 'center',
    marginRight: 10, marginTop: 2,
  },
  stopNumberText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
  stopInfo: { flex: 1 },
  stopAddress: { fontSize: 14, fontWeight: '600', color: '#1F2937', marginBottom: 2 },
  stopTime: { fontSize: 12, color: '#6B7280', marginBottom: 2 },
  stopDuration: { fontSize: 12, color: '#4F46E5', fontWeight: '500' },
  footer: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: '#FFFFFF',
    padding: 16,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
  },
  stopButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  disabledButton: { opacity: 0.5 },
});

export default StopTripScreen;