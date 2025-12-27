import { getLeads } from "@src/data";
import axiosInstance from "./axiosInstance";

const customersApi = {
  getAll: (params) => axiosInstance.get("/customers", { params }),
  getAllPaging: (page, pageSize, sortColumn, sortOrder, payload) => {
    const filters = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.request)
        ? payload.request
        : [];
    const body = { request: { filters } };
    return axiosInstance.post(
      "/customers/query-domain",
      body,
      {
        params: { page, pageSize, sortColumn, sortOrder },
      }
    );
  },
  getDealsByCustomer: (customerId) => axiosInstance.get(`/customers/${customerId}/deals`),
  getLeadsByCustomer: (customerId) => axiosInstance.get(`/customers/${customerId}/leads`),
  getContactsByCustomer: (customerId) => axiosInstance.get(`/customers/${customerId}/contacts`),
  getActivitiesByCustomer: (customerId) => axiosInstance.get(`/customers/${customerId}/activities`),
  getById: (id) => axiosInstance.get(`/customers/${id}`),
  create: (data) => axiosInstance.post("/customers", data),
  update: (id, data) => axiosInstance.put(`/customers/${id}`, data),
  delete: (id) => axiosInstance.delete(`/customers/${id}`),
  getByType: (type) => axiosInstance.get("/customers", { params: { type } }),
};

export default customersApi;
