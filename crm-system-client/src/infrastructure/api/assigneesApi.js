import axiosInstance from "./axiosInstance";

const assigneesApi = {
  getAll: (params) => axiosInstance.get("/assignees", { params }),
  getByRelation: (relationType, relationId) =>
    axiosInstance.get("/assignees", { params: { relationType, relationId } }),
  create: (data) => axiosInstance.post("/assignees", data),
  update: (id, data) => axiosInstance.put(`/assignees/${id}`, data),
  delete: (id) => axiosInstance.delete(`/assignees/${id}`),
};

export default assigneesApi;
