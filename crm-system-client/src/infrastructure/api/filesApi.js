import axiosInstance from "./axiosInstance";

/**
 * API client for file operations
 */
const filesApi = {
  /**
   * Get signed URL for file by IdRef (SharePoint DriveItem ID)
   * @param {string} idRef - SharePoint file identifier (Graph DriveItem ID)
   * @returns {Promise} Response with signed URL and metadata
   */
  getFileUrl: (idRef) => {
    // Encode idRef to handle special characters
    const encodedIdRef = encodeURIComponent(idRef);
    return axiosInstance.get(`/files/${encodedIdRef}`);
  },
};

export default filesApi;
