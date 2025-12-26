import axiosInstance from "./axiosInstance";
import publicAxiosInstance from "./publicAxiosInstance";

const leadsApi = {
  getAll: (params) => axiosInstance.get("/leads", { params }),
  getAllPaging: (page, pageSize, sortColumn, sortOrder, payload) => {
    // Leads query-domain expects a body LeadQueryRequest with shape: { request: { filters: [...] } }
    const filters = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.request)
        ? payload.request
        : [];
    const body = { request: { filters } };
    return axiosInstance.post(
      "/leads/query-domain",
      body,
      {
        params: { page, pageSize, sortColumn, sortOrder },
      }
    );
  },
  getAllPagingByType: (page, pageSize, sortColumn, sortOrder, payload, type) => {
    // Leads query-domain expects a body LeadQueryRequest with shape: { request: { filters: [...] } }
    const filters = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.request)
        ? payload.request
        : [];
    const body = { request: { filters } };
    return axiosInstance.post(
      "/leads/query-domain",
      body,
      {
        params: { page, pageSize, sortColumn, sortOrder, type },
      }
    );
  },
  getById: (id) => axiosInstance.get(`/leads/${id}`),
  create: (data) => axiosInstance.post("/leads", data),
  createPublic: (data) => publicAxiosInstance.post("/leads/public", data),
  createWithActivity: (data) => axiosInstance.post("/leads/with-activity", data),
  update: (id, data) => axiosInstance.put(`/leads/${id}`, data),
  delete: (id) => axiosInstance.delete(`/leads/${id}`),
  activateDraft: (id) => axiosInstance.post(`/leads/${id}/activate`),
  deleteDraft: (id) => axiosInstance.delete(`/leads/${id}/draft`),
  convertToDeal: (leadId, conversionData) => axiosInstance.post(`/leads/${leadId}/convert-to-deal`, conversionData),
};

export default leadsApi;
