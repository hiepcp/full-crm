import axiosInstance from "./axiosInstance";

const pipelineLogsApi = {
  getAll: (params) => axiosInstance.get("/pipeline-logs", { params }),
  getById: (id) => axiosInstance.get(`/pipeline-logs/${id}`),
  create: (data) => axiosInstance.post("/pipeline-logs", data),
  update: (id, data) => axiosInstance.put(`/pipeline-logs/${id}`, data),
  delete: (id) => axiosInstance.delete(`/pipeline-logs/${id}`),
  getByDeal: (dealId) => axiosInstance.get("/pipeline-logs", { params: { dealId } }),
  getByStage: (stage) => axiosInstance.get("/pipeline-logs", { params: { stage } }),
};

export default pipelineLogsApi;
