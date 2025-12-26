import axiosInstance from './axiosInstance';

const EMAIL_TEMPLATE_API_BASE = 'email-templates';

export const emailTemplateApi = {
  // Get all available templates for current user (owned + shared)
  getAll: async () => {
    const response = await axiosInstance.get(EMAIL_TEMPLATE_API_BASE);
    return response.data?.data || response.data; // Handle ApiResponse wrapper
  },

  // Get user's own templates
  getMyTemplates: async () => {
    const response = await axiosInstance.get(`${EMAIL_TEMPLATE_API_BASE}/my-templates`);
    return response.data?.data || response.data;
  },

  // Get shared templates (not owned by current user)
  getSharedTemplates: async () => {
    const response = await axiosInstance.get(`${EMAIL_TEMPLATE_API_BASE}/shared`);
    return response.data?.data || response.data;
  },

  // Search templates by keyword
  search: async (keyword, category = null) => {
    const params = { keyword };
    if (category) params.category = category;
    const response = await axiosInstance.get(`${EMAIL_TEMPLATE_API_BASE}/search`, { params });
    return response.data?.data || response.data;
  },

  // Get templates by category
  getByCategory: async (category) => {
    const response = await axiosInstance.get(`${EMAIL_TEMPLATE_API_BASE}/category/${category}`);
    return response.data?.data || response.data;
  },

  // Get template by ID
  getById: async (id) => {
    const response = await axiosInstance.get(`${EMAIL_TEMPLATE_API_BASE}/${id}`);
    return response.data?.data || response.data;
  },

  // Create new template
  create: async (data) => {
    const response = await axiosInstance.post(EMAIL_TEMPLATE_API_BASE, data);
    return response.data?.data || response.data;
  },

  // Update template
  update: async (id, data) => {
    const response = await axiosInstance.put(`${EMAIL_TEMPLATE_API_BASE}/${id}`, data);
    return response.data?.data || response.data;
  },

  // Delete template
  delete: async (id) => {
    const response = await axiosInstance.delete(`${EMAIL_TEMPLATE_API_BASE}/${id}`);
    return response.data?.data || response.data;
  },

  // Get available variables
  getVariables: async () => {
    const response = await axiosInstance.get(`${EMAIL_TEMPLATE_API_BASE}/variables`);
    return response.data?.data || response.data;
  },

  // Render template with entity data (preview)
  render: async (templateId, entityType = null, entityId = null, variableValues = null) => {
    const requestData = {
      templateId,
      entityType,
      entityId,
      variableValues
    };
    const response = await axiosInstance.post(`${EMAIL_TEMPLATE_API_BASE}/render`, requestData);
    return response.data?.data || response.data;
  },

  // Use template (send email)
  use: async (templateId, recipientEmail, entityType = null, entityId = null, variableValues = null) => {
    const requestData = {
      templateId,
      recipientEmail,
      entityType,
      entityId,
      variableValues
    };
    const response = await axiosInstance.post(`${EMAIL_TEMPLATE_API_BASE}/use`, requestData);
    return response.data?.data || response.data;
  },
};

export default emailTemplateApi;
