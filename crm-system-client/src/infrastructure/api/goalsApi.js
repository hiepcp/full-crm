import axiosInstance from './axiosInstance';

const goalsApi = {
  getAll: (params) => axiosInstance.get('/goals', { params }),
  getById: (id) => axiosInstance.get(`/goals/${id}`),
  create: (data) => axiosInstance.post('/goals', data),
  update: (id, data) => axiosInstance.put(`/goals/${id}`, data),
  delete: (id) => axiosInstance.delete(`/goals/${id}`),
  getMetrics: (params) => axiosInstance.get('/goals/metrics', { params }),

  // Auto-calculation endpoints (US1)
  manualAdjustProgress: (id, data) => axiosInstance.post(`/goals/${id}/manual-adjustment`, data),
  recalculateProgress: (id) => axiosInstance.post(`/goals/${id}/recalculate`),
  getForecast: (id) => axiosInstance.get(`/goals/${id}/forecast`),
  getProgressHistory: (id) => axiosInstance.get(`/goals/${id}/progress-history`),

  // Hierarchy endpoints (US4)
  getHierarchy: (id) => axiosInstance.get(`/goals/${id}/hierarchy`),
  linkToParent: (id, data) => axiosInstance.post(`/goals/${id}/link-parent`, data),
  unlinkParent: (id) => axiosInstance.post(`/goals/${id}/unlink-parent`),
  getChildren: (id) => axiosInstance.get(`/goals/${id}/children`),

  // Analytics endpoints (US5)
  getAnalytics: (params) => axiosInstance.get('/goals/analytics', { params }),

  // Convenience method - alias for getAll
  getGoals: (params) => axiosInstance.get('/goals', { params }),
};

export default goalsApi;
