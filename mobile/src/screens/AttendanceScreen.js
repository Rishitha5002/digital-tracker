import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { tripService } from '../api/tripService';
import { adminService } from '../api/adminService';
import storage from '../utils/storage';

const AttendanceScreen = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [trips, setTrips] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Calendar current view month/year
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  const [selectedDayData, setSelectedDayData] = useState(null);

  const initData = async () => {
    try {
      setIsLoading(true);
      const user = await storage.getUserData();
      if (user && user.role === 'admin') {
        setIsAdmin(true);
        const empList = await adminService.getEmployees();
        setEmployees(empList);
        if (empList.length > 0) {
          setSelectedEmployee(empList[0]);
          await loadTrips(empList[0]._id, true);
        } else {
          setIsLoading(false);
        }
      } else {
        setIsAdmin(false);
        await loadTrips(null, false);
      }
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  };

  const loadTrips = async (employeeId, isUserAdmin) => {
    try {
      let data = [];
      if (isUserAdmin && employeeId) {
        data = await adminService.getEmployeeTrips(employeeId);
      } else {
        data = await tripService.getHistory();
      }
      setTrips(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      initData();
    }, [])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    if (isAdmin && selectedEmployee) {
      loadTrips(selectedEmployee._id, true);
    } else {
      loadTrips(null, false);
    }
  };

  const handleEmployeeChange = (employee) => {
    setSelectedEmployee(employee);
    setIsLoading(true);
    loadTrips(employee._id, true);
  };

  // Helper: group trips by date (YYYY-MM-DD)
  const getDailyTrips = () => {
    const daily = {};
    trips.forEach(trip => {
      if (!trip.startTime) return;
      const dateKey = new Date(trip.startTime).toISOString().split('T')[0];
      if (!daily[dateKey]) {
        daily[dateKey] = [];
      }
      daily[dateKey].push(trip);
    });
    return daily;
  };

  const dailyTripsMap = getDailyTrips();

  // Calendar logic
  const daysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
  const firstDayIndex = (month, year) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setSelectedDayData(null);
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setSelectedDayData(null);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Generate calendar days
  const numDays = daysInMonth(currentMonth, currentYear);
  const firstDay = firstDayIndex(currentMonth, currentYear);
  const calendarCells = [];

  // Empty cells before start day
  for (let i = 0; i < firstDay; i++) {
    calendarCells.push({ dayNum: null, dateKey: null });
  }

  // Actual day cells
  for (let day = 1; day <= numDays; day++) {
    const dStr = String(day).padStart(2, '0');
    const mStr = String(currentMonth + 1).padStart(2, '0');
    const dateKey = `${currentYear}-${mStr}-${dStr}`;
    calendarCells.push({ dayNum: day, dateKey });
  }

  const handleDaySelect = (dayObj) => {
    if (!dayObj.dateKey) return;
    const dayTrips = dailyTripsMap[dayObj.dateKey] || [];
    if (dayTrips.length === 0) {
      setSelectedDayData({
        date: dayObj.dateKey,
        tripsCount: 0,
        totalHours: 0,
        startTime: null,
        endTime: null
      });
      return;
    }

    // Calculate details
    let earliestStart = null;
    let latestEnd = null;
    let totalDurationMs = 0;

    dayTrips.forEach(t => {
      const sTime = new Date(t.startTime);
      const eTime = t.endTime ? new Date(t.endTime) : new Date();
      if (!earliestStart || sTime < earliestStart) earliestStart = sTime;
      if (!latestEnd || eTime > latestEnd) latestEnd = eTime;
      totalDurationMs += (eTime - sTime);
    });

    const totalMinutes = Math.floor(totalDurationMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    setSelectedDayData({
      date: dayObj.dateKey,
      tripsCount: dayTrips.length,
      totalHours: (totalMinutes / 60).toFixed(1),
      formattedHours: `${hours}h ${minutes}m`,
      startTime: earliestStart,
      endTime: latestEnd
    });
  };

  const getDayStatus = (dateKey) => {
    if (!dateKey) return 'none';
    const dayTrips = dailyTripsMap[dateKey] || [];
    if (dayTrips.length === 0) {
      // check if past weekday (Mon-Fri)
      const cellDate = new Date(dateKey);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (cellDate < today) {
        const dayOfWeek = cellDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          return 'absent'; // past weekday with no trips
        }
      }
      return 'none';
    }

    // Sum durations
    let totalMins = 0;
    dayTrips.forEach(t => {
      const start = new Date(t.startTime);
      const end = t.endTime ? new Date(t.endTime) : new Date();
      totalMins += Math.floor((end - start) / 60000);
    });

    if (totalMins >= 480) {
      return 'present'; // 8+ hours
    } else {
      return 'partial'; // <8 hours but >0
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return '#10B981'; // Green
      case 'partial': return '#F59E0B'; // Amber
      case 'absent': return '#EF4444'; // Red
      default: return 'transparent';
    }
  };

  const formatTimeStr = (date) => {
    if (!date) return '--';
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateStr = (dateStr) => {
    if (!dateStr) return '--';
    return new Date(dateStr).toLocaleDateString([], {
      weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Attendance Summary</Text>
      </View>

      {/* Admin Employee Selector */}
      {isAdmin && (
        <View style={styles.adminSelectorCard}>
          <Text style={styles.selectorLabel}>Select Employee:</Text>
          <FlatList
            horizontal
            data={employees}
            keyExtractor={(item) => item._id}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.employeeChip,
                  selectedEmployee?._id === item._id && styles.activeChip
                ]}
                onPress={() => handleEmployeeChange(item)}
              >
                <Text
                  style={[
                    styles.chipText,
                    selectedEmployee?._id === item._id && styles.activeChipText
                  ]}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.chipsContainer}
          />
        </View>
      )}

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading attendance data...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#4F46E5']} />
          }
        >
          {/* Calendar Card */}
          <View style={styles.calendarCard}>
            {/* Calendar Header controls */}
            <View style={styles.calControls}>
              <TouchableOpacity onPress={handlePrevMonth} style={styles.ctrlBtn}>
                <Ionicons name="chevron-back" size={20} color="#4F46E5" />
              </TouchableOpacity>
              <Text style={styles.calMonthTitle}>
                {monthNames[currentMonth]} {currentYear}
              </Text>
              <TouchableOpacity onPress={handleNextMonth} style={styles.ctrlBtn}>
                <Ionicons name="chevron-forward" size={20} color="#4F46E5" />
              </TouchableOpacity>
            </View>

            {/* Week labels */}
            <View style={styles.weekLabelsRow}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <Text key={day} style={styles.weekLabel}>{day}</Text>
              ))}
            </View>

            {/* Calendar Grid */}
            <View style={styles.gridContainer}>
              {calendarCells.map((cell, idx) => {
                const status = getDayStatus(cell.dateKey);
                const isSelected = selectedDayData?.date === cell.dateKey;
                
                return (
                  <TouchableOpacity
                    key={idx}
                    disabled={!cell.dayNum}
                    style={[
                      styles.cell,
                      isSelected && styles.selectedCell,
                    ]}
                    onPress={() => handleDaySelect(cell)}
                  >
                    <Text style={[styles.cellText, !cell.dayNum && styles.emptyCellText]}>
                      {cell.dayNum}
                    </Text>
                    {cell.dayNum && (
                      <View
                        style={[
                          styles.statusDot,
                          { backgroundColor: getStatusColor(status) }
                        ]}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Legend */}
            <View style={styles.legendContainer}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                <Text style={styles.legendText}>Present (8h+)</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
                <Text style={styles.legendText}>Partial (&lt;8h)</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                <Text style={styles.legendText}>Absent</Text>
              </View>
            </View>
          </View>

          {/* Daily Summary Card */}
          {selectedDayData && (
            <View style={styles.detailsCard}>
              <Text style={styles.detailsTitle}>
                Summary for {formatDateStr(selectedDayData.date)}
              </Text>
              {selectedDayData.tripsCount === 0 ? (
                <Text style={styles.noTripsText}>No activity recorded on this day.</Text>
              ) : (
                <View style={styles.detailsGrid}>
                  <View style={styles.detailBox}>
                    <Ionicons name="play" size={16} color="#4F46E5" />
                    <Text style={styles.detailLabel}>First Trip</Text>
                    <Text style={styles.detailVal}>
                      {formatTimeStr(selectedDayData.startTime)}
                    </Text>
                  </View>

                  <View style={styles.detailBox}>
                    <Ionicons name="stop" size={16} color="#4F46E5" />
                    <Text style={styles.detailLabel}>Last Trip</Text>
                    <Text style={styles.detailVal}>
                      {formatTimeStr(selectedDayData.endTime)}
                    </Text>
                  </View>

                  <View style={styles.detailBox}>
                    <Ionicons name="hourglass" size={16} color="#4F46E5" />
                    <Text style={styles.detailLabel}>Total Hours</Text>
                    <Text style={styles.detailVal}>{selectedDayData.formattedHours}</Text>
                  </View>

                  <View style={styles.detailBox}>
                    <Ionicons name="map" size={16} color="#4F46E5" />
                    <Text style={styles.detailLabel}>Trips Run</Text>
                    <Text style={styles.detailVal}>{selectedDayData.tripsCount} trips</Text>
                  </View>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 12, fontSize: 16, color: '#6B7280' },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
  adminSelectorCard: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  selectorLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6B7280',
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  chipsContainer: {
    paddingHorizontal: 12,
    gap: 8,
  },
  employeeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activeChip: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  chipText: { fontSize: 13, color: '#4B5563', fontWeight: '500' },
  activeChipText: { color: '#FFFFFF', fontWeight: 'bold' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 100 },
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  calControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  ctrlBtn: { padding: 6, backgroundColor: '#EEF2FF', borderRadius: 8 },
  calMonthTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
  weekLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  weekLabel: {
    width: '13%',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cell: {
    width: '13%',
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
    borderRadius: 8,
  },
  selectedCell: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#4F46E5',
  },
  cellText: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  emptyCellText: { color: 'transparent' },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 4,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    marginTop: 16,
    paddingTop: 12,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  legendText: { fontSize: 11, color: '#6B7280', fontWeight: '500' },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  detailsTitle: { fontSize: 15, fontWeight: 'bold', color: '#1F2937', marginBottom: 12 },
  noTripsText: { color: '#9CA3AF', fontSize: 14, textAlign: 'center', paddingVertical: 10 },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  detailBox: {
    width: '48%',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  detailLabel: { fontSize: 11, color: '#9CA3AF', marginTop: 4 },
  detailVal: { fontSize: 14, fontWeight: '700', color: '#1F2937', marginTop: 2 },
});

export default AttendanceScreen;
