import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { authService } from './authService';

// Get API URL from environment variables
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.79.138.49:5000/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('Request with token:', config.url);
      }
    } catch (error) {
      console.error('Error getting token from AsyncStorage:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      console.log('Token expired, attempting to refresh...');

      try {
        // Try to refresh the token using Firebase
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        
        if (refreshToken) {
          console.log('Attempting token refresh...');
          const newTokens = await authService.refreshToken(refreshToken);
          
          // Save new tokens
          await AsyncStorage.setItem('token', newTokens.token);
          await AsyncStorage.setItem('refreshToken', newTokens.refreshToken);
          
          // Update the authorization header
          originalRequest.headers.Authorization = `Bearer ${newTokens.token}`;
          
          // Retry the original request
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
      }

      // If refresh failed or no refresh token, clear data and alert user
      console.log('Unauthorized! Clearing stored data...');
      console.log('Error details:', error.response?.data);
      try {
        await AsyncStorage.multiRemove(['token', 'refreshToken', 'userData']);
        Alert.alert('Session Expired', 'Please login again to continue');
        console.log('Token cleared, app should navigate to login');
      } catch (clearError) {
        console.error('Error clearing AsyncStorage:', clearError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
