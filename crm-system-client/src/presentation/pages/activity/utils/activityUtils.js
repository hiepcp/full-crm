import { ACTIVITY_SOURCE_TYPES } from '../../../../utils/constants';

// Status badge color mapping
export const getStatusColor = (status) => {
  const colors = {
    open: 'info',
    in_progress: 'warning',
    completed: 'success',
    overdue: 'error',
    cancelled: 'default'
  };
  return colors[status] || 'default';
};

// Priority badge color mapping
export const getPriorityColor = (priority) => {
  const colors = {
    low: 'default',
    normal: 'info',
    high: 'error'
  };
  return colors[priority] || 'default';
};

// Get activity type icon
export const getActivityTypeIcon = (sourceFrom) => {
  const typeMap = {
    [ACTIVITY_SOURCE_TYPES.GMAIL_EMAIL]: '📧',
    [ACTIVITY_SOURCE_TYPES.PHONE_CALL]: '📞',
    [ACTIVITY_SOURCE_TYPES.CALENDAR_MEETING]: '📅',
    [ACTIVITY_SOURCE_TYPES.SYSTEM_TASK]: '✅',
    [ACTIVITY_SOURCE_TYPES.SYSTEM_NOTE]: '📝'
  };
  return typeMap[sourceFrom] || '📄';
};

