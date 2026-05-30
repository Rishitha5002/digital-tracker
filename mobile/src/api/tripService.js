import apiClient from './client';

// Trip service functions
export const tripService = {
  // Start a new trip
  startTrip: async (location = null) => {
    const body = location?.latitude != null
      ? {
          latitude: location.latitude,
          longitude: location.longitude,
          address: location.address || '',
        }
      : {};
    const response = await apiClient.post('/trips/start', body);
    return response.data;
  },

  // Stop current trip
  stopTrip: async (tripData) => {
    const response = await apiClient.post('/trips/stop', tripData);
    return response.data;
  },

  // Get active trip
  getActiveTrip: async () => {
    const response = await apiClient.get('/trips/active');
    return response.data;
  },

  // Get user's trip statistics
  getStats: async () => {
    const response = await apiClient.get('/trips/stats');
    return response.data;
  },

  // Get user's trip history
  getHistory: async () => {
    const response = await apiClient.get('/trips/history');
    return response.data;
  },

  // Get single trip detail
  getTripDetail: async (tripId) => {
    const response = await apiClient.get(`/trips/${tripId}`);
    return response.data;
  },
};

export default tripService;