import axiosInstance from "./axiosInstance";

const sharepointApi = {
  upload: (formData) => axiosInstance.post("/sharepoint/upload", formData),
};

export default sharepointApi;

