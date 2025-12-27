import axiosInstance from "./axiosInstance";

const sharepointApi = {
  // Document upload
  upload: (formData) => axiosInstance.post("/sharepoint/upload", formData),

  // Entity document management
  getDocumentsByEntity: (entityType, entityId) =>
    axiosInstance.get(`/sharepoint/documents/${entityType}/${entityId}`),

  // Unified search
  searchDocuments: (query, entityType = null, entityId = null) => {
    const params = { q: query };
    if (entityType) params.entityType = entityType;
    if (entityId) params.entityId = entityId;
    return axiosInstance.get("/sharepoint/search", { params });
  },

  // Permission management
  syncPermissions: (entityType, entityId, userRoles) =>
    axiosInstance.post("/sharepoint/permissions/sync", {
      entityType,
      entityId,
      userRoles,
    }),

  getPermissions: (entityType, entityId) =>
    axiosInstance.get(`/sharepoint/permissions/${entityType}/${entityId}`),

  revokePermission: (entityType, entityId, principalId) =>
    axiosInstance.delete(`/sharepoint/permissions/${entityType}/${entityId}/${principalId}`),

  // Version history
  getVersionHistory: (fileId) =>
    axiosInstance.get(`/sharepoint/files/${fileId}/versions`),

  // Bulk migration
  bulkMigrate: (migrationRequest) =>
    axiosInstance.post("/sharepoint/migration/bulk", migrationRequest),
};

export default sharepointApi;

