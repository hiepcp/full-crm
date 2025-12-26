import axiosInstance from "./axiosInstance";

/**
 * Lead Score API - Simplified single-table design
 * All endpoints for lead score rule management
 */
const leadScoreApi = {
  // Rule CRUD endpoints
  getAllRules: () => axiosInstance.get("/lead-score/rules"),
  getActiveRules: () => axiosInstance.get("/lead-score/rules/active"),
  getRuleById: (id) => axiosInstance.get(`/lead-score/rules/${id}`),
  createRule: (data) => axiosInstance.post("/lead-score/rules", data),
  updateRule: (id, data) => axiosInstance.put(`/lead-score/rules/${id}`, data),
  deleteRule: (id) => axiosInstance.delete(`/lead-score/rules/${id}`),
};

export default leadScoreApi;
