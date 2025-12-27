import axiosInstance from "./axiosInstance";

const allCRMApi = {
  get365Paging: (refType, page, pageSize, sortColumn, sortOrder, payload) =>
    axiosInstance.post(
      "/all-crms/get-dynamics",
      payload,
      {
        params: {
          refType,
          page,
          pageSize,
          sortColumn,
          sortOrder,
        },
      }
    ),
  getByModalName: (modalName, page, pageSize, sortColumn, sortOrder, payload) =>
    axiosInstance.post(
      "/all-crms/get-by-modal",
      payload,
      {
        params: {
          modalName,
          page,
          pageSize,
          sortColumn,
          sortOrder,
        },
      }
    ),
   getAllCRMs: (payload) =>
    axiosInstance.post(
      "/all-crms/get-all",
      payload
    ),
};

export default allCRMApi;