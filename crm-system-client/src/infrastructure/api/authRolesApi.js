import menuAxiosInstance from "./menuAxiosInstance";

const authRolesApi = {
  getAll: (page = 1, pageSize = 100, filters = []) =>
    menuAxiosInstance.post(
      "/role/get-all",
      filters,
      {
        params: {
          page,
          pageSize,
        },
      }
    ),
};

export default authRolesApi;

