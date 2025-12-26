import axiosInstance from "./axiosInstance";

const usersApi = {
  getAll: (params) => axiosInstance.get("/users", { params }),
  getAllPaging: (page, pageSize, sortColumn, sortOrder, payload) =>
    axiosInstance.post(
      "/users/query-domain",
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
  getById: (id) => axiosInstance.get(`/users/${id}`),
  getByEmail: (email) => axiosInstance.get(`/users/email/${email}`),
  create: (data) => axiosInstance.post("/users", data),
  update: (id, data) => axiosInstance.put(`/users/${id}`, data),
  delete: (id) => axiosInstance.delete(`/users/${id}`),
  getByRole: (role) => axiosInstance.get("/users", { params: { role } }),
  getActive: () => axiosInstance.get("/users", { params: { isActive: true } }),
};

export default usersApi;
