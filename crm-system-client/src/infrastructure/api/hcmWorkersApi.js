import axiosInstance from "./axiosInstance";

const hcmWorkersApi = {
  /**
   * Query HCM workers from Dynamics with Email already enforced server-side.
   */
  getPaged: (
    page = 1,
    pageSize = 10,
    search = "",
    sortField = "",
    sortOrder = "asc"
  ) => {
    const skip = (page - 1) * pageSize;
    const filters = [];

    if (search) {
      const escaped = search.replace(/'/g, "''");
      filters.push(
        `(contains(Email,'${escaped}') or contains(Name,'${escaped}') or contains(PersonnelNumber,'${escaped}'))`
      );
    }

    const params = {
      skip,
      top: pageSize,
      orderBy: sortField ? `${sortField} ${sortOrder}` : undefined,
      filter: filters.join(" and "),
    };

    return axiosInstance.get("/dynamics/hcm-workers", { params });
  },
};

export default hcmWorkersApi;



