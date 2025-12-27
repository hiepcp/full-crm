import axiosInstance from "./axiosInstance";

const dealsApi = {
  getAll: (params) => axiosInstance.get("/deals", { params }),
  getAllPaging: (page, pageSize, sortColumn, sortOrder, payload) => {
    const filters = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.request)
        ? payload.request
        : [];
    const body = { request: { filters } };
    return axiosInstance.post(
      "/deals/query-domain",
      body,
      {
        params: { page, pageSize, sortColumn, sortOrder },
      }
    );
  },
  getById: (id) => axiosInstance.get(`/deals/${id}`),
  create: (data) => axiosInstance.post("/deals", data),
  update: (id, data) => axiosInstance.put(`/deals/${id}`, data),
  delete: (id) => axiosInstance.delete(`/deals/${id}`),
  getByStage: (stage) => axiosInstance.get("/deals", { params: { stage } }),
  getByCustomer: (customerId) => axiosInstance.get("/deals", { params: { customerId } }),
};

export default dealsApi;
