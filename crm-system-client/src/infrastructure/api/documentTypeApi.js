import axiosInstance from "./axiosInstance";

const documentTypeApi = {
  getAll: () => axiosInstance.get("/document-types"),
  getAllPaging: (page, pageSize, sortColumn, sortOrder, payload) =>
    axiosInstance.post(
      "/document-types/get-all",
      payload, // body
      {
        params: {
          page,
          pageSize,
          sortColumn,
          sortOrder,
        },
      }
    ),
  getById: (id) => axiosInstance.get(`/document-types/${id}`),
  create: (data) => axiosInstance.post("/document-types", data),
  update: (id, data) => axiosInstance.put(`/document-types/${id}`, data),
  delete: (id) => axiosInstance.delete(`/document-types/${id}`),
  deleteMulti: (ids) => axiosInstance.post("/document-types/delete-multi", ids),
};

export default documentTypeApi;
