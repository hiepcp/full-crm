import axiosInstance from "./axiosInstance";

const salesQuotationsApi = {
  getAllPaging: (page = 1, pageSize = 10, sortColumn = null, sortOrder = "asc", filters = []) =>
    axiosInstance.post(
      "/dynamics/sales-quotation-headers",
      filters,
      {
        params: {
          page,
          pageSize,
          sortColumn,
          sortOrder,
        },
      }
    ),
};

export default salesQuotationsApi;

