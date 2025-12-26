import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  CircularProgress,
  Divider,
  Tooltip,
  IconButton,
  Button,
  Grid
} from '@mui/material';
import {
  Email as EmailIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Attachment as AttachmentIcon,
  Star as StarIcon,
  Visibility as VisibilityIcon,
  Cloud as CloudIcon
} from '@mui/icons-material';
import { formatDateTime } from '../../../../utils/formatDateTime';
import EmailPreviewDialog from './EmailPreviewDialog';
import EmailFolderTree from './EmailFolderTree';

const EmailListComponent = ({
  emails,
  selectedEmail,
  onEmailSelect,
  loading,
  loadingMore = false,
  hasMore = false,
  onLoadMore,
  onConnectEmail,
  tokenExpired = false,
  notConnected = false,
  error = null,
  totalCount = 0,
  folders = [],
  selectedFolderId,
  onFolderSelect,
  foldersLoading = false
}) => {
  const [previewEmail, setPreviewEmail] = useState(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const scrollRef = useRef(null);

  const handlePreviewClick = (email, event) => {
    event.stopPropagation(); // Prevent email selection
    setPreviewEmail(email);
    setPreviewDialogOpen(true);
  };

  const handleClosePreview = () => {
    setPreviewDialogOpen(false);
    setPreviewEmail(null);
  };

  // Handle scroll to load more emails
  useEffect(() => {
    const handleScroll = () => {
      if (!scrollRef.current || loadingMore || !hasMore || !onLoadMore) return;

      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 50; // Reduced threshold to 50px

      if (isNearBottom) {
        console.log('Triggering load more emails');
        onLoadMore();
      }
    };

    const listElement = scrollRef.current;
    if (listElement) {
      listElement.addEventListener('scroll', handleScroll);
      return () => listElement.removeEventListener('scroll', handleScroll);
    }
  }, [loadingMore, hasMore, onLoadMore]);

  return (
    <Box sx={{ height: '70vh', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" sx={{ p: 2, pb: 1 }}>
        Total Emails ({totalCount > 0 ? totalCount : emails.length}) / Email ({selectedEmail ? 1 : 0})
      </Typography>
      <Divider />

      <Box sx={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {/* Folder Tree */}
        <Box sx={{ height: '100%', width: 260, flex: '0 0 260px', borderRight: 1, borderColor: 'divider' }}>
          {foldersLoading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%' }}>
              <CircularProgress size={20} />
            </Box>
          ) : (
            <EmailFolderTree
              folders={folders}
              selectedFolderId={selectedFolderId}
              onSelect={onFolderSelect}
            />
          )}
        </Box>

        {/* Email List / Empty States */}
        <Box ref={scrollRef} sx={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1, overflow: 'auto' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : emails.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              {notConnected ? (
                <>
                  <CloudIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    Connect your email account to create leads from emails
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<CloudIcon />}
                    onClick={onConnectEmail}
                    size="small"
                  >
                    Connect Microsoft Email
                  </Button>
                </>
              ) : tokenExpired ? (
                <>
                  <CloudIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    Your email connection has expired. Please reconnect to continue.
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<CloudIcon />}
                    onClick={onConnectEmail}
                    size="small"
                  >
                    Connect Microsoft Email
                  </Button>
                </>
              ) : (
                <>
                  <EmailIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                  <Typography variant="body2">
                    No emails available in this folder
                  </Typography>
                </>
              )}
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {emails.map((email) => {
                const isSelected = selectedEmail?.id === email.id;
                const sender = email.from.emailAddress;

                return (
                  <ListItem
                    key={email.id}
                    onClick={() => onEmailSelect(email)}
                    sx={{
                      cursor: 'pointer',
                      bgcolor: isSelected ? 'action.selected' : 'transparent',
                      '&:hover': {
                        bgcolor: 'action.hover'
                      },
                      borderLeft: isSelected ? 4 : 0,
                      borderColor: 'primary.main',
                      flexDirection: 'column',
                      alignItems: 'stretch',
                      py: 2
                    }}
                  >
                    {/* Email Header */}
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 1 }}>
                      <ListItemAvatar sx={{ minWidth: 40 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: isSelected ? 'primary.main' : 'grey.300' }}>
                          {sender.name ? sender.name.charAt(0).toUpperCase() : <EmailIcon fontSize="small" />}
                        </Avatar>
                      </ListItemAvatar>

                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: 8 }}>
                            <Typography variant="subtitle2" noWrap sx={{ flex: 1 }}>
                              {sender.name || sender.address}
                            </Typography>
                            {email.importance === 'high' && (
                              <StarIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                            )}
                            {email.hasAttachments && (
                              <AttachmentIcon sx={{ fontSize: 16, color: 'action.disabled' }} />
                            )}
                            {!email.isRead && (
                              <Chip
                                label="New"
                                size="small"
                                sx={{
                                  height: 16,
                                  fontSize: '0.65rem',
                                  bgcolor: 'primary.main',
                                  color: 'white'
                                }}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            {formatDateTime(email.receivedDateTime)}
                          </Typography>
                        }
                      />

                      {/* Preview Button */}
                      <Box sx={{ ml: 'auto' }}>
                        <Tooltip title="Preview Email">
                          <IconButton
                            size="small"
                            onClick={(e) => handlePreviewClick(email, e)}
                            sx={{ color: 'action.active' }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>

                    {/* Email Subject and Snippet */}
                    <Box sx={{ pl: 5 }}>
                      <Typography variant="body2" sx={{
                        fontWeight: email.isRead ? 'normal' : 'medium',
                        mb: 0.5
                      }}>
                        {email.subject}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          lineHeight: 1.4
                        }}
                      >
                        {email.bodyPreview || email.body?.content?.substring(0, 150) || 'No preview available'}
                      </Typography>
                    </Box>
                  </ListItem>
                );
              })}

              {/* Loading more indicator */}
              {loadingMore && (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              )}

              {/* Load more prompt */}
              {!loadingMore && hasMore && emails.length > 0 && (
                <Box sx={{ textAlign: 'center', p: 2, color: 'text.secondary' }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Scroll down to load more emails
                  </Typography>
                  {/* Debug button - remove in production */}
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => onLoadMore && onLoadMore()}
                    sx={{ fontSize: '0.7rem' }}
                  >
                    Load More (Debug)
                  </Button>
                </Box>
              )}
            </List>
          )}
        </Box>
      </Box>

      {/* Email Preview Dialog */}
      <EmailPreviewDialog
        open={previewDialogOpen}
        onClose={handleClosePreview}
        email={previewEmail}
      />
    </Box>
  );
};

export default EmailListComponent;
