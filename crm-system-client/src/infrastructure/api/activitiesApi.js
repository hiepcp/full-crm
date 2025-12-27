import axiosInstance from "./axiosInstance";

const activitiesApi = {
  getAll: (params) => axiosInstance.get("/activities", { params }),
  getAllPaging: (page, pageSize, sortColumn, sortOrder, payload) =>{
      const filters = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.request)
          ? payload.request
          : [];
      const body = { request: { filters } };
      return axiosInstance.post(
        "/activities/query-domain",
        body,
        {
          params: { page, pageSize, sortColumn, sortOrder },
        }
      );
    },
  getById: (id) => axiosInstance.get(`/activities/${id}`),
  create: (data) => axiosInstance.post("/activities", data),
  createWithParticipantsAndAttachments: (activityData, participants, emailRecipients, files) => {
    const formData = new FormData();

    // Add activity data as JSON string
    formData.append('Activity', JSON.stringify(activityData));

    // Add participants array as JSON string (if provided)
    if (participants && participants.length > 0) {
      formData.append('Participants', JSON.stringify(participants));
    }

    // Add email recipients array as JSON string (if provided)
    if (emailRecipients && emailRecipients.length > 0) {
      formData.append('EmailRecipients', JSON.stringify(emailRecipients));
    }

    // Add files (if provided)
    if (files && files.length > 0) {
      files.forEach((file, index) => {
        formData.append('files', file);
      });
    }

    return axiosInstance.post("/activities/with-participants-and-attachments", formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  update: (id, data) => axiosInstance.put(`/activities/${id}`, data),
  delete: (id) => axiosInstance.delete(`/activities/${id}`),
  getByRelation: (relationType, relationId) =>
    axiosInstance.get("/activities", { params: { relationType, relationId } }),
  getByStatus: (status) => axiosInstance.get("/activities", { params: { status } }),
  getByType: (type) => axiosInstance.get("/activities", { params: { type } }),
  getByUser: (createdBy, params = {}) =>
    axiosInstance.get("/activities", { params: { createdBy, ...params } }),
};

export default activitiesApi;
