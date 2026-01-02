/**
 * Format date to localized string
 * @param {string|Date} dateString - Date to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString, options = {}) => {
  if (!dateString) return 'N/A';

  const defaultOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  };

  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', { ...defaultOptions, ...options });
};

/**
 * Format date with time
 * @param {string|Date} dateString - Date to format
 * @returns {string} Formatted date and time string
 */
export const formatDateTime = (dateString) => {
  return formatDate(dateString, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Format date to short format (DD MMM YYYY)
 * @param {string|Date} dateString - Date to format
 * @returns {string} Formatted date string
 */
export const formatDateShort = (dateString) => {
  return formatDate(dateString, {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};
