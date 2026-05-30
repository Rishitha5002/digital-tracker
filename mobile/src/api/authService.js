import apiClient from './client';
import axios from 'axios';

// Get API URL from environment variables
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.79.138.49:5000/api';

// Authentication service functions
export const authService = {
  // Login with email and password
  login: async (email, password) => {
    const response = await apiClient.post('/auth/login', {
      email,
      password,
    });
    return response.data;
  },

  // Register new user
  register: async (name, email, password, role = 'employee', designation = '') => {
    const response = await apiClient.post('/auth/register', {
      name,
      email,
      password,
      role,
      designation,
    });
    return response.data;
  },

  // Forgot password - send OTP
  forgotPassword: async (email) => {
    const response = await apiClient.post('/auth/forgot-password', {
      email,
    });
    return response.data;
  },

  // Verify OTP
  verifyOTP: async (email, otp) => {
    const response = await apiClient.post('/auth/verify-otp', {
      email,
      otp,
    });
    return response.data;
  },

  // Reset password with OTP
  resetPassword: async (email, otp, newPassword) => {
    const response = await apiClient.post('/auth/reset-password', {
      email,
      otp,
      newPassword,
    });
    return response.data;
  },

  // Resend OTP
  resendOTP: async (email) => {
    const response = await apiClient.post('/auth/resend-otp', {
      email,
    });
    return response.data;
  },

  // Refresh token using Firebase REST API
  refreshToken: async (refreshToken) => {
    try {
      const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || 'AIzaSyD3j6h6h6h6h6h6h6h6h6h6h6h6h6h6';
      const url = `https://securetoken.googleapis.com/v1/token?key=${FIREBASE_API_KEY}`;
      
      const response = await axios.post(url, {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      });

      return {
        token: response.data.id_token,
        refreshToken: response.data.refresh_token,
      };
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  },
};

export default authService;
