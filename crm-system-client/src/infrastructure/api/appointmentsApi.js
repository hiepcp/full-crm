import axiosInstance from "./axiosInstance";

const appointmentsApi = {
  getAll: (params) => axiosInstance.get("/appointments", { params }),
  getById: (id) => axiosInstance.get(`/appointments/${id}`),
  getByMailId: (mailId) => axiosInstance.get(`/appointments/by-mail/${mailId}`),
  create: (data) => axiosInstance.post("/appointments", data),
  update: (id, data) => axiosInstance.put(`/appointments/${id}`, data),
  delete: (id) => axiosInstance.delete(`/appointments/${id}`),
};

export default appointmentsApi;

