import axiosInstance from './axiosInstance';

/**
 * Notifications API
 * Backend: /api/notifications
 */

/**
 * Get notifications with pagination
 * @param {number} skip - Number of records to skip
 * @param {number} take - Number of records to take
 * @param {boolean} unreadOnly - Filter only unread notifications
 * @returns {Promise} List of notifications
 */
export const getNotifications = async (skip = 0, take = 20, unreadOnly = false) => {
  const response = await axiosInstance.get('/notifications', {
    params: { skip, take, unreadOnly }
  });
  return response.data;
};

/**
 * Get unread notification count
 * @returns {Promise<number>} Count of unread notifications
 */
export const getUnreadCount = async () => {
  const response = await axiosInstance.get('/notifications/unread-count');
  return response.data;
};

/**
 * Mark a notification as read
 * @param {number} notificationId - Notification ID
 * @returns {Promise} Update result
 */
export const markAsRead = async (notificationId) => {
  const response = await axiosInstance.put(`/notifications/${notificationId}/mark-read`);
  return response.data;
};

/**
 * Mark all notifications as read
 * @returns {Promise} Update result
 */
export const markAllAsRead = async () => {
  const response = await axiosInstance.put('/notifications/mark-all-read');
  return response.data;
};

/**
 * Delete a notification
 * @param {number} notificationId - Notification ID
 * @returns {Promise} Delete result
 */
export const deleteNotification = async (notificationId) => {
  const response = await axiosInstance.delete(`/notifications/${notificationId}`);
  return response.data;
};

/**
 * Get notification preferences for current user
 * @returns {Promise} User notification preferences
 */
export const getNotificationPreferences = async () => {
  const response = await axiosInstance.get('/notifications/preferences');
  return response.data;
};

/**
 * Update notification preferences
 * @param {Object} preferences - Preference settings
 * @returns {Promise} Update result
 */
export const updateNotificationPreferences = async (preferences) => {
  const response = await axiosInstance.put('/notifications/preferences', preferences);
  return response.data;
};

/**
 * Create a test notification (for development/testing)
 * @param {string} message - Test message
 * @returns {Promise} Created notification
 */
export const createTestNotification = async (message = 'Test notification') => {
  const response = await axiosInstance.post('/notifications/test', { message });
  return response.data;
};
