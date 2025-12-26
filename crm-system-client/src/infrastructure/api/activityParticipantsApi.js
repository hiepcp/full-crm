import axiosInstance from "./axiosInstance";

const activityParticipantsApi = {
  getAll: (params) => axiosInstance.get("/activity-participants", { params }),
  getByActivityId: (activityId) => axiosInstance.get("/activity-participants", { params: { activityId } }),
  getByContactId: (contactId) => axiosInstance.get("/activity-participants", { params: { contactId } }),
  getByUserId: (userId) => axiosInstance.get("/activity-participants", { params: { userId } }),
  getByRole: (role) => axiosInstance.get("/activity-participants", { params: { role } }),
  create: (data) => axiosInstance.post("/activity-participants", data),
  update: (id, data) => axiosInstance.put(`/activity-participants/${id}`, data),
  delete: (id) => axiosInstance.delete(`/activity-participants/${id}`),
};

export default activityParticipantsApi;
