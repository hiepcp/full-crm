import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  CircularProgress,
  Alert,
  Divider,
  Chip,
  Avatar,
  Stack
} from '@mui/material';
import {
  Email as EmailIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Attachment as AttachmentIcon
} from '@mui/icons-material';
import { formatDateTime } from '../../../../../utils/formatDateTime';

/**
 * Dialog to show conversation thread and allow selecting email range
 * Shows all emails in a conversation with newest at top
 * User selects one email, and all emails from that point backwards are included
 */
const ConversationThreadDialog = ({
  open,
  onClose,
  selectedEmail,
  conversationEmails,
  loading,
  onConfirm
}) => {
  const [selectedCutoffEmail, setSelectedCutoffEmail] = useState(null);
  const [sortedEmails, setSortedEmails] = useState([]);

  // Sort emails by date (newest first) when conversation emails change
  useEffect(() => {
    if (conversationEmails && conversationEmails.length > 0) {
      const sorted = [...conversationEmails].sort((a, b) => {
        const dateA = new Date(a.receivedDateTime || a.sentDateTime || 0);
        const dateB = new Date(b.receivedDateTime || b.sentDateTime || 0);
        return dateB - dateA; // Descending (newest first)
      });
      setSortedEmails(sorted);

      // Auto-select the originally selected email as cutoff
      if (selectedEmail) {
        const matchingEmail = sorted.find(e => e.id === selectedEmail.id);
        setSelectedCutoffEmail(matchingEmail || sorted[0]);
      } else {
        // Default to newest (first in sorted list)
        setSelectedCutoffEmail(sorted[0]);
      }
    }
  }, [conversationEmails, selectedEmail]);

  // Get emails that will be included (from selected cutoff backwards)
  const getIncludedEmails = () => {
    if (!selectedCutoffEmail) return [];

    const cutoffDate = new Date(selectedCutoffEmail.receivedDateTime || selectedCutoffEmail.sentDateTime || 0);
    return sortedEmails.filter(email => {
      const emailDate = new Date(email.receivedDateTime || email.sentDateTime || 0);
      return emailDate <= cutoffDate;
    });
  };

  const includedEmails = getIncludedEmails();
  const latestIncludedEmail = includedEmails.length > 0 ? includedEmails[0] : null;

  const handleEmailClick = (email) => {
    setSelectedCutoffEmail(email);
  };

  const handleConfirm = () => {
    if (latestIncludedEmail && onConfirm) {
      onConfirm(latestIncludedEmail, includedEmails);
    }
  };

  const isEmailIncluded = (email) => {
    return includedEmails.some(e => e.id === email.id);
  };

  const isEmailCutoff = (email) => {
    return selectedCutoffEmail?.id === email.id;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { height: '80vh', display: 'flex', flexDirection: 'column' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EmailIcon color="primary" />
          <Box>
            <Typography variant="h6" component="div">
              Select Email Range from Conversation
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Click on an email to select it and all previous emails in the thread
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ px: 0, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
            <CircularProgress />
          </Box>
        ) : sortedEmails.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, px: 3 }}>
            <Alert severity="info">
              No emails found in this conversation
            </Alert>
          </Box>
        ) : (
          <>
            {/* Summary Info */}
            <Box sx={{ px: 3, pb: 2 }}>
              <Alert severity="info" icon={<CheckCircleIcon />}>
                <Typography variant="body2">
                  <strong>{includedEmails.length}</strong> of <strong>{sortedEmails.length}</strong> emails will be included
                  {latestIncludedEmail && (
                    <>
                      {' '}- Latest: <strong>{latestIncludedEmail.subject}</strong>
                    </>
                  )}
                </Typography>
              </Alert>
            </Box>

            {/* Email Thread List */}
            <Box sx={{ flex: 1, overflow: 'auto', px: 3 }}>
              <List sx={{ p: 0 }}>
                {sortedEmails.map((email, index) => {
                  const isIncluded = isEmailIncluded(email);
                  const isCutoff = isEmailCutoff(email);
                  const sender = email.from?.emailAddress || email.from;
                  const receivedDate = new Date(email.receivedDateTime || email.sentDateTime || 0);

                  return (
                    <React.Fragment key={email.id}>
                      <ListItem
                        onClick={() => handleEmailClick(email)}
                        sx={{
                          cursor: 'pointer',
                          borderRadius: 1,
                          mb: 1,
                          border: 2,
                          borderColor: isCutoff ? 'primary.main' : isIncluded ? 'success.light' : 'divider',
                          bgcolor: isCutoff ? 'primary.50' : isIncluded ? 'success.50' : 'transparent',
                          '&:hover': {
                            bgcolor: isCutoff ? 'primary.100' : isIncluded ? 'success.100' : 'action.hover',
                          },
                          transition: 'all 0.2s',
                          px: 2,
                          py: 1.5
                        }}
                      >
                        {/* Checkbox/Status Indicator */}
                        <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
                          <Checkbox
                            checked={isIncluded}
                            color={isCutoff ? 'primary' : 'success'}
                            sx={{ p: 0 }}
                            readOnly
                          />
                        </Box>

                        {/* Email Content */}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem', bgcolor: isIncluded ? 'primary.main' : 'grey.400' }}>
                              {sender?.name?.charAt(0)?.toUpperCase() || sender?.address?.charAt(0)?.toUpperCase() || 'E'}
                            </Avatar>
                            <Typography variant="subtitle2" noWrap sx={{ flex: 1 }}>
                              {sender?.name || sender?.address || 'Unknown Sender'}
                            </Typography>
                            <Stack direction="row" spacing={0.5}>
                              {email.hasAttachments && (
                                <Chip
                                  icon={<AttachmentIcon sx={{ fontSize: 14 }} />}
                                  label="Attachments"
                                  size="small"
                                  sx={{ height: 20, fontSize: '0.65rem' }}
                                />
                              )}
                              {isCutoff && (
                                <Chip
                                  label="Cutoff Point"
                                  size="small"
                                  color="primary"
                                  sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600 }}
                                />
                              )}
                            </Stack>
                          </Box>

                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: isIncluded ? 600 : 400,
                              mb: 0.5,
                              color: isIncluded ? 'text.primary' : 'text.secondary'
                            }}
                            noWrap
                          >
                            {email.subject || '(No Subject)'}
                          </Typography>

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ScheduleIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              {formatDateTime(email.receivedDateTime || email.sentDateTime)}
                            </Typography>
                          </Box>

                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              mt: 0.5,
                              lineHeight: 1.3
                            }}
                          >
                            {email.bodyPreview || email.body?.content?.substring(0, 100) || 'No preview available'}
                          </Typography>
                        </Box>
                      </ListItem>

                      {index < sortedEmails.length - 1 && (
                        <Divider sx={{ my: 0.5, mx: 2 }} />
                      )}
                    </React.Fragment>
                  );
                })}
              </List>
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={!latestIncludedEmail || loading}
          startIcon={<CheckCircleIcon />}
        >
          Use Selected Range ({includedEmails.length} {includedEmails.length === 1 ? 'Email' : 'Emails'})
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConversationThreadDialog;
