import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const PROVIDER_GOOGLE = 'google';

export const Marker = ({ coordinate, title, description, children }) => {
  return (
    <View style={styles.markerContainer}>
      <Text style={styles.markerText}>📍 {title || 'Marker'}</Text>
      {children}
    </View>
  );
};

export const Polyline = () => <View />;
export const Callout = ({ children }) => <View>{children}</View>;
export const Circle = () => <View />;

export const MapView = ({ style, initialRegion, children }) => {
  return (
    <View style={[styles.mapContainer, style]}>
      <Text style={styles.mapText}>🗺️ [Web Map Preview]</Text>
      {initialRegion && (
        <Text style={styles.coordinatesText}>
          Lat: {initialRegion.latitude?.toFixed(4)}, Lon: {initialRegion.longitude?.toFixed(4)}
        </Text>
      )}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  mapContainer: {
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  mapText: {
    color: '#374151',
    fontWeight: 'bold',
    fontSize: 14,
  },
  coordinatesText: {
    color: '#6B7280',
    fontSize: 11,
    marginTop: 4,
  },
  markerContainer: {
    backgroundColor: '#FFFFFF',
    padding: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#EF4444',
    alignItems: 'center',
    marginTop: 8,
  },
  markerText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: 'bold',
  },
});

export default MapView;
