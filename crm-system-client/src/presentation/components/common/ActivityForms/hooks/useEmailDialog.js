import { useState } from 'react';
import { LocalAuthRepository } from '@infrastructure/repositories/LocalAuthRepository';
import { EmailAuthRepository } from '@infrastructure/repositories/EmailAuthRepository';
import { checkEmailsByConversation, findEmailByMailId } from '@presentation/data';

/**
 * Custom hook to manage email dialog state and operations
 */
export const useEmailDialog = () => {
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [confirmedEmail, setConfirmedEmail] = useState(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [tokenExpired, setTokenExpired] = useState(false);
  const [emailPage, setEmailPage] = useState(1);
  const [emailPageSize] = useState(50);
  const [hasMoreEmails, setHasMoreEmails] = useState(true);
  const [loadingMoreEmails, setLoadingMoreEmails] = useState(false);
  const [totalEmails, setTotalEmails] = useState(0);
  const [mailFolders, setMailFolders] = useState([]);
  const [foldersLoading, setFoldersLoading] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [confirmingEmail, setConfirmingEmail] = useState(false);

  // Conversation thread dialog state
  const [conversationThreadDialogOpen, setConversationThreadDialogOpen] = useState(false);
  const [conversationEmails, setConversationEmails] = useState([]);
  const [loadingConversation, setLoadingConversation] = useState(false);

  const loadEmailsForActivityCreation = async (page = 1, append = false, folderIdParam = null) => {
    if (append) {
      setLoadingMoreEmails(true);
    } else {
      setEmailLoading(true);
      setEmailPage(1);
      setHasMoreEmails(true);
    }

    try {
      const localRepo = new LocalAuthRepository();
      const emailRepo = new EmailAuthRepository(localRepo);

      // Get total email count from server
      let serverTotalCount = 0;
      try {
        serverTotalCount = await emailRepo.getTotalEmailsCount();
      } catch (countError) {
        console.warn('Failed to get total email count:', countError);
      }
      setTotalEmails(serverTotalCount);

      // Get paginated emails
      const effectiveFolderId = folderIdParam || selectedFolderId || null;
      const emailResponse = effectiveFolderId
        ? await emailRepo.getEmailsByFolder(effectiveFolderId, emailPageSize, page)
        : await emailRepo.getEmails(emailPageSize, page);
      const emailData = emailResponse.emails || [];

      // Filter emails suitable for activity creation
      let filteredEmails = emailData.filter(email => {
        const isRecent = new Date(email.receivedDateTime) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const isExternal = !email.from.emailAddress.address.includes('@yourcompany.com');
        return isRecent && isExternal;
      });

      // Sort by received date (newest first)
      filteredEmails.sort((a, b) => new Date(b.receivedDateTime) - new Date(a.receivedDateTime));

      if (append) {
        setEmails(prev => [...prev, ...filteredEmails]);
        setEmailPage(page);
      } else {
        setEmails(filteredEmails);
        setEmailPage(1);
      }

      const hasMore = filteredEmails.length === emailPageSize;
      setHasMoreEmails(hasMore);

    } catch (error) {
      console.error('Error loading emails:', error);

      if (error.message === 'TOKEN_EXPIRED' || error.message.includes('InvalidAuthenticationToken')) {
        setTokenExpired(true);
        setEmails([]);
      } else {
        setTokenExpired(false);
      }
    } finally {
      setEmailLoading(false);
      setLoadingMoreEmails(false);
    }
  };

  const loadMoreEmails = async () => {
    if (!loadingMoreEmails && hasMoreEmails) {
      const nextPage = emailPage + 1;
      await loadEmailsForActivityCreation(nextPage, true);
    }
  };

  const loadMailFolders = async () => {
    try {
      setFoldersLoading(true);
      const localRepo = new LocalAuthRepository();
      const emailRepo = new EmailAuthRepository(localRepo);
      const folders = await emailRepo.getMailFolders();
      setMailFolders(folders);

      // Select Inbox by default if present
      const inbox = folders.find(f => (f.displayName || '').toLowerCase() === 'inbox');
      const defaultFolder = inbox || folders[0] || null;
      if (defaultFolder) {
        setSelectedFolderId(defaultFolder.id);
      }
      return defaultFolder?.id || null;
    } catch (error) {
      console.error('Error loading mail folders:', error);
      setMailFolders([]);
      return null;
    } finally {
      setFoldersLoading(false);
    }
  };

  const handleOpenEmailDialog = (isConnected) => {
    setEmailDialogOpen(true);
    setTokenExpired(false);
    if (isConnected) {
      loadMailFolders().then((defaultFolderId) => {
        const targetFolderId = defaultFolderId || selectedFolderId || null;
        setTimeout(() => {
          loadEmailsForActivityCreation(1, false, targetFolderId);
        }, 0);
      });
    } else {
      setEmails([]);
    }
  };

  const handleCloseEmailDialog = () => {
    setEmailDialogOpen(false);
    setSelectedEmail(null);
  };

  const handleEmailSelect = (email) => {
    setSelectedEmail(email);
  };

  const handleFolderSelect = async (folder) => {
    if (!folder || folder.id === selectedFolderId) return;
    setSelectedFolderId(folder.id);
    await loadEmailsForActivityCreation(1, false, folder.id);
  };

  // Open conversation thread dialog to select email range
  const handleOpenConversationThread = async () => {
    if (!selectedEmail) return;

    const conversationId = selectedEmail.conversationId;
    if (!conversationId) {
      console.warn('Selected email has no conversationId');
      return;
    }

    try {
      setLoadingConversation(true);
      setConversationThreadDialogOpen(true);

      const conversationResult = await checkEmailsByConversation(conversationId);

      if (conversationResult.hasEmails && conversationResult.emails.length > 0) {
        setConversationEmails(conversationResult.emails);
      } else {
        // Fallback to just the selected email if conversation fetch fails
        setConversationEmails([selectedEmail]);
      }
    } catch (error) {
      console.error('Error loading conversation thread:', error);
      setConversationEmails([selectedEmail]);
    } finally {
      setLoadingConversation(false);
    }
  };

  const handleCloseConversationThread = () => {
    setConversationThreadDialogOpen(false);
    setConversationEmails([]);
  };

  const handleConfirmEmailSelection = async (onEmailData) => {
    if (selectedEmail && !confirmingEmail) {
      setConfirmingEmail(true);
      try {
        const conversationId = selectedEmail.conversationId || '';
        let latestEmail = selectedEmail;
        let body = selectedEmail.body?.content || selectedEmail.bodyPreview || '';

        // If we have a conversationId, try to get emails up to the selected email
        if (conversationId) {
          console.log('Fetching emails from conversation up to selected email:', conversationId);

          const conversationResult = await checkEmailsByConversation(conversationId);

          if (conversationResult.hasEmails && conversationResult.emails.length > 0) {
            const selectedEmailDate = new Date(selectedEmail.receivedDateTime || selectedEmail.sentDateTime || 0);

            // Filter emails: only keep emails that are older than or equal to the selected email
            const filteredEmails = conversationResult.emails.filter(email => {
              const emailDate = new Date(email.receivedDateTime || email.sentDateTime || 0);
              return emailDate <= selectedEmailDate;
            });

            // Sort by date descending (newest first)
            const sortedEmails = filteredEmails.sort((a, b) => {
              const dateA = new Date(a.receivedDateTime || a.sentDateTime || 0);
              const dateB = new Date(b.receivedDateTime || b.sentDateTime || 0);
              return dateB - dateA;
            });

            // Take the latest email from the filtered list
            if (sortedEmails.length > 0) {
              latestEmail = sortedEmails[0];
              body = latestEmail.body?.content || latestEmail.bodyPreview || '';

              console.log('Using latest email from filtered conversation:', {
                subject: latestEmail.subject,
                receivedDateTime: latestEmail.receivedDateTime,
                totalEmailsInConversation: conversationResult.emails.length,
                filteredEmailsCount: filteredEmails.length,
                isDifferentFromSelected: latestEmail.id !== selectedEmail.id
              });
            } else {
              console.log('No emails found after filtering, using selected email');
            }
          } else {
            console.log('No emails found in conversation, using selected email');
          }
        }

        const sender = latestEmail.from?.emailAddress || selectedEmail.from?.emailAddress;
        const recipients = latestEmail.toRecipients || selectedEmail.toRecipients || [];
        const subject = latestEmail.subject || selectedEmail.subject || '';

        // Download attachments if any
        console.log('Checking for attachments in email:', latestEmail.subject);
        const localRepo = new LocalAuthRepository();
        const emailRepo = new EmailAuthRepository(localRepo);
        const downloadedAttachments = latestEmail.hasAttachments
          ? await emailRepo.downloadEmailAttachments(latestEmail.id)
          : [];

        if (downloadedAttachments.length > 0) {
          console.log(`Downloaded ${downloadedAttachments.filter(a => a.success).length} of ${downloadedAttachments.length} attachments`);
        }

        // Store the confirmed email for later use
        setConfirmedEmail(latestEmail);

        // Call the onEmailData callback if provided
        if (onEmailData) {
          onEmailData({
            sender: sender,
            subject: subject,
            body: body,
            email: latestEmail,
            conversationId: conversationId,
            recipients: recipients,
            attachments: downloadedAttachments // Add downloaded attachments
          });
        }

        handleCloseEmailDialog();

        return {
          success: true,
          email: latestEmail,
          sender,
          recipients,
          subject,
          body,
          conversationId
        };

      } catch (error) {
        console.error('Error fetching latest email from conversation:', error);

        // Fallback to original behavior
        const sender = selectedEmail.from.emailAddress;
        const recipients = selectedEmail.toRecipients.map(recipient => recipient.emailAddress.address);
        const subject = selectedEmail.subject || '';
        const body = selectedEmail.body?.content || selectedEmail.bodyPreview || '';
        const conversationId = selectedEmail.conversationId || '';

        // Download attachments for fallback email
        console.log('Checking for attachments in fallback email:', selectedEmail.subject);
        const localRepo = new LocalAuthRepository();
        const emailRepo = new EmailAuthRepository(localRepo);
        const downloadedAttachments = selectedEmail.hasAttachments
          ? await emailRepo.downloadEmailAttachments(selectedEmail.id)
          : [];

        if (downloadedAttachments.length > 0) {
          console.log(`Downloaded ${downloadedAttachments.filter(a => a.success).length} of ${downloadedAttachments.length} attachments (fallback)`);
        }

        setConfirmedEmail(selectedEmail);

        if (onEmailData) {
          onEmailData({
            sender: sender,
            subject: subject,
            body: body,
            email: selectedEmail,
            conversationId: conversationId,
            recipients: selectedEmail.toRecipients || [],
            attachments: downloadedAttachments // Add downloaded attachments
          });
        }

        handleCloseEmailDialog();

        return {
          success: true,
          email: selectedEmail,
          sender,
          recipients,
          subject,
          body,
          conversationId
        };
      } finally {
        setConfirmingEmail(false);
      }
    }
    return { success: false };
  };

  const resetEmailDialog = () => {
    setSelectedEmail(null);
    setConfirmedEmail(null);
  };

  return {
    // State
    emailDialogOpen,
    emails,
    selectedEmail,
    confirmedEmail,
    emailLoading,
    tokenExpired,
    emailPage,
    hasMoreEmails,
    loadingMoreEmails,
    totalEmails,
    mailFolders,
    foldersLoading,
    selectedFolderId,
    confirmingEmail,
    conversationThreadDialogOpen,
    conversationEmails,
    loadingConversation,

    // State setters (for direct manipulation when needed)
    setEmailDialogOpen,
    setEmails,
    setSelectedEmail,
    setConfirmedEmail,
    setEmailLoading,
    setTokenExpired,
    setEmailPage,
    setHasMoreEmails,
    setLoadingMoreEmails,
    setTotalEmails,
    setMailFolders,
    setFoldersLoading,
    setSelectedFolderId,
    setConfirmingEmail,
    setConversationThreadDialogOpen,
    setConversationEmails,
    setLoadingConversation,

    // Actions
    loadEmailsForActivityCreation,
    loadMoreEmails,
    loadMailFolders,
    handleOpenEmailDialog,
    handleCloseEmailDialog,
    handleEmailSelect,
    handleFolderSelect,
    handleConfirmEmailSelection,
    resetEmailDialog,
    handleOpenConversationThread,
    handleCloseConversationThread,
  };
};

