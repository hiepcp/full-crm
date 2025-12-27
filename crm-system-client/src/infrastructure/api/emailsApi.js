import axiosInstance from "./axiosInstance";

const emailsApi = {
  getAll: (params) => axiosInstance.get("/emails", { params }),
  getAllPaging: (page, pageSize, sortColumn, sortOrder, payload) =>
    axiosInstance.post(
      "/emails/query-domain",
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
  getById: (id) => axiosInstance.get(`/emails/${id}`),
  create: (data) => axiosInstance.post("/emails", data),
  update: (id, data) => axiosInstance.put(`/emails/${id}`, data),
  delete: (id) => axiosInstance.delete(`/emails/${id}`),
  getByImportance: (importance) => axiosInstance.get("/emails", { params: { importance } }),
  getUnread: () => axiosInstance.get("/emails", { params: { isRead: false } }),
  getFlagged: () => axiosInstance.get("/emails", { params: { flagStatus: 'flagged' } }),
  getWithAttachments: () => axiosInstance.get("/emails", { params: { hasAttachments: true } }),
  getPendingSync: () => axiosInstance.get("/emails", { params: { syncedToActivity: false } }),
  getSynced: () => axiosInstance.get("/emails", { params: { syncedToActivity: true } }),
  getByRelation: (relationType, relationId) =>
    axiosInstance.get("/emails", { params: { relationType, relationId } }),
  getByContact: (contactId) => axiosInstance.get("/emails", { params: { contactId } }),
  getBySender: (senderEmail) => axiosInstance.get("/emails", { params: { senderEmail } }),
  getByConversation: (conversationId) => axiosInstance.get("/emails", { params: { conversationId } }),
  getByActivity: (activityId) => axiosInstance.get("/emails", { params: { activityId } }),
};

export default emailsApi;
