/**
 * File utility functions for file preview and manipulation
 * Used by FilePreviewer components for type detection, size formatting, and validation
 */

/**
 * File category enumeration
 * @enum {string}
 */
export const FileCategory = {
  IMAGE: 'IMAGE',
  PDF: 'PDF',
  TEXT: 'TEXT',
  UNSUPPORTED: 'UNSUPPORTED'
};

/**
 * File size limit for preview (50MB in bytes)
 * Files larger than this will show download-only option
 */
const PREVIEW_SIZE_LIMIT = 50 * 1024 * 1024; // 50MB

/**
 * Supported file extensions by category
 */
const FILE_EXTENSIONS = {
  IMAGE: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp'],
  PDF: ['pdf'],
  TEXT: ['txt', 'csv', 'log', 'md', 'json', 'xml', 'html', 'css', 'js', 'jsx', 'ts', 'tsx']
};

/**
 * MIME type mappings for file category detection
 */
const MIME_TYPE_MAPPINGS = {
  IMAGE: [
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/gif',
    'image/svg+xml',
    'image/webp',
    'image/bmp'
  ],
  PDF: ['application/pdf'],
  TEXT: [
    'text/plain',
    'text/csv',
    'application/json',
    'application/xml',
    'text/xml',
    'text/html',
    'text/css',
    'text/javascript',
    'application/javascript'
  ]
};

/**
 * T004: Extract file extension from filename
 * @param {string} filename - File name with extension
 * @returns {string} File extension in lowercase without dot (e.g., "pdf", "png")
 */
export function getFileExtension(filename) {
  if (!filename || typeof filename !== 'string') {
    return '';
  }

  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1 || lastDotIndex === filename.length - 1) {
    return '';
  }

  return filename.slice(lastDotIndex + 1).toLowerCase();
}

/**
 * T001: Detect file category based on MIME type and file extension
 * Uses MIME type first, falls back to extension if MIME is unavailable
 * @param {Object} file - File object with name and optional mimeType/contentType
 * @param {string} file.name - File name
 * @param {string} [file.mimeType] - MIME type of the file
 * @param {string} [file.contentType] - Alternative MIME type property
 * @returns {FileCategory} Detected file category
 */
export function getFileCategory(file) {
  if (!file || !file.name) {
    return FileCategory.UNSUPPORTED;
  }

  const mimeType = file.mimeType || file.contentType || '';
  const extension = getFileExtension(file.name);

  // Try MIME type detection first
  if (mimeType) {
    const mimeTypeLower = mimeType.toLowerCase();

    // Check IMAGE MIME types
    if (MIME_TYPE_MAPPINGS.IMAGE.some(type => mimeTypeLower.includes(type))) {
      return FileCategory.IMAGE;
    }

    // Check PDF MIME types
    if (MIME_TYPE_MAPPINGS.PDF.some(type => mimeTypeLower.includes(type))) {
      return FileCategory.PDF;
    }

    // Check TEXT MIME types
    if (MIME_TYPE_MAPPINGS.TEXT.some(type => mimeTypeLower.includes(type))) {
      return FileCategory.TEXT;
    }
  }

  // Fallback to extension detection
  if (extension) {
    if (FILE_EXTENSIONS.IMAGE.includes(extension)) {
      return FileCategory.IMAGE;
    }

    if (FILE_EXTENSIONS.PDF.includes(extension)) {
      return FileCategory.PDF;
    }

    if (FILE_EXTENSIONS.TEXT.includes(extension)) {
      return FileCategory.TEXT;
    }
  }

  return FileCategory.UNSUPPORTED;
}

/**
 * Check if a file is previewable (not UNSUPPORTED category)
 * @param {Object} file - File object
 * @returns {boolean} True if file can be previewed
 */
export function isPreviewable(file) {
  const category = getFileCategory(file);
  return category !== FileCategory.UNSUPPORTED;
}

/**
 * T002: Format file size from bytes to human-readable string
 * @param {number} bytes - File size in bytes
 * @param {number} [decimals=2] - Number of decimal places
 * @returns {string} Formatted file size (e.g., "1.5 MB", "340 KB", "45 bytes")
 */
export function formatFileSize(bytes, decimals = 2) {
  if (bytes === undefined || bytes === null || isNaN(bytes)) {
    return '0 bytes';
  }

  if (bytes === 0) {
    return '0 bytes';
  }

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = parseFloat((bytes / Math.pow(k, i)).toFixed(dm));

  return `${size} ${sizes[i]}`;
}

/**
 * T003: Check if file should skip preview due to size limit
 * Files larger than 50MB should show download option instead of preview
 * @param {Object} file - File object with size property
 * @param {number} file.size - File size in bytes
 * @returns {boolean} True if file is too large to preview
 */
export function shouldSkipPreview(file) {
  if (!file || typeof file.size !== 'number') {
    return false; // If no size info, allow preview attempt
  }

  return file.size > PREVIEW_SIZE_LIMIT;
}

/**
 * Get the preview size limit in bytes
 * @returns {number} Size limit in bytes (50MB)
 */
export function getPreviewSizeLimit() {
  return PREVIEW_SIZE_LIMIT;
}

/**
 * Check if file category is IMAGE
 * @param {Object} file - File object
 * @returns {boolean} True if file is an image
 */
export function isImageFile(file) {
  return getFileCategory(file) === FileCategory.IMAGE;
}

/**
 * Check if file category is PDF
 * @param {Object} file - File object
 * @returns {boolean} True if file is a PDF
 */
export function isPDFFile(file) {
  return getFileCategory(file) === FileCategory.PDF;
}

/**
 * Check if file category is TEXT
 * @param {Object} file - File object
 * @returns {boolean} True if file is a text file
 */
export function isTextFile(file) {
  return getFileCategory(file) === FileCategory.TEXT;
}

/**
 * Get file type icon name for Material-UI icons
 * @param {Object} file - File object
 * @returns {string} Icon name for MUI icons
 */
export function getFileIcon(file) {
  const category = getFileCategory(file);

  switch (category) {
    case FileCategory.IMAGE:
      return 'Image';
    case FileCategory.PDF:
      return 'PictureAsPdf';
    case FileCategory.TEXT:
      return 'Description';
    default:
      return 'InsertDriveFile';
  }
}
