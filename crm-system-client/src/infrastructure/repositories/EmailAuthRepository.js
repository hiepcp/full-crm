import { IEmailAuthRepository } from "@domain/interfaces/IEmailAuthRepository";
import config from '@src/config';

export class EmailAuthRepository extends IEmailAuthRepository {
  constructor(localRepo) {
    super();
    this.localRepo = localRepo;
  }

  async login() {
    // OAuth Popup Authentication with COOP (Cross-Origin-Opener-Policy) compliance
    // COOP prevents access to popup.closed, so we rely on:
    // 1. Message events for success/error (popup closes itself)
    // 2. Timeout for user cancellation/taking too long
    // 3. Try-catch blocks for any remaining popup operations

    const clientId = config.clientId;
    const tenantId = config.tenantId || 'common';
    const redirectUri = encodeURIComponent(config.redirectUri);

    // Generate PKCE code challenge (Proof Key for Code Exchange)
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = await this.generateCodeChallenge(codeVerifier);

    // Scopes specifically for email access (similar to Pipeline CRM requirements)
    const scopes = encodeURIComponent(
      'openid profile email offline_access ' +
      // 'https://graph.microsoft.com/Mail.Read ' +
      // 'https://graph.microsoft.com/Mail.ReadWrite ' +
      // 'https://graph.microsoft.com/Mail.Send ' +
      // 'https://graph.microsoft.com/Calendars.ReadWrite ' +
      'https://graph.microsoft.com/Contacts.ReadWrite ' +
      'https://graph.microsoft.com/User.Read'
    );

    // Save code verifier for later use in callback
    sessionStorage.setItem('pkce_code_verifier', codeVerifier);

    const authUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize` +
      `?client_id=${clientId}` +
      `&response_type=code` +
      `&redirect_uri=${redirectUri}` +
      `&response_mode=query` +
      `&scope=${scopes}` +
      `&state=email_connect` +
      `&code_challenge=${codeChallenge}` +
      `&code_challenge_method=S256` +
      `&prompt=consent`;

    // Open OAuth popup
    const popup = window.open(
      authUrl,
      'email-auth',
      'width=600,height=700,scrollbars=yes,resizable=yes'
    );

    return new Promise((resolve, reject) => {
      const messageHandler = async (event) => {
        // Handle success message from popup
        // COOP-safe: popup closes itself via window.close() in EmailOAuthCallback.jsx
        if (event.data?.type === 'email_auth_success') {
          window.removeEventListener('message', messageHandler);
          try {
            popup.close();
          } catch (error) {
            // Ignore COOP errors when trying to close popup
            console.warn('Could not close popup (likely COOP policy):', error.message);
          }

          const { email, accessToken, refreshToken } = event.data;

          // Save tokens
          await this.localRepo.saveEmailToken(accessToken, 604800); // 7 days expiry

          // Save email connection info
          const connectionInfo = {
            email,
            connectedAt: new Date().toISOString(),
            provider: 'microsoft',
            accessToken,
            refreshToken,
            scopes: scopes.split(' ')
          };

          localStorage.setItem('connectedEmail', JSON.stringify(connectionInfo));

          resolve(connectionInfo);
        }
        // Handle error message from popup
        // COOP-safe: popup closes itself via window.close() in EmailOAuthCallback.jsx
        else if (event.data?.type === 'email_auth_error') {
          window.removeEventListener('message', messageHandler);
          try {
            popup.close();
          } catch (error) {
            // Ignore COOP errors when trying to close popup
            console.warn('Could not close popup (likely COOP policy):', error.message);
          }
          reject(new Error(event.data.error || 'Authentication failed'));
        }
      };

      window.addEventListener('message', messageHandler);

      // Timeout after 5 minutes (handles user closing popup, taking too long, etc.)
      // COOP-safe: wrapped in try-catch to handle cross-origin popup access errors
      setTimeout(() => {
        window.removeEventListener('message', messageHandler);
        try {
          // Try to close popup if it still exists (ignore COOP errors)
          if (popup) {
            popup.close();
          }
        } catch (error) {
          // Ignore COOP errors when trying to close popup
          console.warn('Could not close popup (likely COOP policy):', error.message);
        }
        reject(new Error('Authentication timeout'));
      }, 300000);
    });
  }

  // PKCE Helper methods
  generateCodeVerifier() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return this.base64URLEncode(array);
  }

  async generateCodeChallenge(codeVerifier) {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return this.base64URLEncode(new Uint8Array(digest));
  }

  base64URLEncode(array) {
    const base64 = btoa(String.fromCharCode(...array));
    return base64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  async refreshToken() {
    const connectionInfo = this.getConnectionInfo();
    if (!connectionInfo?.refreshToken) {
      throw new Error('No refresh token available');
    }

    // With PKCE, we can refresh tokens directly from frontend too!
    // But this is still complex and requires token management
    // Recommendation: Still use backend for refresh token handling for security

    try {
      const tenantId = config.tenantId || 'common';
      const redirectUri = (window.location.origin + '/auth/callback');

      const response = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: config.clientId,
          refresh_token: connectionInfo.refreshToken,
          grant_type: 'refresh_token',
          redirect_uri: redirectUri
        })
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      const updatedInfo = {
        ...connectionInfo,
        accessToken: data.access_token,
        connectedAt: new Date().toISOString()
      };

      localStorage.setItem('connectedEmail', JSON.stringify(updatedInfo));
      await this.localRepo.saveEmailToken(data.access_token, data.expires_in);

      return updatedInfo;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw error;
    }
  }

  async disconnect() {
    const connectionInfo = this.getConnectionInfo();
    if (connectionInfo) {
      localStorage.removeItem('connectedEmail');
      await this.localRepo.clearEmailToken();
    }
  }

  getConnectionInfo() {
    try {
      const stored = localStorage.getItem('connectedEmail');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error getting connection info:', error);
      return null;
    }
  }

  isConnected() {
    const info = this.getConnectionInfo();
    return info && info.accessToken;
  }

  async getTotalEmailsCount() {
    const connectionInfo = this.getConnectionInfo();
    if (!connectionInfo) {
      throw new Error('Email not connected');
    }

    try {
      // Check if token needs refresh
      const token = await this.localRepo.getEmailToken();
      if (!token) {
        await this.refreshToken();
      }

      // Get total count using Microsoft Graph API
      const response = await fetch('https://graph.microsoft.com/v1.0/me/messages?$count=true&$top=1&$orderby=receivedDateTime desc', {
        headers: {
          'Authorization': `Bearer ${this.getConnectionInfo().accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, try refresh
          try {
            await this.refreshToken();
            return this.getTotalEmailsCount(); // Retry with new token
          } catch (refreshError) {
            throw new Error('TOKEN_EXPIRED');
          }
        }
        throw new Error('Failed to fetch email count');
      }

