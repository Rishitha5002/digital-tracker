import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import storage from '../utils/storage';

const SplashScreen = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = await storage.getToken();
        const userData = await storage.getUserData();

        await new Promise(resolve => setTimeout(resolve, 1500));

        if (token && userData) {
          if (userData.role === 'admin') {
            navigation.replace('AdminTabs');
          } else {
            navigation.replace('EmployeeTabs');
          }
        } else {
          navigation.replace('Login');
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        navigation.replace('Login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.appTitle}>Digital Tracker</Text>
        <Text style={styles.subtitle}>Employee Location Tracking</Text>
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4F46E5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#E0E7FF',
    marginBottom: 40,
  },
  loadingContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#E0E7FF',
  },
});

export default SplashScreen;