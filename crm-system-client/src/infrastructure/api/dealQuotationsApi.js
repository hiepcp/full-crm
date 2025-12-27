import axiosInstance from "./axiosInstance";

const dealQuotationsApi = {
  getAll: (params) => axiosInstance.get("/deal-quotations", { params }),
  getById: (id) => axiosInstance.get(`/deal-quotations/${id}`),
  create: (data) => axiosInstance.post("/deal-quotations", data),
  bulkCreate: (data) => axiosInstance.post("/deal-quotations/bulk", data),
  update: (id, data) => axiosInstance.put(`/deal-quotations/${id}`, data),
  delete: (id) => axiosInstance.delete(`/deal-quotations/${id}`),
  getByDeal: (dealId) => axiosInstance.get("/deal-quotations", { params: { dealId } }),
  getByQuotation: (quotationNumber) =>
    axiosInstance.get("/deal-quotations", { params: { quotationNumber } }),
  getQuotationsWithDynamicsByDeal: (dealId) =>
    axiosInstance.get(`/deal-quotations/deal/${dealId}/quotations-with-dynamics`),
};

export default dealQuotationsApi;
