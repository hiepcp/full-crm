import axiosInstance from "./axiosInstance";

const addressesApi = {
    getAll: (params) => axiosInstance.get("/addresses", { params }),
    getById: (id) => axiosInstance.get(`/addresses/${id}`),
    create: (data) => axiosInstance.post("/addresses", data),
    update: (id, data) => axiosInstance.put(`/addresses/${id}`, data),
    delete: (id) => axiosInstance.delete(`/addresses/${id}`),
    getByRelation: (relationType, relationId) =>
        axiosInstance.get("/addresses/by-relation", {
            params: { relationType, relationId }
        }),
};

export default addressesApi;
