import axiosInstance from "./axiosInstance";

const dynamics365SyncApi = {
  // Trigger manual sync
  triggerSync: () => axiosInstance.post("/dynamics365sync/trigger"),

  // Get sync status
  getStatus: () => axiosInstance.get("/dynamics365sync/status"),

  // Get audit log with pagination
  getAuditLog: (page, pageSize) =>
    axiosInstance.get("/dynamics365sync/audit", {
      params: { page, pageSize },
    }),

  // Get all category mappings
  getMappings: () => axiosInstance.get("/dynamics365sync/mappings"),

  // Create or update category mapping
  saveMapping: (data) =>
    axiosInstance.post("/dynamics365sync/mappings", data),

  // Delete category mapping
  deleteMapping: (id) =>
    axiosInstance.delete(`/dynamics365sync/mappings/${id}`),

  // Validate configuration
  validateConfiguration: () =>
    axiosInstance.get("/dynamics365sync/validate"),
};

export default dynamics365SyncApi;
