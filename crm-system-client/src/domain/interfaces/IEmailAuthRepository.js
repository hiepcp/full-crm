export class IEmailAuthRepository {
  async login() {
    throw new Error('Method login() must be implemented');
  }

  async refreshToken() {
    throw new Error('Method refreshToken() must be implemented');
  }

  async disconnect() {
    throw new Error('Method disconnect() must be implemented');
  }

  getConnectionInfo() {
    throw new Error('Method getConnectionInfo() must be implemented');
  }

  isConnected() {
    throw new Error('Method isConnected() must be implemented');
  }

  async getTotalEmailsCount() {
    throw new Error('Method getTotalEmailsCount() must be implemented');
  }

  async getEmails(pageSize = 50, page = 1) {
    throw new Error('Method getEmails() must be implemented');
  }

  async getEmailsByConversation(conversationId, pageSize = 50, page = 1) {
    throw new Error('Method getEmailsByConversation() must be implemented');
  }

  async sendEmail(to, subject, body, attachments) {
    throw new Error('Method sendEmail() must be implemented');
  }

  async downloadAttachment(messageId, attachmentId) {
    throw new Error('Method downloadAttachment() must be implemented');
  }

  async downloadEmailAttachments(messageId) {
    throw new Error('Method downloadEmailAttachments() must be implemented');
  }

  async syncEmailsToCRM(pageSize = 50, page = 1) {
    throw new Error('Method syncEmailsToCRM() must be implemented');
  }

  async handleMessage(event) {
    throw new Error('Method handleMessage() must be implemented');
  }
}
