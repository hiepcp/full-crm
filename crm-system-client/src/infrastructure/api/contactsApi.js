import axiosInstance from "./axiosInstance";

const contactsApi = {
  getAll: (params) => axiosInstance.get("/contacts", { params }),
  getAllPaging: (page, pageSize, sortColumn, sortOrder, payload) => {
    const filters = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.request)
        ? payload.request
        : [];
    const body = { request: { filters } };
    return axiosInstance.post(
      "/contacts/query-domain",
      body,
      {
        params: { page, pageSize, sortColumn, sortOrder },
      }
    );
  },
  getById: (id) => axiosInstance.get(`/contacts/${id}`),
  create: (data) => axiosInstance.post("/contacts", data),
  update: (id, data) => axiosInstance.put(`/contacts/${id}`, data),
  delete: (id) => axiosInstance.delete(`/contacts/${id}`),
  getByCustomer: (customerId) => axiosInstance.get("/contacts", { params: { customerId } }),
  getPrimaryContacts: () => axiosInstance.get("/contacts", { params: { isPrimary: true } }),
  getDealsByContact: (contactId) => axiosInstance.get(`/contacts/${contactId}/deals`),
  getActivitiesByContact: (contactId) => axiosInstance.get(`/contacts/${contactId}/activities`),
  setAsPrimary: (id) => axiosInstance.put(`/contacts/${id}/set-primary`),
};

export default contactsApi;
