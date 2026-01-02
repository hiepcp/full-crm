/**
 * Helper function to map selectedEmail to format for API
 */
export const mapEmailToCreateEmailRequest = (selectedEmail, activityId = null) => {
  if (!selectedEmail) return null;

  const sender = selectedEmail.from?.emailAddress || selectedEmail.from || {};
  const recipients = selectedEmail.toRecipients || [];
  const ccRecipients = selectedEmail.ccRecipients || [];
  const bccRecipients = selectedEmail.bccRecipients || [];

  const emailId = selectedEmail.id;

  return {
    mailId: emailId,
    conversationId: selectedEmail.conversationId || null,
    subject: selectedEmail.subject || '',
    bodyPreview: selectedEmail.bodyPreview || (selectedEmail.body?.content ? selectedEmail.body.content.substring(0, 500) : ''),
    bodyContent: selectedEmail.body?.content || selectedEmail.bodyPreview || '',
    bodyContentType: selectedEmail.body?.contentType || 'html',
    importance: selectedEmail.importance || 'normal',
    hasAttachments: selectedEmail.hasAttachments || (selectedEmail.attachments?.length > 0) || false,
    isRead: selectedEmail.isRead || false,
    isDraft: selectedEmail.isDraft || false,
    fromName: sender.name || null,
    fromAddress: sender.address || sender.emailAddress?.address || null,
    senderName: selectedEmail.sender?.emailAddress?.name || selectedEmail.sender?.name || null,
    senderAddress: selectedEmail.sender?.emailAddress?.address || selectedEmail.sender?.address || null,
    toRecipients: recipients.length > 0
      ? JSON.stringify(recipients.map(r => r.emailAddress?.address || r.address || r))
      : null,
    ccRecipients: ccRecipients.length > 0
      ? JSON.stringify(ccRecipients.map(r => r.emailAddress?.address || r.address || r))
      : null,
    bccRecipients: bccRecipients.length > 0
      ? JSON.stringify(bccRecipients.map(r => r.emailAddress?.address || r.address || r))
      : null,
    replyTo: selectedEmail.replyTo ? JSON.stringify(selectedEmail.replyTo) : null,
    receivedDateTime: selectedEmail.receivedDateTime || null,
    sentDateTime: selectedEmail.sentDateTime || null,
    createdDateTime: selectedEmail.createdDateTime || new Date().toISOString(),
    lastModifiedDateTime: selectedEmail.lastModifiedDateTime || null,
    internetMessageId: selectedEmail.internetMessageId || selectedEmail.messageId || null,
    activityId: activityId,
  };
};






