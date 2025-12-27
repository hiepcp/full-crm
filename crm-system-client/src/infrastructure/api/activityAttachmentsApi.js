import axiosInstance from "./axiosInstance";

const activityAttachmentsApi = {
  getAll: (params) => axiosInstance.get("/activity-attachments", { params }),
  getByActivity: (activityId) => axiosInstance.get("/activity-attachments", { params: { activityId } }),
  create: (data) => axiosInstance.post("/activity-attachments", data),
  update: (id, data) => axiosInstance.put(`/activity-attachments/${id}`, data),
  delete: (id) => axiosInstance.delete(`/activity-attachments/${id}`),
};

export default activityAttachmentsApi;
