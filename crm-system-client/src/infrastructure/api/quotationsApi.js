import axiosInstance from "./axiosInstance";

const quotationsApi = {
  getAll: (params) => axiosInstance.get("/quotations", { params }),
  getAllPaging: (page, pageSize, sortColumn, sortOrder, payload) =>
    axiosInstance.post(
      "/quotations/query-domain",
      payload,
      {
        params: {
          page,
          pageSize,
          sortColumn,
          sortOrder,
        },
      }
    ),
  getById: (id) => axiosInstance.get(`/quotations/${id}`),
  create: (data) => axiosInstance.post("/quotations", data),
  update: (id, data) => axiosInstance.put(`/quotations/${id}`, data),
  delete: (id) => axiosInstance.delete(`/quotations/${id}`),
  getByStatus: (status) => axiosInstance.get("/quotations", { params: { status } }),
  getByDeal: (dealId) => axiosInstance.get("/quotations", { params: { dealId } }),
};

export default quotationsApi;
