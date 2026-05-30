import apiClient from './client';

export const analyticsService = {
  getMyAnalytics: async () => {
    const response = await apiClient.get('/analytics/my');
    return response.data;
  },
  getAdminAnalytics: async () => {
    const response = await apiClient.get('/analytics/admin');
    return response.data;
  },
};

export default analyticsService;