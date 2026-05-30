import apiClient from './client';

export const expenseService = {
  addExpense: async (data) => {
    const response = await apiClient.post('/expenses/add', data);
    return response.data;
  },
  getMyExpenses: async () => {
    const response = await apiClient.get('/expenses/my');
    return response.data;
  },
  getMyStats: async () => {
    const response = await apiClient.get('/expenses/my/stats');
    return response.data;
  },
  getAllExpenses: async (status) => {
    const url = status ? `/expenses/all?status=${status}` : '/expenses/all';
    const response = await apiClient.get(url);
    return response.data;
  },
  getAdminStats: async () => {
    const response = await apiClient.get('/expenses/admin/stats');
    return response.data;
  },
  approveExpense: async (id) => {
    const response = await apiClient.put(`/expenses/${id}/approve`);
    return response.data;
  },
  rejectExpense: async (id, reason) => {
    const response = await apiClient.put(`/expenses/${id}/reject`, { reason });
    return response.data;
  },
};

export default expenseService;