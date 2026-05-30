import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Platform, View, Alert, SafeAreaView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import EmployeeDashboard from '../screens/EmployeeDashboard';
import StartTripScreen from '../screens/StartTripScreen';
import StopTripScreen from '../screens/StopTripScreen';
import TripHistoryScreen from '../screens/TripHistoryScreen';
import AdminDashboard from '../screens/AdminDashboard';
import ProfileScreen from '../screens/ProfileScreen';
import AddExpenseScreen from '../screens/AddExpenseScreen';
import MyExpensesScreen from '../screens/MyExpensesScreen';
import AdminExpensesScreen from '../screens/AdminExpensesScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import HelpSupportScreen from '../screens/HelpSupportScreen';
import AboutScreen from '../screens/AboutScreen';

// Import newly created screens
import TripDetailScreen from '../screens/TripDetailScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import AdminAnalyticsScreen from '../screens/AdminAnalyticsScreen';
import AttendanceScreen from '../screens/AttendanceScreen';
import PerformanceScreen from '../screens/PerformanceScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const EmployeeTabNavigator = () => {
  const insets = useSafeAreaInsets();

  const tabBarStyle = {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingBottom: insets.bottom,
    paddingTop: 8,
    height: Platform.OS === 'ios' ? 60 + insets.bottom : 70,
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'EmployeeDashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'StartTrip') {
            iconName = focused ? 'play-circle' : 'play-circle-outline';
          } else if (route.name === 'StopTrip') {
            iconName = focused ? 'stop-circle' : 'stop-circle-outline';
          } else if (route.name === 'TripHistory') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'MyExpenses') {
            iconName = focused ? 'wallet' : 'wallet-outline';
          } else if (route.name === 'Analytics') {
            iconName = focused ? 'analytics' : 'analytics-outline';
          } else if (route.name === 'Attendance') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Performance') {
            iconName = focused ? 'ribbon' : 'ribbon-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4F46E5',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: tabBarStyle,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
        headerShown: false,
      })}
    >
      <Tab.Screen name="EmployeeDashboard" component={EmployeeDashboard} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="StartTrip" component={StartTripScreen} options={{ tabBarLabel: 'Start' }} />
      <Tab.Screen name="StopTrip" component={StopTripScreen} options={{ tabBarLabel: 'Stop' }} />
      <Tab.Screen name="TripHistory" component={TripHistoryScreen} options={{ tabBarLabel: 'History' }} />
      <Tab.Screen name="MyExpenses" component={MyExpensesScreen} options={{ tabBarLabel: 'Expenses' }} />
      <Tab.Screen name="Analytics" component={AnalyticsScreen} options={{ tabBarLabel: 'Analytics' }} />
      <Tab.Screen name="Attendance" component={AttendanceScreen} options={{ tabBarLabel: 'Attendance' }} />
      <Tab.Screen name="Performance" component={PerformanceScreen} options={{ tabBarLabel: 'Performance' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
};

const AdminTabNavigator = () => {
  const insets = useSafeAreaInsets();

  const tabBarStyle = {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingBottom: insets.bottom,
    paddingTop: 8,
    height: Platform.OS === 'ios' ? 60 + insets.bottom : 70,
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'AdminDashboard') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'AdminExpenses') {
            iconName = focused ? 'wallet' : 'wallet-outline';
          } else if (route.name === 'AdminAnalytics') {
            iconName = focused ? 'analytics' : 'analytics-outline';
          } else if (route.name === 'Attendance') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Performance') {
            iconName = focused ? 'ribbon' : 'ribbon-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4F46E5',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: tabBarStyle,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
        headerShown: false,
      })}
    >
      <Tab.Screen name="AdminDashboard" component={AdminDashboard} options={{ tabBarLabel: 'Dashboard' }} />
      <Tab.Screen name="AdminExpenses" component={AdminExpensesScreen} options={{ tabBarLabel: 'Expenses' }} />
      <Tab.Screen name="AdminAnalytics" component={AdminAnalyticsScreen} options={{ tabBarLabel: 'Analytics' }} />
      <Tab.Screen name="Attendance" component={AttendanceScreen} options={{ tabBarLabel: 'Attendance' }} />
      <Tab.Screen name="Performance" component={PerformanceScreen} options={{ tabBarLabel: 'Performance' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const navigationRef = useRef(null);

  useEffect(() => {
    // Check for authentication status changes
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token && navigationRef.current) {
          // No token, navigate to login
          navigationRef.current.resetRoot({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      }
    };

    checkAuth();
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="EmployeeTabs" component={EmployeeTabNavigator} />
        <Stack.Screen name="AdminTabs" component={AdminTabNavigator} />
        <Stack.Screen name="TripDetail" component={TripDetailScreen} />
        <Stack.Screen name="AddExpense" component={AddExpenseScreen} options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="HelpSupport" component={HelpSupportScreen} options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="About" component={AboutScreen} options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;