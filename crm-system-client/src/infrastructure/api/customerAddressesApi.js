import axiosInstance from "./axiosInstance";

const customerAddressesApi = {
  getAll: (params) => axiosInstance.get("/customer-addresses", { params }),
  
  getById: (id) => axiosInstance.get(`/customer-addresses/${id}`),
  
  getByCustomerId: (customerId) => 
    axiosInstance.get(`/customer-addresses/customer/${customerId}`),
  
  create: (data) => axiosInstance.post("/customer-addresses", data),
  
  update: (id, data) => axiosInstance.put(`/customer-addresses/${id}`, data),
  
  delete: (id) => axiosInstance.delete(`/customer-addresses/${id}`),
  
  setAsPrimary: (id) => 
    axiosInstance.put(`/customer-addresses/${id}/set-primary`),
};

export default customerAddressesApi;
