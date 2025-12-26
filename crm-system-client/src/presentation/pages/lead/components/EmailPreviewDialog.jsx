import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Avatar,
  Chip,
  Divider,
  Button,
  IconButton,
  Stack,
  Tooltip
} from '@mui/material';
import {
  Close as CloseIcon,
  Email as EmailIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Attachment as AttachmentIcon,
  Star as StarIcon,
  Reply as ReplyIcon,
  Forward as ForwardIcon,
  Archive as ArchiveIcon
} from '@mui/icons-material';
import { formatDateTime } from '../../../../utils/formatDateTime';

const EmailPreviewDialog = ({ open, onClose, email }) => {
  if (!email) return null;

  const sender = email.from.emailAddress;
  const toRecipients = email.toRecipients || [];
  const ccRecipients = email.ccRecipients || [];
  const bccRecipients = email.bccRecipients || [];

  const formatRecipients = (recipients) => {
    return recipients.map(recipient => recipient.emailAddress.name || recipient.emailAddress.address).join(', ');
  };

  const renderEmailBody = () => {
    // If email has HTML content, try to render it safely
    if (email.body?.contentType === 'html' && email.body?.content) {
      // For security, we'll sanitize and render basic HTML
      // In a real app, you'd use a proper HTML sanitizer like DOMPurify
      return (
        <Box
          dangerouslySetInnerHTML={{
            __html: email.body.content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
          }}
          sx={{
            '& img': { maxWidth: '100%', height: 'auto' },
            '& a': { color: 'primary.main', textDecoration: 'underline' },
            '& table': { borderCollapse: 'collapse', width: '100%' },
            '& td, & th': { border: '1px solid #ddd', padding: '8px' }
          }}
        />
      );
    }

    // Plain text content
    if (email.body?.content) {
      return (
        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
          {email.body.content}
        </Typography>
      );
    }

    // Fallback to body preview
    return (
      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
        {email.bodyPreview || 'No email content available'}
      </Typography>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          height: '90vh',
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ width: 40, height: 40 }}>
              {sender.name ? sender.name.charAt(0).toUpperCase() : <EmailIcon />}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" sx={{ fontSize: '1.1rem' }}>
                {email.subject || 'No Subject'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                From: {sender.name ? `${sender.name} <${sender.address}>` : sender.address}
              </Typography>
            </Box>
          </Box>

          <Stack direction="row" spacing={1}>
            {email.importance === 'high' && (
              <Tooltip title="High Importance">
                <StarIcon sx={{ color: 'warning.main' }} />
              </Tooltip>
            )}
            {email.hasAttachments && (
              <Tooltip title="Has Attachments">
                <AttachmentIcon />
              </Tooltip>
            )}
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Stack>
        </Box>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 3 }}>
          {/* Email Metadata */}
          <Box sx={{ mb: 3 }}>
            <Stack spacing={1}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Typography variant="body2" sx={{ minWidth: 60, fontWeight: 'medium' }}>
                  From:
                </Typography>
                <Typography variant="body2">
                  {sender.name ? `${sender.name} <${sender.address}>` : sender.address}
                </Typography>
              </Box>

              {toRecipients.length > 0 && (
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Typography variant="body2" sx={{ minWidth: 60, fontWeight: 'medium' }}>
                    To:
                  </Typography>
                  <Typography variant="body2">
                    {formatRecipients(toRecipients)}
                  </Typography>
                </Box>
              )}

              {ccRecipients.length > 0 && (
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Typography variant="body2" sx={{ minWidth: 60, fontWeight: 'medium' }}>
                    CC:
                  </Typography>
                  <Typography variant="body2">
                    {formatRecipients(ccRecipients)}
                  </Typography>
                </Box>
              )}

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Typography variant="body2" sx={{ minWidth: 60, fontWeight: 'medium' }}>
                  Date:
                </Typography>
                <Typography variant="body2">
                  {formatDateTime(email.receivedDateTime)}
                </Typography>
              </Box>
            </Stack>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Email Content */}
          <Box>
            {renderEmailBody()}
          </Box>

          {/* Attachments Section */}
          {email.attachments && email.attachments.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'medium' }}>
                Attachments ({email.attachments.length})
              </Typography>
              <Stack spacing={1}>
                {email.attachments.map((attachment, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      p: 1,
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                      bgcolor: 'grey.50'
                    }}
                  >
                    <AttachmentIcon fontSize="small" />
                    <Typography variant="body2" sx={{ flex: 1 }}>
                      {attachment.name || `Attachment ${index + 1}`}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {attachment.size ? `${Math.round(attachment.size / 1024)} KB` : ''}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Box>
          )}
        </Box>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Stack direction="row" spacing={1} sx={{ width: '100%', justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ReplyIcon />}
              onClick={() => {/* Handle reply */}}
            >
              Reply
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ForwardIcon />}
              onClick={() => {/* Handle forward */}}
            >
              Forward
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ArchiveIcon />}
              onClick={() => {/* Handle archive */}}
            >
              Archive
            </Button>
          </Stack>

          <Button
            variant="contained"
            onClick={() => {/* Handle create lead from this email */}}
            sx={{ minWidth: 140 }}
          >
            Create Lead
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
};

export default EmailPreviewDialog;
