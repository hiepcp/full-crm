/**
 * Safely get user name from member object
 * @param {Object} member - Member or team member object
 * @returns {string} User name
 */
export const getUserName = (member) => {
  return member?.user?.displayName || member?.userName || member?.userEmail || 'Unknown User';
};

/**
 * Safely get user email from member object
 * @param {Object} member - Member or team member object
 * @returns {string} User email
 */
export const getUserEmail = (member) => {
  return member?.user?.email || member?.userEmail || 'N/A';
};

/**
 * Get user initials for avatar
 * @param {string} name - User name
 * @returns {string} Initials (1-2 characters)
 */
export const getUserInitials = (name) => {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
  }
  return name.charAt(0).toUpperCase();
};
