/**
 * Map an appointment (calendar event) to CreateAppointmentRequest payload
 * so that appointments can be stored as first-class appointment records.
 */
export const mapAppointmentToCreateAppointmentRequest = (appointmentData, activityId = null) => {
  if (!appointmentData) return null;

  const appointment = appointmentData.appointment || appointmentData;
  const organizer = appointment.organizer?.emailAddress || appointment.organizer || {};
  const attendees = appointment.attendees || [];
  const attendeePayload = attendees.map((a) => ({
    email: a.emailAddress?.address || a.address || a?.email || null,
    name: a.emailAddress?.name || a.name || null,
    type: a.type || a.recipientType || null,
    status: a.status?.response || a.status || null,
  })).filter(a => a.email);

  const bodyContent = appointment.body?.content || appointmentData.description || '';
  const bodyContentType = appointment.body?.contentType?.toLowerCase?.() || 'html';
  const startDateIso = appointment.start?.dateTime
    ? new Date(appointment.start.dateTime).toISOString()
    : null;
  const endDateIso = appointment.end?.dateTime
    ? new Date(appointment.end.dateTime).toISOString()
    : null;

  const joinUrl =
    appointment.onlineMeeting?.joinUrl ||
    appointment.joinUrl ||
    appointment.onlineMeetingUrl ||
    appointmentData.joinUrl ||
    null;

  return {
    mailId: appointment.id || appointmentData.id || null,
    iCalUId: appointment.iCalUId || appointment.internetMessageId || null,
    conversationId: appointment.conversationId || appointmentData.conversationId || null,
    subject: appointment.subject || appointmentData.subject || 'Meeting',
    bodyPreview: bodyContent ? bodyContent.substring(0, 500) : null,
    bodyContent,
    bodyContentType,
    organizerName: organizer.name || null,
    organizerAddress: organizer.address || organizer.emailAddress?.address || null,
    attendees: attendeePayload.length ? JSON.stringify(attendeePayload) : null,
    startDateTime: startDateIso,
    endDateTime: endDateIso,
    startTimeZone: appointment.start?.timeZone || null,
    endTimeZone: appointment.end?.timeZone || null,
    durationMinutes: appointmentData.duration || appointment.duration || null,
    locationName: appointment.location?.displayName || appointmentData.location || null,
    locationAddress: appointment.location?.address?.text || appointment.location?.address?.street || null,
    isOnlineMeeting: Boolean(appointment.isOnlineMeeting || joinUrl),
    joinUrl,
    platform: appointment.onlineMeetingProvider || appointmentData.appointmentPlatform || null,
    showAs: appointment.showAs || null,
    importance: appointment.importance || 'normal',
    status: appointment.showAs || null,
    hasAttachments: appointment.hasAttachments || false,
    lastModifiedDateTime: appointment.lastModifiedDateTime || null,
    activityId,
  };
};

// Backward compatibility alias (legacy callers map into appointment payload)
export const mapAppointmentToCreateEmailRequest = (appointmentData, activityId = null) =>
  mapAppointmentToCreateAppointmentRequest(appointmentData, activityId);
