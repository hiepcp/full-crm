import menuAxiosInstance from "./menuAxiosInstance";

const authUsersApi = {
  create: (payload) => menuAxiosInstance.post("/users", payload),
};

export default authUsersApi;

