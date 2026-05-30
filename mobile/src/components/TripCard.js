import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import formatters from '../utils/formatters';

const TripCard = ({ 
  trip, 
  onPress, 
  showDetails = true,
  compact = false 
}) => {
  const duration = trip.endTime 
    ? Math.floor((new Date(trip.endTime) - new Date(trip.startTime)) / 1000)
    : Math.floor((Date.now() - new Date(trip.startTime)) / 1000);

  const statusColor = formatters.getTripStatusColor(trip.status);
  const statusText = formatters.getTripStatusText(trip.status);

  if (compact) {
    return (
      <TouchableOpacity 
        style={[styles.compactCard, { borderLeftColor: statusColor }]}
        onPress={() => onPress && onPress(trip)}
      >
        <View style={styles.compactHeader}>
          <View style={styles.compactStatus}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={styles.compactStatusText}>{statusText}</Text>
          </View>
          <Text style={styles.compactDate}>
            {formatters.formatDate(trip.startTime)}
          </Text>
        </View>
        
        <View style={styles.compactDetails}>
          <Text style={styles.compactTime}>
            {formatters.formatTime(trip.startTime)} - 
            {trip.endTime ? formatters.formatTime(trip.endTime) : 'Ongoing'}
          </Text>
          <Text style={styles.compactStats}>
            {formatters.formatDuration(duration)} • {formatters.formatDistance(trip.distance || 0)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => onPress && onPress(trip)}
    >
      <View style={styles.header}>
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={styles.statusText}>{statusText}</Text>
        </View>
        <Text style={styles.date}>
          {formatters.formatDate(trip.startTime)}
        </Text>
      </View>

      {showDetails && (
        <View style={styles.details}>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Ionicons name="time-outline" size={16} color="#6B7280" />
              <Text style={styles.detailLabel}>Start:</Text>
              <Text style={styles.detailValue}>
                {formatters.formatTime(trip.startTime)}
              </Text>
            </View>

            {trip.endTime && (
              <View style={styles.detailItem}>
                <Ionicons name="time-outline" size={16} color="#6B7280" />
                <Text style={styles.detailLabel}>End:</Text>
                <Text style={styles.detailValue}>
                  {formatters.formatTime(trip.endTime)}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Ionicons name="hourglass-outline" size={16} color="#6B7280" />
              <Text style={styles.detailLabel}>Duration:</Text>
              <Text style={styles.detailValue}>
                {formatters.formatDuration(duration)}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Ionicons name="speedometer-outline" size={16} color="#6B7280" />
              <Text style={styles.detailLabel}>Distance:</Text>
              <Text style={styles.detailValue}>
                {formatters.formatDistance(trip.distance || 0)}
              </Text>
            </View>
          </View>

          {trip.path && trip.path.length > 0 && (
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Ionicons name="location-outline" size={16} color="#6B7280" />
                <Text style={styles.detailLabel}>Points:</Text>
                <Text style={styles.detailValue}>{trip.path.length}</Text>
              </View>

              {trip.stops && trip.stops.length > 0 && (
                <View style={styles.detailItem}>
                  <Ionicons name="pause-circle-outline" size={16} color="#6B7280" />
                  <Text style={styles.detailLabel}>Stops:</Text>
                  <Text style={styles.detailValue}>{trip.stops.length}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {trip.status === 'active' && (
        <View style={styles.activeIndicator}>
          <Ionicons name="pulse" size={16} color="#10B981" />
          <Text style={styles.activeText}>Currently Active</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  compactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  compactStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  date: {
    fontSize: 14,
    color: '#6B7280',
  },
  compactDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  details: {
    flex: 1,
  },
  compactDetails: {
    flex: 1,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
    marginRight: 4,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1F2937',
  },
  compactTime: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  compactStats: {
    fontSize: 12,
    color: '#6B7280',
  },
  activeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  activeText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
    marginLeft: 4,
  },
});

export default TripCard;
