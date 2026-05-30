import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';

const BarChart = ({ data = [], maxVal = null }) => {
  const animatedHeights = useRef(data.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    // Re-initialize animations if data changes
    if (animatedHeights.length !== data.length) {
      // Re-bind refs dynamically if needed
    }
    const animations = data.map((item, idx) => {
      const targetVal = item.trips || 0;
      const peak = maxVal || Math.max(...data.map(d => d.trips), 1);
      const ratio = targetVal / peak;
      const heightPercent = Math.max(ratio * 100, 5); // minimum height of 5% for visual indicator
      
      return Animated.timing(animatedHeights[idx] || new Animated.Value(0), {
        toValue: heightPercent,
        duration: 800,
        useNativeDriver: false,
      });
    });
    Animated.parallel(animations).start();
  }, [data, maxVal]);

  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No data available</Text>
      </View>
    );
  }

  const peakVal = maxVal || Math.max(...data.map(d => d.trips), 1);

  return (
    <View style={styles.container}>
      <View style={styles.chartArea}>
        {/* Y Axis Grid lines */}
        <View style={styles.gridLinesContainer}>
          <View style={styles.gridLineRow}>
            <Text style={styles.gridLabel}>{Math.round(peakVal)}</Text>
            <View style={styles.gridLine} />
          </View>
          <View style={styles.gridLineRow}>
            <Text style={styles.gridLabel}>{Math.round(peakVal / 2)}</Text>
            <View style={styles.gridLine} />
          </View>
          <View style={styles.gridLineRow}>
            <Text style={styles.gridLabel}>0</Text>
            <View style={styles.gridLine} />
          </View>
        </View>

        {/* Bars Container */}
        <View style={styles.barsContainer}>
          {data.map((item, idx) => {
            const heightStyle = animatedHeights[idx] ? {
              height: animatedHeights[idx].interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%']
              })
            } : { height: '5%' };

            return (
              <View key={idx} style={styles.barColumn}>
                <View style={styles.barTrack}>
                  <Animated.View style={[styles.barFill, heightStyle]}>
                    {item.trips > 0 && (
                      <View style={styles.tooltip}>
                        <Text style={styles.tooltipText}>{item.trips}</Text>
                      </View>
                    )}
                  </Animated.View>
                </View>
                <Text style={styles.barLabel}>{item.date}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
  },
  emptyContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  chartArea: {
    flex: 1,
    flexDirection: 'row',
    position: 'relative',
  },
  gridLinesContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 24,
    justifyContent: 'space-between',
  },
  gridLineRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gridLabel: {
    width: 24,
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'left',
  },
  gridLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 4,
  },
  barsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginLeft: 28,
    marginRight: 8,
    height: '100%',
  },
  barColumn: {
    alignItems: 'center',
    width: '12%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barTrack: {
    flex: 1,
    width: 14,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    justifyContent: 'flex-end',
    overflow: 'visible',
    marginBottom: 6,
  },
  barFill: {
    width: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    position: 'relative',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  tooltip: {
    position: 'absolute',
    top: -22,
    backgroundColor: '#1F2937',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    zIndex: 10,
  },
  tooltipText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  barLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
  },
});

export default BarChart;
