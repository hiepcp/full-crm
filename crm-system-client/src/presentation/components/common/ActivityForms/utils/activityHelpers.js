import { ACTIVITY_SOURCE_TYPES } from '../../../../../utils/constants';

export const mapCategoryToActivityType = (category) => {
  switch (category) {
    case 'meeting-online':
    case 'meeting-offline':
      return 'meeting';
    case 'email':
      return 'email';
    case 'call':
      return 'call';
    case 'task':
      return 'task';
    case 'note':
      return 'note';
    case 'contract':
      return 'contract';
    default:
      return 'note';
  }
};

/**
 * Construct activity data from form data
 */
export const constructActivityData = (formData, description, uploadedFiles, relationType, relationId) => {
  const activityData = {
    // Basic activity fields
    subject: formData.subject || `${formData.activityCategory.charAt(0).toUpperCase() + formData.activityCategory.slice(1)} Activity`,
    body: description,
    status: formData.status,
    priority: formData.priority,
    assignedTo: formData.assignedTo,
    sourceFrom: formData.activityCategory === 'task' ? ACTIVITY_SOURCE_TYPES.SYSTEM_TASK :
      (formData.activityCategory === 'meeting-online' || formData.activityCategory === 'meeting-offline') ? ACTIVITY_SOURCE_TYPES.CALENDAR_MEETING :
        formData.activityCategory === 'email' ? ACTIVITY_SOURCE_TYPES.GMAIL_EMAIL :
        formData.activityCategory === 'contract' ? ACTIVITY_SOURCE_TYPES.INSTANT_DOC : ACTIVITY_SOURCE_TYPES.SYSTEM_NOTE,

    // Relation fields for deal context
    relationType: relationType,
    relationId: relationId,

    // Conversation/thread id if available (email or appointments)
    conversationId: formData.conversationId || null,

    // Due date if provided
    dueAt: formData.dueDate && formData.dueTime ? `${formData.dueDate}T${formData.dueTime}:00Z` : null,

    // Activity Type
    activityType: mapCategoryToActivityType(formData.activityCategory),

    completedAt: formData.status === 'completed' ? new Date().toISOString() : null,
    createdBy: 'sales@crm.com',
  };

  // Add category-specific data
  if (formData.activityCategory === 'meeting-online' || formData.activityCategory === 'meeting-offline') {
    if (formData.appointmentDate && formData.appointmentTime) {
      activityData.startAt = `${formData.appointmentDate}T${formData.appointmentTime}:00Z`;
    }
    if (formData.appointmentEndDate && formData.appointmentEndTime) {
      activityData.endAt = `${formData.appointmentEndDate}T${formData.appointmentEndTime}:00Z`;
    }

    activityData.appointmentDate = formData.appointmentDate;
    activityData.appointmentTime = formData.appointmentTime;
    activityData.appointmentEndDate = formData.appointmentEndDate;
    activityData.appointmentEndTime = formData.appointmentEndTime;
    activityData.appointmentDuration = formData.appointmentDuration;
    activityData.appointmentLocation = formData.appointmentLocation;
    if (formData.activityCategory === 'meeting-online') {
      activityData.appointmentPlatform = formData.appointmentPlatform;
    }
  } else if (formData.activityCategory === 'email') {
    activityData.emailSubject = formData.subject;
  } else if (formData.activityCategory === 'contract') {
    if (formData.contractDate) {
      activityData.contractDate = formData.contractDate;
    }
    if (formData.contractValue) {
      activityData.contractValue = parseFloat(formData.contractValue);
    }
  }

  // Add files if any
  if (uploadedFiles.length > 0) {
    activityData.hasAttachment = true;
    activityData.attachmentCount = uploadedFiles.length;
  }

  return activityData;
};

