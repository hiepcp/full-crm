import { TEAM_ROLES } from '../../../../utils/constants';

/**
 * Get role color for chips and badges
 * @param {string} role - Role value
 * @returns {string} MUI color
 */
export const getRoleColor = (role) => {
  switch (role) {
    case 'TeamLead':
      return 'error';
    case 'Member':
      return 'primary';
    case 'Observer':
      return 'warning';
    default:
      return 'default';
  }
};

/**
 * Get role details from role value
 * @param {string} roleValue - Role value
 * @returns {Object} Role object with label and value
 */
export const getRoleDetails = (roleValue) => {
  const role = TEAM_ROLES.find((r) => r.value === roleValue);
  return role || { label: roleValue, value: roleValue };
};

/**
 * Get role description based on role value
 * @param {string} roleValue - Role value
 * @returns {string} Role description
 */
export const getRoleDescription = (roleValue) => {
  switch (roleValue) {
    case 'TeamLead':
      return 'Full access to manage team members, assign tasks, and view all team data.';
    case 'Member':
      return 'Can view team data and contribute to team activities.';
    case 'Observer':
      return 'Read-only access to view team data without making changes.';
    default:
      return '';
  }
};
