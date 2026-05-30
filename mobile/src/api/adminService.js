import apiClient from './client';

// Admin service functions
export const adminService = {
  // Get all employees
  getEmployees: async () => {
    const response = await apiClient.get('/admin/employees');
    return response.data;
  },

  // Get trips for a specific employee
  getEmployeeTrips: async (employeeId) => {
    const response = await apiClient.get(`/admin/trips/${employeeId}`);
    return response.data;
  },

  getStats: async () => {
    const response = await apiClient.get('/admin/stats');
    return response.data;
  },
};

export default adminService;
