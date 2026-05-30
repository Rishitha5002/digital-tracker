import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import { tripService } from '../api/tripService';
import storage from '../utils/storage';
import locationSocket from '../sockets/locationSocket';

const StartTripScreen = ({ navigation }) => {
  const [location, setLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    requestAndGetLocation();
  }, []);

  const requestAndGetLocation = async () => {
    setIsGettingLocation(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied. Please enable it in settings.');
        setIsGettingLocation(false);
        return;
      }
      await fetchLocation();
    } catch (err) {
      setError('Failed to get location permission.');
      setIsGettingLocation(false);
    }
  };

  const fetchLocation = async () => {
    setIsGettingLocation(true);
    setError(null);
    try {
      const locationData = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude, accuracy } = locationData.coords;

      let address = null;
      try {
        const results = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (results.length > 0) {
          const r = results[0];
          address = [r.street, r.city, r.region]
            .filter(Boolean)
            .join(', ');
        }
      } catch (_) {}

      setLocation({ latitude, longitude, accuracy, address, timestamp: new Date() });
    } catch (err) {
      setError('Failed to get location. Make sure GPS is enabled.');
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleStartTrip = async () => {
    if (!location) {
      Alert.alert('Location Required', 'Please get your current location first.');
      return;
    }
    setIsLoading(true);
    try {
      const result = await tripService.startTrip({
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address || '',
      });

      const user = await storage.getUserData();
      const userId = user?.id || user?._id;
      if (userId && result.tripId) {
        locationSocket.connect();
        locationSocket.joinTracking(userId, result.tripId);
        locationSocket.sendLocationUpdate(location.latitude, location.longitude);
      }

      Alert.alert('Trip Started! 🚀', 'Your trip has been started successfully!', [
        { text: 'OK', onPress: () => navigation.navigate('StopTrip') }
      ]);
    } catch (err) {
      Alert.alert(
        'Error',
        err.response?.data?.msg || 'Failed to start trip. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>

        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="navigate-circle" size={40} color="#4F46E5" />
          <Text style={styles.title}>Start Trip</Text>
          <Text style={styles.subtitle}>
            Get your current location and start tracking
          </Text>
        </View>

        {/* Error */}
        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="warning-outline" size={18} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Location Card */}
        <View style={styles.locationCard}>
          {isGettingLocation ? (
            <View style={styles.locatingContainer}>
              <ActivityIndicator size="large" color="#4F46E5" />
              <Text style={styles.locatingText}>Getting your location...</Text>
            </View>
          ) : location ? (
            <View>
              <View style={styles.locationHeader}>
                <Ionicons name="location" size={22} color="#10B981" />
                <Text style={styles.locationTitle}>Location Found ✅</Text>
              </View>
              
              {/* Map View */}
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: location.latitude,
                  longitude: location.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                region={{
                  latitude: location.latitude,
                  longitude: location.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
              >
                <Marker
                  coordinate={{
                    latitude: location.latitude,
                    longitude: location.longitude,
                  }}
                  title="Your Location"
                  description="Current GPS Position"
                />
              </MapView>

              <View style={styles.locationRow}>
                <Text style={styles.locationLabel}>Latitude</Text>
                <Text style={styles.locationValue}>
                  {location.latitude.toFixed(6)}
                </Text>
              </View>
              <View style={styles.locationRow}>
                <Text style={styles.locationLabel}>Longitude</Text>
                <Text style={styles.locationValue}>
                  {location.longitude.toFixed(6)}
                </Text>
              </View>
              {location.accuracy && (
                <View style={styles.locationRow}>
                  <Text style={styles.locationLabel}>Accuracy</Text>
                  <Text style={styles.locationValue}>
                    ±{location.accuracy.toFixed(0)}m
                  </Text>
                </View>
              )}
              {location.address && (
                <View style={styles.addressBox}>
                  <Ionicons name="map-outline" size={16} color="#6B7280" />
                  <Text style={styles.addressText}>{location.address}</Text>
                </View>
              )}
              <Text style={styles.timestamp}>
                Updated at {new Date(location.timestamp).toLocaleTimeString()}
              </Text>
            </View>
          ) : (
            <View style={styles.noLocationContainer}>
              <Ionicons name="location-outline" size={56} color="#D1D5DB" />
              <Text style={styles.noLocationText}>No Location Data</Text>
              <Text style={styles.noLocationSubtext}>
                Tap "Get Location" below to fetch your GPS coordinates
              </Text>
            </View>
          )}
        </View>

        {/* Buttons */}
        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.locationBtn, isGettingLocation && styles.disabledBtn]}
            onPress={fetchLocation}
            disabled={isGettingLocation}
          >
            {isGettingLocation ? (
              <ActivityIndicator color="#4F46E5" size="small" />
            ) : (
              <>
                <Ionicons name="refresh" size={20} color="#4F46E5" />
                <Text style={styles.locationBtnText}>
                  {location ? 'Refresh Location' : 'Get Location'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.startBtn,
              (!location || isLoading) && styles.disabledBtn
            ]}
            onPress={handleStartTrip}
            disabled={!location || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons name="play-circle" size={24} color="#FFFFFF" />
                <Text style={styles.startBtnText}>Start Trip</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  content: { flex: 1, padding: 20 },
  header: { alignItems: 'center', marginBottom: 24 },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 8,
    marginBottom: 4,
  },
  subtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  errorText: { color: '#EF4444', fontSize: 13, marginLeft: 8, flex: 1 },
  locationCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  map: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  locatingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  locatingText: { marginTop: 12, fontSize: 16, color: '#6B7280' },
  noLocationContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  noLocationText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
    marginBottom: 8,
  },
  noLocationSubtext: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  locationLabel: { fontSize: 14, color: '#6B7280' },
  locationValue: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    padding: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  addressText: {
    fontSize: 13,
    color: '#374151',
    marginLeft: 6,
    flex: 1,
  },
  timestamp: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 12,
    textAlign: 'right',
  },
  buttons: { gap: 12 },
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 14,
  },
  locationBtnText: {
    color: '#4F46E5',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 16,
  },
  startBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  disabledBtn: {
    opacity: 0.5,
  },
});

export default StartTripScreen;