      const data = await response.json();
      return data['@odata.count'] || 0;
    } catch (error) {
      console.error('Error fetching email count:', error);
      if (error.message === 'TOKEN_EXPIRED' || error.message.includes('InvalidAuthenticationToken')) {
        throw new Error('TOKEN_EXPIRED');
      }
      throw error;
    }
  }

  async getMailFolders() {
    const connectionInfo = this.getConnectionInfo();
    if (!connectionInfo) {
      throw new Error('Email not connected');
    }

    const fetchWithAuth = async (url, retryCount = 0) => {
      const maxRetries = 1; // Prevent infinite loops
      let currentInfo = this.getConnectionInfo();

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${currentInfo.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        if (response.status === 401 && retryCount < maxRetries) {
          try {
            await this.refreshToken();
            return fetchWithAuth(url, retryCount + 1);
          } catch (e) {
            throw new Error('TOKEN_EXPIRED');
          }
        }
        throw new Error('Failed to fetch mail folders');
      }
      return response.json();
    };

    try {
      // Get top-level folders with counts
      const topUrl = 'https://graph.microsoft.com/v1.0/me/mailFolders?$top=100&$select=id,displayName,childFolderCount,totalItemCount,unreadItemCount';
      const topData = await fetchWithAuth(topUrl);
      const topFolders = topData.value || [];

      // For each folder with children, fetch one level of child folders
      const foldersWithChildren = await Promise.all(topFolders.map(async (f) => {
        if (f.childFolderCount > 0) {
          const childUrl = `https://graph.microsoft.com/v1.0/me/mailFolders/${f.id}/childFolders?$top=100&$select=id,displayName,childFolderCount,totalItemCount,unreadItemCount`;
          try {
            const childData = await fetchWithAuth(childUrl);
            return { ...f, childFolders: childData.value || [] };
          } catch (_) {
            return { ...f, childFolders: [] };
          }
        }
        return { ...f, childFolders: [] };
      }));

      return foldersWithChildren;
    } catch (error) {
      console.error('Error fetching mail folders:', error);
      if (error.message === 'TOKEN_EXPIRED' || (error.message || '').includes('InvalidAuthenticationToken')) {
        throw new Error('TOKEN_EXPIRED');
      }
      throw error;
    }
  }

  async getEmailsByFolder(folderId, pageSize = 50, page = 1) {
    const connectionInfo = this.getConnectionInfo();
    if (!connectionInfo) {
      throw new Error('Email not connected');
    }

    try {
      const token = await this.localRepo.getEmailToken();
      if (!token) {
        await this.refreshToken();
      }

      const skip = (page - 1) * pageSize;
      let apiUrl = `https://graph.microsoft.com/v1.0/me/mailFolders/${folderId}/messages?$top=${pageSize}&$orderby=receivedDateTime desc`;
      if (skip > 0) apiUrl += `&$skip=${skip}`;

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${this.getConnectionInfo().accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          try {
            await this.refreshToken();
            return this.getEmailsByFolder(folderId, pageSize, page);
          } catch (e) {
            throw new Error('TOKEN_EXPIRED');
          }
        }
        throw new Error('Failed to fetch emails by folder');
      }

      const data = await response.json();
      return {
        emails: data.value || [],
        totalCount: data['@odata.count'] || 0
      };
    } catch (error) {
      console.error('Error fetching emails by folder:', error);
      if (error.message === 'TOKEN_EXPIRED' || (error.message || '').includes('InvalidAuthenticationToken')) {
        throw new Error('TOKEN_EXPIRED');
      }
      throw error;
    }
  }

  async getEmails(pageSize = 50, page = 1) {
    const connectionInfo = this.getConnectionInfo();
    if (!connectionInfo) {
      throw new Error('Email not connected');
    }

    try {
      // Check if token needs refresh
      const token = await this.localRepo.getEmailToken();
      if (!token) {
        await this.refreshToken();
      }

      // Calculate skip for pagination (page starts from 1, but skip starts from 0)
      const skip = (page - 1) * pageSize;

      // Build Graph API URL with pagination parameters
      let apiUrl = `https://graph.microsoft.com/v1.0/me/messages?$top=${pageSize}&$orderby=receivedDateTime desc`;
      if (skip > 0) {
        apiUrl += `&$skip=${skip}`;
      }

      // Call Microsoft Graph API to get emails
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${this.getConnectionInfo().accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, try refresh
          try {
            await this.refreshToken();
            return this.getEmails(pageSize, page); // Retry with new token
          } catch (refreshError) {
            // If refresh fails, throw specific token expired error
            throw new Error('TOKEN_EXPIRED');
          }
        }
        throw new Error('Failed to fetch emails');
      }

      const data = await response.json();
      return {
        emails: data.value || [],
        totalCount: data['@odata.count'] || 0
      };
    } catch (error) {
      console.error('Error fetching emails:', error);

      // Check if this is a token expiry error
      if (error.message === 'TOKEN_EXPIRED' || error.message.includes('InvalidAuthenticationToken')) {
        throw new Error('TOKEN_EXPIRED');
      }

      throw error;
    }
  }

  async getEmailsByConversation(conversationId, pageSize = 50, page = 1) {
    const connectionInfo = this.getConnectionInfo();
    if (!connectionInfo) {
      throw new Error('Email not connected');
    }

    if (!conversationId) {
      throw new Error('ConversationId is required');
    }

    try {
      // Check if token needs refresh
      const token = await this.localRepo.getEmailToken();
      if (!token) {
        await this.refreshToken();
      }

      // Calculate skip for pagination (page starts from 1, but skip starts from 0)
      const skip = (page - 1) * pageSize;

      // Alternative approach: fetch recent emails and filter client-side
      // This is more reliable than search/filter which may not work for conversationId
      console.log('Fetching recent emails to filter by conversationId client-side');
      let apiUrl = `https://graph.microsoft.com/v1.0/me/messages?$top=200&$orderby=receivedDateTime desc`;

      if (skip > 0) {
        apiUrl += `&$skip=${skip}`;
      }

      console.log('Fetching emails by conversation:', { conversationId, apiUrl });

      // Call Microsoft Graph API to get emails by conversation
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${this.getConnectionInfo().accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('API Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error response:', errorText);

        if (response.status === 401) {
          // Token expired, try refresh
          try {
            await this.refreshToken();
            return this.getEmailsByConversation(conversationId, pageSize, page); // Retry with new token
          } catch (refreshError) {
            // If refresh fails, throw specific token expired error
            throw new Error('TOKEN_EXPIRED');
          }
        }

        // Handle other error codes
        if (response.status === 400) {
          throw new Error(`Invalid request: ${errorText}`);
        } else if (response.status === 403) {
          throw new Error(`Access forbidden: ${errorText}`);
        } else if (response.status === 404) {
          throw new Error(`Conversation not found: ${errorText}`);
        } else {
          throw new Error(`Failed to fetch emails by conversation (${response.status}): ${errorText}`);
        }
      }

      const data = await response.json();
      console.log('Successfully fetched recent emails:', {
        count: data.value?.length || 0,
        totalCount: data['@odata.count'] || 0
      });

      // Filter emails by conversationId client-side
      const filteredEmails = (data.value || []).filter(email => email.conversationId === conversationId);
      console.log('Filtered emails by conversationId:', {
        conversationId,
        totalFetched: data.value?.length || 0,
        filteredCount: filteredEmails.length
      });

      return {
        emails: filteredEmails,
        totalCount: filteredEmails.length // We don't know the real total, just return what we found
      };
    } catch (error) {
      console.error('Error fetching emails by conversation:', error);

      // Check if this is a token expiry error
      if (error.message === 'TOKEN_EXPIRED' || error.message.includes('InvalidAuthenticationToken')) {
        throw new Error('TOKEN_EXPIRED');
      }

      throw error;
    }
  }

  async getAppointments(pageSize = 50, page = 1) {
    const connectionInfo = this.getConnectionInfo();
    if (!connectionInfo) {
      throw new Error('Email not connected');
    }

    try {
      // Check if token needs refresh
      const token = await this.localRepo.getEmailToken();
      if (!token) {
        await this.refreshToken();
      }

      // Calculate skip for pagination (page starts from 1, but skip starts from 0)
      const skip = (page - 1) * pageSize;

      // Build Graph API URL with pagination parameters for calendar events
      let apiUrl = `https://graph.microsoft.com/v1.0/me/events?$filter=type eq 'singleInstance'&$orderby=start/dateTime desc&$top=${pageSize}`;
      if (skip > 0) {
        apiUrl += `&$skip=${skip}`;
      }

      // Call Microsoft Graph API to get appointments
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${this.getConnectionInfo().accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, try refresh
          try {
            await this.refreshToken();
            return this.getAppointments(pageSize, page); // Retry with new token
          } catch (refreshError) {
            // If refresh fails, throw specific token expired error
            throw new Error('TOKEN_EXPIRED');
          }
        }
        throw new Error('Failed to fetch appointments');
      }

      const data = await response.json();
      return {
        appointments: data.value || [],
        totalCount: data['@odata.count'] || 0
      };
    } catch (error) {
      console.error('Error fetching appointments:', error);

      // Check if this is a token expiry error
      if (error.message === 'TOKEN_EXPIRED' || error.message.includes('InvalidAuthenticationToken')) {
        throw new Error('TOKEN_EXPIRED');
      }

      throw error;
    }
  }

  async sendEmail(to, subject, body, attachments = []) {
    const connectionInfo = this.getConnectionInfo();
    if (!connectionInfo) {
      throw new Error('Email not connected');
    }

    try {
      const emailData = {
        message: {
          subject: subject,
          body: {
            contentType: 'HTML',
            content: body
          },
          toRecipients: [
            {
              emailAddress: {
                address: to
              }
            }
          ]
        }
      };

      if (attachments.length > 0) {
        emailData.message.attachments = attachments;
      }

      const response = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getConnectionInfo().accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailData)
      });

      if (!response.ok) {
        if (response.status === 401) {
          await this.refreshToken();
          return this.sendEmail(to, subject, body, attachments); // Retry
        }
        throw new Error('Failed to send email');
      }

      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  async syncEmailsToCRM(pageSize = 50, page = 1) {
    try {
      const emailResponse = await this.getEmails(pageSize, page);
      const emails = emailResponse.emails || emailResponse;
      const connectionInfo = this.getConnectionInfo();

      // Transform emails to CRM format and sync
      const transformedEmails = emails.map(email => ({
        id: email.id,
        subject: email.subject,
        body: email.body?.content || email.bodyPreview,
        from: email.from?.emailAddress,
        to: email.toRecipients?.map(r => r.emailAddress),
        receivedDateTime: email.receivedDateTime,
        isRead: email.isRead,
        hasAttachments: email.hasAttachments,
        importance: email.importance,
        synced_to_activity: false,
        potential_relation_type: 'contact', // Default, can be enhanced with AI
        potential_relation_id: null,
        matched_contact_id: null
      }));

      // In a real implementation, this would call the CRM API
      // const result = await crmAPI.syncEmails(transformedEmails, connectionInfo.email);

      // For now, save to localStorage as mock data
      const existingEmails = JSON.parse(localStorage.getItem('syncedEmails') || '[]');
      const updatedEmails = [...existingEmails, ...transformedEmails];
      localStorage.setItem('syncedEmails', JSON.stringify(updatedEmails));

      return { synced: transformedEmails.length, total: emails.length };
    } catch (error) {
      console.error('Error syncing emails to CRM:', error);
      throw error;
    }
  }

  async handleMessage(event) {
    // This method handles messages from the OAuth popup
    if (event.data?.access_token) {
      const { access_token, refresh_token, expires_in } = event.data;
      await this.localRepo.saveEmailToken(access_token, expires_in);

      // Extract email from token or profile
      const email = event.data.email || await this.getUserEmail(access_token);

      return {
        email,
        accessToken: access_token,
        refreshToken: refresh_token
      };
    }
    return null;
  }

  async getUserEmail(accessToken) {
    try {
      const response = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const user = await response.json();
        return user.mail || user.userPrincipalName;
      }
    } catch (error) {
      console.error('Error getting user email:', error);
    }
    return null;
  }

  async downloadAttachment(messageId, attachmentId) {
    const connectionInfo = this.getConnectionInfo();
    if (!connectionInfo) {
      throw new Error('Email not connected');
    }

    try {
      // Check if token needs refresh
      const token = await this.localRepo.getEmailToken();
      if (!token) {
        await this.refreshToken();
      }

      console.log(`Downloading attachment ${attachmentId} from message ${messageId}`);

      // Download attachment content
      const response = await fetch(
        `https://graph.microsoft.com/v1.0/me/messages/${messageId}/attachments/${attachmentId}/$value`,
        {
          headers: {
            'Authorization': `Bearer ${this.getConnectionInfo().accessToken}`,
          }
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Attachment download API error:', response.status, errorText);

        if (response.status === 401) {
          // Token expired, try refresh
          try {
            await this.refreshToken();
            return this.downloadAttachment(messageId, attachmentId); // Retry with new token
          } catch (refreshError) {
            throw new Error('TOKEN_EXPIRED');
          }
        }

        throw new Error(`Failed to download attachment (${response.status}): ${errorText}`);
      }

      const blob = await response.blob();
      console.log(`Successfully downloaded attachment, size: ${blob.size} bytes`);
      return blob;

    } catch (error) {
      console.error('Error downloading attachment:', error);
      throw error;
    }
  }

  async downloadEmailAttachments(messageId) {
    const connectionInfo = this.getConnectionInfo();
    if (!connectionInfo) {
      throw new Error('Email not connected');
    }

    try {
      // Check if token needs refresh
      const token = await this.localRepo.getEmailToken();
      if (!token) {
        await this.refreshToken();
      }

      console.log(`Fetching attachments list for email: ${messageId}`);

      // First, get the list of attachments for this email
      const attachmentsResponse = await fetch(
        `https://graph.microsoft.com/v1.0/me/messages/${messageId}/attachments`,
        {
          headers: {
            'Authorization': `Bearer ${this.getConnectionInfo().accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!attachmentsResponse.ok) {
        const errorText = await attachmentsResponse.text();
        console.error('Attachments list API error:', attachmentsResponse.status, errorText);

        if (attachmentsResponse.status === 401) {
          // Token expired, try refresh
          try {
            await this.refreshToken();
            // Retry with new token
            const newConnectionInfo = this.getConnectionInfo();
            const retryResponse = await fetch(
              `https://graph.microsoft.com/v1.0/me/messages/${messageId}/attachments`,
              {
                headers: {
                  'Authorization': `Bearer ${newConnectionInfo.accessToken}`,
                  'Content-Type': 'application/json'
                }
              }
            );
            if (!retryResponse.ok) {
              throw new Error(`Failed to fetch attachments: ${retryResponse.status}`);
            }
            var attachmentsData = await retryResponse.json();
          } catch (refreshError) {
            throw new Error('TOKEN_EXPIRED');
          }
        } else {
          throw new Error(`Failed to fetch attachments (${attachmentsResponse.status}): ${errorText}`);
        }
      } else {
        var attachmentsData = await attachmentsResponse.json();
      }

      const attachments = attachmentsData.value || [];

      if (attachments.length === 0) {
        console.log('No attachments found for this email');
        return [];
      }

      console.log(`Found ${attachments.length} attachments, starting download...`);

      const downloadedAttachments = [];

      // Download each attachment
      for (const attachment of attachments) {
        try {
          console.log(`Downloading attachment: ${attachment.name} (${attachment.size} bytes)`);

          const blob = await this.downloadAttachment(messageId, attachment.id);

          // Create a File object from the blob
          const file = new File([blob], attachment.name, {
            type: attachment.contentType || 'application/octet-stream'
          });

          downloadedAttachments.push({
            file,
            originalAttachment: attachment,
            success: true
          });

          console.log(`Successfully downloaded attachment: ${attachment.name}`);
        } catch (error) {
          console.error(`Failed to download attachment ${attachment.name}:`, error);

          // Still include the attachment info but mark as failed
          downloadedAttachments.push({
            file: null,
            originalAttachment: attachment,
            success: false,
            error: error.message
          });
        }
      }

      return downloadedAttachments;

    } catch (error) {
      console.error('Error downloading email attachments:', error);
      throw error;
    }
  }
}
