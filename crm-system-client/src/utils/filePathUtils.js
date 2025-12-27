/**
 * Regex pattern to detect SharePoint paths
 * Matches paths starting with environment prefix + /CRM/
 */
const SHAREPOINT_PATH_REGEX = /^(DEV|PROD|UAT|SANDBOX)\/CRM\//i;

/**
 * Check if a file path is a SharePoint relative path
 * @param {string} path - File path to check
 * @returns {boolean} True if path is SharePoint relative path
 */
export function isSharePointPath(path) {
  return path && typeof path === 'string' && SHAREPOINT_PATH_REGEX.test(path);
}

/**
 * Resolve file URL from attachment object
 * Requires idRef field for SharePoint files
 * @param {object} attachment - Attachment object with idRef field
 * @param {object} filesApi - Files API client
 * @returns {Promise<string>} Resolved file URL
 * @throws {Error} If no valid URL available
 */
export async function resolveFileUrl(attachment, filesApi) {
  console.log('[resolveFileUrl] Input attachment:', attachment);
  console.log('[resolveFileUrl] attachment.idRef:', attachment.idRef);
  console.log('[resolveFileUrl] attachment.idRef type:', typeof attachment.idRef);
  console.log('[resolveFileUrl] attachment.idRef truthy?:', !!attachment.idRef);
  console.log('[resolveFileUrl] attachment.url:', attachment.url);

  // Priority 1: IdRef for SharePoint files
  if (attachment.idRef) {
    console.log('[resolveFileUrl] ✅ Entering IdRef block - Using IdRef to fetch from SharePoint');
    try {
      const response = await filesApi.getFileUrl(attachment.idRef);
      console.log('[resolveFileUrl] API response:', response);
      const url = response.data.data.url;
      console.log('[resolveFileUrl] Resolved URL from API:', url);
      return url; // Extract URL from ApiResponse wrapper
    } catch (error) {
      console.error('[resolveFileUrl] Failed to fetch SharePoint file URL:', error);
      console.error('[resolveFileUrl] Error response:', error.response);
      throw new Error(
        error.response?.status === 404
          ? 'File not found in SharePoint'
          : `Failed to load file from SharePoint: ${error.message}`
      );
    }
  }

  // Check if URL is a SharePoint path (not a full URL)
  if (attachment.url && isSharePointPath(attachment.url)) {
    console.error('[resolveFileUrl] URL is a SharePoint path but idRef is missing!', attachment.url);
    throw new Error('File requires IdRef to load from SharePoint, but IdRef is missing');
  }

  // Priority 2: Direct HTTP/HTTPS URL (for non-SharePoint files)
  if (attachment.url && /^https?:\/\//i.test(attachment.url)) {
    console.log('[resolveFileUrl] Using direct URL:', attachment.url);
    return attachment.url;
  }

  // Priority 3: Legacy fileUrl field (for backward compatibility)
  if (attachment.fileUrl && /^https?:\/\//i.test(attachment.fileUrl)) {
    console.log('[resolveFileUrl] Using fileUrl:', attachment.fileUrl);
    return attachment.fileUrl;
  }

  // Priority 4: webUrl field
  if (attachment.webUrl && /^https?:\/\//i.test(attachment.webUrl)) {
    console.log('[resolveFileUrl] Using webUrl:', attachment.webUrl);
    return attachment.webUrl;
  }

  // Priority 5: downloadUrl field
  if (attachment.downloadUrl && /^https?:\/\//i.test(attachment.downloadUrl)) {
    console.log('[resolveFileUrl] Using downloadUrl:', attachment.downloadUrl);
    return attachment.downloadUrl;
  }

  // No valid URL available
  console.error('[resolveFileUrl] No valid URL found. Attachment:', attachment);
  throw new Error('No valid file URL available. Check console for details.');
}
