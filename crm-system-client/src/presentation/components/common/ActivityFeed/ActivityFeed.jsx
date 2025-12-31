import React, { useMemo, useRef, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Collapse,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
  useMediaQuery
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  MoreVert as MoreVertIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Assignment as AssignmentIcon,
  Event as EventIcon,
  Notes as NotesIcon,
  Description as DescriptionIcon,
  AttachFile as AttachFileIcon,
  Close as CloseIcon,
  Visibility as VisibilityIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import AddActivityForm from '../../common/ActivityForms/AddActivityForm';
import ActivityAttachmentList from './ActivityAttachmentList';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { ACTIVITY_CATEGORIES } from '../../../../utils/constants';

dayjs.extend(relativeTime);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

// Helper function to format activity start/end times
const formatActivityTime = (activity, field) => {
  // Check for both camelCase and snake_case variants
  const value = activity[field] || activity[field.replace(/[A-Z]/g, '_$&').toLowerCase()];
  if (!value) return null;

  try {
    return dayjs(value).format('YYYY-MM-DD HH:mm');
  } catch {
    return null;
  }
};

const formatEmailTimestamp = (email) => {
  const ts = email?.receivedDateTime || email?.sentDateTime || email?.createdDateTime || email?.createdOn;
  if (!ts) return '';
  try {
    return dayjs(ts).format('YYYY-MM-DD HH:mm');
  } catch {
    return '';
  }
};

const normalizeActivityAttachments = (activity) => {
  if (!activity) return [];

  const attachments = Array.isArray(activity.attachments)
    ? activity.attachments
    : Array.isArray(activity.activityAttachments)
      ? activity.activityAttachments
      : [];

  const sharepointFiles = Array.isArray(activity.sharepointFiles)
    ? activity.sharepointFiles
    : Array.isArray(activity.sharepoint_files)
      ? activity.sharepoint_files
      : [];

  const additionalFiles = Array.isArray(activity.files) ? activity.files : [];

  const combined = [...attachments, ...sharepointFiles, ...additionalFiles];

  return combined.map((item, index) => {
    const name = item.fileName || item.name || item.title || item.originalName || item.displayName || 'Unnamed file';
    const url = item.fileUrl || item.url || item.webUrl || item.downloadUrl || item.path || item.filePath || null;
    const size = item.fileSize ?? item.size ?? item.sizeBytes ?? item.length ?? item.contentLength;
    const mimeType = item.mimeType || item.contentType || item.fileType;
    const source = item.source || (item.webUrl ? 'sharepoint' : undefined);

    return {
      id: item.id || item.attachmentId || item.sharepointId || item.driveItemId || item.driveId || `att-${index}`,
      idRef: item.idRef || item.IdRef,
      name,
      url,
      size,
      mimeType,
      source
    };
  });
};

// Email Detail Dialog Component
const EmailDetailDialog = ({
  open,
  email,
  onClose,
  theme
}) => {
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  if (!email) return null;

  const from = email.fromAddress || email.senderAddress || email.fromName || 'Unknown sender';
  const subject = email.subject || 'No subject';
  const body = email.bodyContent || email.bodyPreview || '';
  const ts = formatEmailTimestamp(email);

  const isHtml = body && /<\/?[a-z][\s\S]*>/i.test(body);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={isMobile}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 2,
          maxHeight: '85vh',
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
              {subject}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              From: {from}{ts ? ` • ${ts}` : ''}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ bgcolor: 'background.default' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {email.toRecipients && (
            <Typography variant="body2" color="text.secondary">
              To: {typeof email.toRecipients === 'string' ? email.toRecipients : JSON.stringify(email.toRecipients)}
            </Typography>
          )}
          {email.ccRecipients && (
            <Typography variant="body2" color="text.secondary">
              Cc: {typeof email.ccRecipients === 'string' ? email.ccRecipients : JSON.stringify(email.ccRecipients)}
            </Typography>
          )}
          <Divider />
          <Box sx={{ color: 'text.primary', fontSize: '0.9rem', lineHeight: 1.5 }}>
            {isHtml ? (
              <span dangerouslySetInnerHTML={{ __html: body }} />
            ) : (
              body || 'No content'
            )}
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

// Activity Detail Dialog Component
const ActivityDetailDialog = ({
  open,
  activity,
  user,
  onClose,
  renderDescription,
  theme
}) => {
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (!activity) return null;

  const attachments = normalizeActivityAttachments(activity);
  const category = activity.sourceFrom || activity.type || 'default';
  const categoryType = (() => {
    const src = (activity?.sourceFrom || '').toLowerCase();
    const typ = (activity?.type || '').toLowerCase();
    if (src.includes('email') || typ === 'email') return ACTIVITY_CATEGORIES.EMAIL;
    if (src.includes('phone-call') || typ === 'call') return ACTIVITY_CATEGORIES.CALL;
    if (src.includes('meeting') || typ === 'meeting' || typ === 'meeting-online' || typ === 'meeting-offline') return ACTIVITY_CATEGORIES.MEETING;
    if (src.includes('task') || typ === 'task') return ACTIVITY_CATEGORIES.TASK;
    if (src.includes('note') || typ === 'note') return ACTIVITY_CATEGORIES.NOTE;
    if (src.includes('contract') || typ === 'contract') return ACTIVITY_CATEGORIES.CONTRACT;
    return ACTIVITY_CATEGORIES.EMAIL;
  })();

  const iconConfig = (() => {
    switch (categoryType) {
      case ACTIVITY_CATEGORIES.EMAIL:
        return { icon: <EmailIcon fontSize="small" />, bg: theme.palette.success.lighter, color: theme.palette.success.main };
      case ACTIVITY_CATEGORIES.CALL:
        return { icon: <PhoneIcon fontSize="small" />, bg: theme.palette.warning.lighter, color: theme.palette.warning.main };
      case ACTIVITY_CATEGORIES.MEETING:
        return { icon: <EventIcon fontSize="small" />, bg: theme.palette.info.lighter, color: theme.palette.info.main };
      case ACTIVITY_CATEGORIES.TASK:
        return { icon: <AssignmentIcon fontSize="small" />, bg: theme.palette.primary.lighter, color: theme.palette.primary.main };
      case ACTIVITY_CATEGORIES.NOTE:
        return { icon: <NotesIcon fontSize="small" />, bg: theme.palette.secondary.lighter, color: theme.palette.secondary.main };
      case ACTIVITY_CATEGORIES.CONTRACT:
        return { icon: <DescriptionIcon fontSize="small" />, bg: theme.palette.secondary.lighter, color: theme.palette.secondary.main };
      default:
        return { icon: <DescriptionIcon fontSize="small" />, bg: theme.palette.grey[200], color: theme.palette.text.secondary };
    }
  })();

  const activityDateTime = dayjs(activity.createdOn);
  const formattedDate = activityDateTime.format('DD MMM YYYY');
  const formattedTime = activityDateTime.format('HH:mm');

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={isMobile}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 2,
          maxHeight: isMobile ? '100vh' : '80vh',
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                bgcolor: iconConfig.bg,
                color: iconConfig.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {iconConfig.icon}
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem', lineHeight: 1.3 }}>
                {activity.subject}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formattedDate} at {formattedTime}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 1, pb: 2, overflow: 'auto' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* User info */}
          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {user.firstName} {user.lastName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                performed this activity
              </Typography>
            </Box>
          )}

          {/* Start/End times */}
          {(() => {
            const startTime = formatActivityTime(activity, 'startAt');
            const endTime = formatActivityTime(activity, 'endAt');

            if (!startTime && !endTime) return null;

            return (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Schedule:
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {startTime && endTime ? (
                    `${startTime} - ${endTime}`
                  ) : startTime ? (
                    `Start: ${startTime}`
                  ) : (
                    `End: ${endTime}`
                  )}
                </Typography>
              </Box>
            );
          })()}

          {/* Custom description if provided */}
          {renderDescription && (
            <Box sx={{ mb: 1 }}>
              {renderDescription({ activity, user, theme })}
            </Box>
          )}

          {/* Activity body */}
          {activity.body && (
            <Box>
              <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                {activity.body && /<\/?[a-z][\s\S]*>/i.test(activity.body) ? (
                  <span dangerouslySetInnerHTML={{ __html: activity.body }} />
                ) : (
                  activity.body
                )}
              </Typography>
            </Box>
          )}

          {/* Attachments */}
          {attachments.length > 0 && (
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Attachments
              </Typography>
              <ActivityAttachmentList items={attachments} variant="dialog" sx={{ mt: 1 }} />
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

const ActivityFeed = ({
  title = 'Activity Feed',
  activities = [],
  entityType = 'deal',
  entityId,
  getUserById, // function(userId) => user | null
  onActivityCreated, // function(newActivity)
  onActivityError, // function(error) => void - called when activity creation fails
  renderDescription, // function({ activity, user, theme }) => JSX
  dense = false, // boolean: enable compact/dense mode
  maxHeight = 360 // number: max height of scrollable list in px
}) => {
  const theme = useTheme();
  const navigate = useNavigate();

  // Helper function to detect if content contains HTML
  const containsHtml = (str) => {
    return str && /<\/?[a-z][\s\S]*>/i.test(str);
  };

  // Handle activity item click
  const handleActivityClick = (activityId) => {
    navigate(`/activities/${activityId}`);
  };

  const [activityFeedExpanded, setActivityFeedExpanded] = useState(true);
  const [isAddActivityFormOpen, setIsAddActivityFormOpen] = useState(false);
  const [activityFilter, setActivityFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('any');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedBodies, setExpandedBodies] = useState(new Set());
  const [expandedCards, setExpandedCards] = useState(new Set());
  const addFormRef = useRef(null);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [editingActivity, setEditingActivity] = useState(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState(null);

  const getActivityCategory = (activity) => {
    const src = (activity?.sourceFrom || '').toLowerCase();
    const typ = (activity?.type || '').toLowerCase();
    if (src.includes('email') || typ === 'email') return ACTIVITY_CATEGORIES.EMAIL;
    if (src.includes('phone-call') || typ === 'call') return ACTIVITY_CATEGORIES.CALL;
    if (src.includes('meeting') || typ === 'meeting' || typ === 'meeting-online' || typ === 'meeting-offline') return ACTIVITY_CATEGORIES.MEETING;
    if (src.includes('task') || typ === 'task') return ACTIVITY_CATEGORIES.TASK;
    if (src.includes('note') || typ === 'note') return ACTIVITY_CATEGORIES.NOTE;
    return ACTIVITY_CATEGORIES.EMAIL;
  };

  const categoryCounts = useMemo(() => {
    const counts = {
      [ACTIVITY_CATEGORIES.EMAIL]: 0,
      [ACTIVITY_CATEGORIES.CALL]: 0,
      [ACTIVITY_CATEGORIES.MEETING]: 0,
      [ACTIVITY_CATEGORIES.TASK]: 0,
      [ACTIVITY_CATEGORIES.NOTE]: 0
    };
    if (!activities) return counts;
    for (const a of activities) {
      const c = getActivityCategory(a);
      if (counts[c] !== undefined) counts[c] += 1;
    }
    return counts;
  }, [activities]);

  const filteredActivities = useMemo(() => {
    if (!activities) return [];
    let list = [...activities];

    if (activityFilter !== 'all') {
      list = list.filter((a) => getActivityCategory(a) === activityFilter);
    }

    if (timeFilter !== 'any') {
      const now = new Date();
      const normalizeStartOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const normalizeEndOfDay = (date) => {
        const end = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        end.setHours(23, 59, 59, 999);
        return end;
      };

      const todayStart = normalizeStartOfDay(now);
      const todayEnd = normalizeEndOfDay(now);
      const yesterdayStart = normalizeStartOfDay(new Date(todayStart));
      yesterdayStart.setDate(yesterdayStart.getDate() - 1);
      const yesterdayEnd = normalizeEndOfDay(new Date(yesterdayStart));
      const last7Start = normalizeStartOfDay(new Date(todayStart));
      last7Start.setDate(last7Start.getDate() - 6);
      const last30Start = normalizeStartOfDay(new Date(todayStart));
      last30Start.setDate(last30Start.getDate() - 29);

      list = list.filter((activity) => {
        const activityDate = new Date(activity.createdOn);
        if (Number.isNaN(activityDate.getTime())) return false;
        const t = activityDate.getTime();
        if (timeFilter === 'today') return t >= todayStart.getTime() && t <= todayEnd.getTime();
        if (timeFilter === 'yesterday') return t >= yesterdayStart.getTime() && t <= yesterdayEnd.getTime();
        if (timeFilter === 'last7') return t >= last7Start.getTime() && t <= todayEnd.getTime();
        if (timeFilter === 'last30') return t >= last30Start.getTime() && t <= todayEnd.getTime();
        if (timeFilter === 'custom') {
          // Placeholder for potential custom range using dayjs
          const from = null; // dayjs(customStart).startOf('day').toDate().getTime()
          const to = null;   // dayjs(customEnd).endOf('day').toDate().getTime()
          if (from !== null && to !== null) return t >= from && t <= to;
          if (from !== null) return t >= from;
          if (to !== null) return t <= to;
        }
        return true;
      });
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      list = list.filter((activity) => {
        const user = activity.createdBy && getUserById ? getUserById(activity.createdBy) : null;

        // Search in subject
        if (activity.subject?.toLowerCase().includes(query)) return true;

        // Search in body content
        if (activity.body) {
          const bodyText = containsHtml(activity.body)
            ? activity.body.replace(/<[^>]*>/g, '').toLowerCase()
            : activity.body.toLowerCase();
          if (bodyText.includes(query)) return true;
        }

        // Search in user name
        if (user && `${user.firstName} ${user.lastName}`.toLowerCase().includes(query)) return true;

        // Search in email subjects and senders
        if (activity.emails?.length > 0) {
          return activity.emails.some(email =>
            email.subject?.toLowerCase().includes(query) ||
            email.fromAddress?.toLowerCase().includes(query) ||
            email.senderAddress?.toLowerCase().includes(query)
          );
        }

        return false;
      });
    }

    return list;
  }, [activities, activityFilter, timeFilter, searchQuery, getUserById]);

  // Group activities by date for timeline display
  const groupedActivities = useMemo(() => {
    if (!filteredActivities || filteredActivities.length === 0) return [];

    // Sort activities by date (newest first)
    const sorted = [...filteredActivities].sort((a, b) => {
      return new Date(b.createdOn) - new Date(a.createdOn);
    });

    // Group by date
    const groups = {};
    sorted.forEach((activity) => {
      const activityDate = dayjs(activity.createdOn);
      const today = dayjs().startOf('day');
      const yesterday = dayjs().subtract(1, 'day').startOf('day');
      
      let dateKey;
      let dateLabel;
      
      if (activityDate.isSame(today, 'day')) {
        dateKey = 'today';
        dateLabel = 'Today';
      } else if (activityDate.isSame(yesterday, 'day')) {
        dateKey = 'yesterday';
        dateLabel = 'Yesterday';
      } else {
        dateKey = activityDate.format('YYYY-MM-DD');
        dateLabel = activityDate.format('DD MMM YYYY');
      }

      if (!groups[dateKey]) {
        groups[dateKey] = {
          dateKey,
          dateLabel,
          date: activityDate.toDate(),
          activities: []
        };
      }

      groups[dateKey].activities.push(activity);
    });

    // Convert to array and sort by date
    return Object.values(groups).sort((a, b) => b.date - a.date);
  }, [filteredActivities]);

  const handleActivityFilterChange = (filter) => setActivityFilter(filter);
  const handleTimeFilterChange = (filter) => setTimeFilter(filter);

  // Dialog handlers
  const handleOpenDialog = (activity, user) => {
    setSelectedActivity({ activity, user });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedActivity(null);
  };

  const handleOpenEmailDialog = (email) => {
    setSelectedEmail(email);
    setEmailDialogOpen(true);
  };

  const handleCloseEmailDialog = () => {
    setEmailDialogOpen(false);
    setSelectedEmail(null);
  };

  const handleOpenEditDialog = (activity) => {
    setEditingActivity(activity);
    setIsAddActivityFormOpen(true);
    // Smoothly scroll the inline form into view when editing
    setTimeout(() => {
      addFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  };

  const handleFormCancel = () => {
    setIsAddActivityFormOpen(false);
    setEditingActivity(null);
  };

  const handleFormSubmit = (data, options = {}) => {
    if (options.error) {
      // Error case - call error callback if provided
      if (onActivityError) {
        onActivityError(data, options);
      } else {
        console.error('Activity creation failed:', data, options);
      }
    } else {
      // Success case - call the existing callback
      if (onActivityCreated) onActivityCreated(data, options);
    }
    setIsAddActivityFormOpen(false);
    setEditingActivity(null);
  };

  // Helper function to check if body content is too long
  const isBodyTooLong = (body) => {
    if (!body) return false;
    // Remove HTML tags for length calculation if HTML content
    const textContent = containsHtml(body) ? body.replace(/<[^>]*>/g, '') : body;
    return textContent.length > 200; // Show "more" button if longer than 200 characters
  };

  // Helper function to get truncated text
  const getTruncatedText = (body, maxLength = 200) => {
    if (!body) return '';
    const textContent = containsHtml(body) ? body.replace(/<[^>]*>/g, '') : body;
    if (textContent.length <= maxLength) return body;
    return containsHtml(body) ? body.substring(0, maxLength) + '...' : textContent.substring(0, maxLength) + '...';
  };

  // Toggle body expansion
  const toggleBodyExpansion = (activityId) => {
    setExpandedBodies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(activityId)) {
        newSet.delete(activityId);
      } else {
        newSet.add(activityId);
      }
      return newSet;
    });
  };

  // Toggle card expansion (show more/less)
  const toggleCardExpansion = (activityId) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(activityId)) {
        newSet.delete(activityId);
      } else {
        newSet.add(activityId);
      }
      return newSet;
    });
  };

  return (
    <Card>
      <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: activityFeedExpanded ? 2 : 0 }}>
          <Box
            sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', flex: 1, '&:hover': { opacity: 0.7 } }}
            onClick={() => setActivityFeedExpanded(!activityFeedExpanded)}
          >
            <IconButton size="small" sx={{ p: 0.5, pointerEvents: 'none' }}>
              {activityFeedExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </IconButton>
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
              {title}
            </Typography>
          </Box>

          {/* Search Input */}
          <Collapse in={activityFeedExpanded} orientation="horizontal" timeout="auto">
            <TextField
              size="small"
              placeholder="Search activities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{
                width: { xs: 150, sm: 200 },
                mr: 1,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '20px',
                  bgcolor: 'background.paper'
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
            />
          </Collapse>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton
              size="small"
              onClick={() => {
                setEditingActivity(null);
                setIsAddActivityFormOpen((prev) => !prev);
              }}
              sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '4px' }}
            >
              <AddIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '4px' }}>
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        <Collapse in={activityFeedExpanded} timeout="auto" unmountOnExit>
          {/* Add Activity */}
          <Collapse in={isAddActivityFormOpen} timeout="auto">
            <Box
              ref={addFormRef}
              sx={{ pb: 2, mb: 2, borderBottom: '1px solid', borderColor: 'divider' }}
            >
              <AddActivityForm
                key={editingActivity ? editingActivity.id : 'new-activity'}
                initialData={editingActivity || undefined}
                onCancel={handleFormCancel}
                onSubmit={handleFormSubmit}
                relationType={entityType}
                relationId={entityId}
              />
            </Box>
          </Collapse>

          {/* Filters */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, gap: 1.5, flexWrap: 'wrap' }}>
            {/* Type */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>Show:</Typography>
              <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                <Chip label="All" size="small" variant={activityFilter === 'all' ? 'filled' : 'outlined'} onClick={() => handleActivityFilterChange('all')} sx={{ borderRadius: '16px', bgcolor: activityFilter === 'all' ? 'primary.main' : undefined, color: activityFilter === 'all' ? 'white' : undefined, '&:hover': { bgcolor: activityFilter === 'all' ? 'primary.dark' : undefined } }} />
                <Chip
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <span>Email</span>
                      <span sx={{ display: { xs: 'none', sm: 'inline' } }}>
                        ({categoryCounts[ACTIVITY_CATEGORIES.EMAIL]})
                      </span>
                    </Box>
                  }
                  size="small"
                  variant={activityFilter === ACTIVITY_CATEGORIES.EMAIL ? 'filled' : 'outlined'}
                  onClick={() => handleActivityFilterChange(ACTIVITY_CATEGORIES.EMAIL)}
                  sx={{ borderRadius: '16px', bgcolor: activityFilter === ACTIVITY_CATEGORIES.EMAIL ? 'primary.main' : undefined, color: activityFilter === ACTIVITY_CATEGORIES.EMAIL ? 'white' : undefined, '&:hover': { bgcolor: activityFilter === ACTIVITY_CATEGORIES.EMAIL ? 'primary.dark' : undefined } }}
                />
                <Chip
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <span>Call</span>
                      <span sx={{ display: { xs: 'none', sm: 'inline' } }}>
                        ({categoryCounts[ACTIVITY_CATEGORIES.CALL]})
                      </span>
                    </Box>
                  }
                  size="small"
                  variant={activityFilter === ACTIVITY_CATEGORIES.CALL ? 'filled' : 'outlined'}
                  onClick={() => handleActivityFilterChange(ACTIVITY_CATEGORIES.CALL)}
                  sx={{ borderRadius: '16px', bgcolor: activityFilter === ACTIVITY_CATEGORIES.CALL ? 'primary.main' : undefined, color: activityFilter === ACTIVITY_CATEGORIES.CALL ? 'white' : undefined, '&:hover': { bgcolor: activityFilter === ACTIVITY_CATEGORIES.CALL ? 'primary.dark' : undefined } }}
                />
                <Chip
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <span>Meeting</span>
                      <span sx={{ display: { xs: 'none', sm: 'inline' } }}>
                        ({categoryCounts[ACTIVITY_CATEGORIES.MEETING]})
                      </span>
                    </Box>
                  }
                  size="small"
                  variant={activityFilter === ACTIVITY_CATEGORIES.MEETING ? 'filled' : 'outlined'}
                  onClick={() => handleActivityFilterChange(ACTIVITY_CATEGORIES.MEETING)}
                  sx={{ borderRadius: '16px', bgcolor: activityFilter === ACTIVITY_CATEGORIES.MEETING ? 'primary.main' : undefined, color: activityFilter === ACTIVITY_CATEGORIES.MEETING ? 'white' : undefined, '&:hover': { bgcolor: activityFilter === ACTIVITY_CATEGORIES.MEETING ? 'primary.dark' : undefined } }}
                />
                <Chip
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <span>Note</span>
                      <span sx={{ display: { xs: 'none', sm: 'inline' } }}>
                        ({categoryCounts[ACTIVITY_CATEGORIES.NOTE]})
                      </span>
                    </Box>
                  }
                  size="small"
                  variant={activityFilter === ACTIVITY_CATEGORIES.NOTE ? 'filled' : 'outlined'}
                  onClick={() => handleActivityFilterChange(ACTIVITY_CATEGORIES.NOTE)}
                  sx={{ borderRadius: '16px', bgcolor: activityFilter === ACTIVITY_CATEGORIES.NOTE ? 'primary.main' : undefined, color: activityFilter === ACTIVITY_CATEGORIES.NOTE ? 'white' : undefined, '&:hover': { bgcolor: activityFilter === ACTIVITY_CATEGORIES.NOTE ? 'primary.dark' : undefined } }}
                />
                <Chip
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <span>Contract</span>
                      <span sx={{ display: { xs: 'none', sm: 'inline' } }}>
                        ({categoryCounts[ACTIVITY_CATEGORIES.CONTRACT]})
                      </span>
                    </Box>
                  }
                  size="small"
                  variant={activityFilter === ACTIVITY_CATEGORIES.CONTRACT ? 'filled' : 'outlined'}
                  onClick={() => handleActivityFilterChange(ACTIVITY_CATEGORIES.CONTRACT)}
                  sx={{ borderRadius: '16px', bgcolor: activityFilter === ACTIVITY_CATEGORIES.CONTRACT ? 'primary.main' : undefined, color: activityFilter === ACTIVITY_CATEGORIES.CONTRACT ? 'white' : undefined, '&:hover': { bgcolor: activityFilter === ACTIVITY_CATEGORIES.CONTRACT ? 'primary.dark' : undefined } }}
                />
              </Box>
            </Box>
            {/* Time */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip label="Any time" size="small" variant={timeFilter === 'any' ? 'filled' : 'outlined'} onClick={() => handleTimeFilterChange('any')} sx={{ borderRadius: '16px', bgcolor: timeFilter === 'any' ? 'primary.main' : undefined, color: timeFilter === 'any' ? 'white' : undefined, '&:hover': { bgcolor: timeFilter === 'any' ? 'primary.dark' : undefined } }} />
              <Chip label="Today" size="small" variant={timeFilter === 'today' ? 'filled' : 'outlined'} onClick={() => handleTimeFilterChange('today')} sx={{ borderRadius: '16px', bgcolor: timeFilter === 'today' ? 'primary.main' : undefined, color: timeFilter === 'today' ? 'white' : undefined, '&:hover': { bgcolor: timeFilter === 'today' ? 'primary.dark' : undefined } }} />
              <Chip label="Yesterday" size="small" variant={timeFilter === 'yesterday' ? 'filled' : 'outlined'} onClick={() => handleTimeFilterChange('yesterday')} sx={{ borderRadius: '16px', bgcolor: timeFilter === 'yesterday' ? 'primary.main' : undefined, color: timeFilter === 'yesterday' ? 'white' : undefined, '&:hover': { bgcolor: timeFilter === 'yesterday' ? 'primary.dark' : undefined } }} />
              <Chip label="Last 7 days" size="small" variant={timeFilter === 'last7' ? 'filled' : 'outlined'} onClick={() => handleTimeFilterChange('last7')} sx={{ borderRadius: '16px', bgcolor: timeFilter === 'last7' ? 'primary.main' : undefined, color: timeFilter === 'last7' ? 'white' : undefined, '&:hover': { bgcolor: timeFilter === 'last7' ? 'primary.dark' : undefined } }} />
              <Chip label="Last 30 days" size="small" variant={timeFilter === 'last30' ? 'filled' : 'outlined'} onClick={() => handleTimeFilterChange('last30')} sx={{ borderRadius: '16px', bgcolor: timeFilter === 'last30' ? 'primary.main' : undefined, color: timeFilter === 'last30' ? 'white' : undefined, '&:hover': { bgcolor: timeFilter === 'last30' ? 'primary.dark' : undefined } }} />
            </Box>
          </Box>

          <Divider />

          {/* Timeline Activities List */}
          {groupedActivities.length > 0 ? (
            <Box sx={{ maxHeight: `${maxHeight}px`, overflowY: 'auto', pr: 2, mt: 2 }}>
              {groupedActivities.map((group, groupIndex) => (
                <Box key={group.dateKey} sx={{ mb: groupIndex < groupedActivities.length - 1 ? 2 : 0 }}>
                  {/* Date Header */}
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: { xs: 1, sm: 2 },
                    mb: 1.5,
                    position: 'sticky',
                    top: 0,
                    bgcolor: 'background.paper',
                    zIndex: 1,
                    py: 1
                  }}>
                    <Typography 
                      variant="subtitle2" 
                      sx={{ 
                        fontWeight: 700,
                        color: 'text.primary',
                        minWidth: { xs: '80px', sm: '120px' },
                        fontSize: { xs: '0.85rem', sm: '0.875rem' }
                      }}
                    >
                      {group.dateLabel}
                    </Typography>
                    <Divider sx={{ flex: 1 }} />
                    <Chip 
                      label={`${group.activities.length} ${group.activities.length === 1 ? 'activity' : 'activities'}`}
                      size="small"
                      sx={{ 
                        height: '20px',
                        fontSize: { xs: '0.65rem', sm: '0.7rem' },
                        bgcolor: theme.palette.grey[100],
                        color: 'text.secondary',
                        display: { xs: 'none', sm: 'inline-flex' }
                      }}
                    />
                  </Box>

                  {/* Activities in this date group */}
                  <Box sx={{ position: 'relative' }}>
                    {group.activities.map((activity, activityIndex) => {
                      const activityUser = activity.created_by && getUserById ? getUserById(activity.created_by) : null;
                      const category = getActivityCategory(activity);
                      const attachmentItems = normalizeActivityAttachments(activity);
                      const iconConfig = (() => {
                        switch (category) {
                          case ACTIVITY_CATEGORIES.EMAIL:
                            return { icon: <EmailIcon fontSize="small" />, bg: theme.palette.success.lighter, color: theme.palette.success.main };
                          case ACTIVITY_CATEGORIES.CALL:
                            return { icon: <PhoneIcon fontSize="small" />, bg: theme.palette.warning.lighter, color: theme.palette.warning.main };
                          case ACTIVITY_CATEGORIES.MEETING:
                            return { icon: <EventIcon fontSize="small" />, bg: theme.palette.info.lighter, color: theme.palette.info.main };
                          case ACTIVITY_CATEGORIES.TASK:
                            return { icon: <AssignmentIcon fontSize="small" />, bg: theme.palette.primary.lighter, color: theme.palette.primary.main };
                          case ACTIVITY_CATEGORIES.NOTE:
                            return { icon: <NotesIcon fontSize="small" />, bg: theme.palette.secondary.lighter, color: theme.palette.secondary.main };
                          default:
                            return { icon: <DescriptionIcon fontSize="small" />, bg: theme.palette.grey[200], color: theme.palette.text.secondary };
                        }
                      })();
                      const activityTime = dayjs(activity.createdOn).format('HH:mm');

                      return (
                        <Box
                          key={activity.id}
                          sx={{
                            display: 'flex',
                            gap: { xs: 0.75, sm: 1.5 },
                            mb: activityIndex < group.activities.length - 1 ? 2 : 0,
                            position: 'relative'
                          }}
                        >
                          {/* Timeline column */}
                          <Box sx={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center',
                            position: 'relative',
                            width: { xs: '44px', sm: '48px' },
                            flexShrink: 0
                          }}>
                            {/* Time label */}
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                color: 'text.secondary',
                                fontWeight: 500,
                                mb: 0.5,
                                fontSize: '0.7rem'
                              }}
                            >
                              {activityTime}
                            </Typography>

                            {/* Icon node */}
                            <Box 
                              sx={{ 
                                width: { xs: 32, sm: 36 },
                                height: { xs: 32, sm: 36 }, 
                                borderRadius: '50%', 
                                bgcolor: iconConfig.bg, 
                                color: iconConfig.color, 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                border: `3px solid ${theme.palette.background.paper}`,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                position: 'relative',
                                zIndex: 2
                              }}
                            >
                              {iconConfig.icon}
                            </Box>

                            {/* Connector line */}
                            {activityIndex < group.activities.length - 1 && (
                              <Box 
                                sx={{ 
                                  width: '1.5px',
                                  flex: 1,
                                  bgcolor: theme.palette.grey[300],
                                  position: 'absolute',
                                  top: { xs: '50px', sm: '54px' },
                                  bottom: '-24px',
                                  left: '50%',
                                  transform: 'translateX(-50%)',
                                  zIndex: 1
                                }}
                              />
                            )}
                          </Box>

                          {/* Activity card */}
                          <Box 
                            sx={{ 
                              flex: 1,
                              minWidth: 0,
                              cursor: 'pointer',
                              borderRadius: 1,
                              border: `1px solid ${theme.palette.grey[200]}`,
                              bgcolor: 'background.paper',
                              p: { xs: 1, sm: 1.25 },
                              transition: 'all 0.2s',
                              '&:hover': {
                                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                borderColor: theme.palette.primary.main,
                                transform: 'translateY(-2px)'
                              }
                            }}
                            onClick={() => handleActivityClick(activity.id)}
                          >
                            {/* Card Header */}
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 0.75 }}>
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.25, lineHeight: 1.4 }}>
                                  {activity.subject}
                                </Typography>

                                {/* Description (customizable) */}
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', lineHeight: 1.4 }}>
                                  {renderDescription ? renderDescription({ activity, user: activityUser, theme }) : (
                                    <>
                                      {activityUser && (
                                        <>
                                          {activityUser.firstName} {activityUser.lastName}{' '}performed an activity
                                        </>
                                      )}
                                    </>
                                  )}
                                </Typography>

                                {/* Inline email sub-items */}
                                {activity.emails?.length > 0 && (
                                  <Box sx={{ mt: 0.75, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                                      Emails ({activity.emails.length})
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4 }}>
                                      {activity.emails.slice(0, 3).map((email) => (
                                        <Box
                                          key={email.id || email.mailId}
                                          sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 0.6,
                                            p: 0.6,
                                            borderRadius: 1,
                                            border: `1px solid ${theme.palette.grey[200]}`,
                                            bgcolor: theme.palette.background.default
                                          }}
                                        >
                                          <EmailIcon sx={{ fontSize: 15, color: theme.palette.success.main }} />
                                          <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Typography variant="body2" sx={{ fontSize: '0.78rem', fontWeight: 600, lineHeight: 1.2 }}>
                                              {email.subject || 'No subject'}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                                              From: {email.fromAddress || email.senderAddress || 'Unknown sender'}
                                            </Typography>
                                          </Box>
                                          <IconButton
                                            size="small"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleOpenEmailDialog(email);
                                            }}
                                            sx={{ p: 0.5 }}
                                            title="View email"
                                          >
                                            <VisibilityIcon fontSize="inherit" />
                                          </IconButton>
                                          {formatEmailTimestamp(email) && (
                                            <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap', fontSize: '0.7rem' }}>
                                              {formatEmailTimestamp(email)}
                                            </Typography>
                                          )}
                                        </Box>
                                      ))}
                                      {activity.emails.length > 3 && (
                                        <Typography variant="caption" color="text.secondary">
                                          +{activity.emails.length - 3} more
                                        </Typography>
                                      )}
                                    </Box>
                                  </Box>
                                )}

                                {/* Start/End times */}
                                {(() => {
                                  const startTime = formatActivityTime(activity, 'startAt');
                                  const endTime = formatActivityTime(activity, 'endAt');

                                  if (!startTime && !endTime) return null;

                                  return (
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', ml: 0.5, mt: 0.25 }}>
                                      {startTime && endTime ? (
                                        `${startTime} - ${endTime}`
                                      ) : startTime ? (
                                        `Start: ${startTime}`
                                      ) : (
                                        `End: ${endTime}`
                                      )}
                                    </Typography>
                                  );
                                })()}
                              </Box>

                              {/* Show More/Less Button */}
                              <IconButton
                                size="small"
                                sx={{
                                  mr: 0.5,
                                  border: '1px solid',
                                  borderColor: 'divider',
                                  borderRadius: '4px',
                                  '&:hover': {
                                    bgcolor: 'action.hover',
                                    borderColor: 'primary.main'
                                  }
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleCardExpansion(activity.id);
                                }}
                                title={expandedCards.has(activity.id) ? 'Show less' : 'Show more'}
                              >
                                {expandedCards.has(activity.id) ? (
                                  <ExpandLessIcon fontSize="small" />
                                ) : (
                                  <ExpandMoreIcon fontSize="small" />
                                )}
                              </IconButton>

                              {/* Edit Button */}
                              <IconButton
                                size="small"
                                sx={{
                                  mr: 0.5,
                                  border: '1px solid',
                                  borderColor: 'divider',
                                  borderRadius: '4px',
                                  '&:hover': {
                                    bgcolor: 'primary.main',
                                    color: 'white',
                                    borderColor: 'primary.main'
                                  }
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEditDialog(activity);
                                }}
                                title="Edit activity"
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>

                              {/* View Detail Button */}
                              <IconButton
                                size="small"
                                sx={{
                                  mr: 0.5,
                                  border: '1px solid',
                                  borderColor: 'divider',
                                  borderRadius: '4px',
                                  '&:hover': {
                                    bgcolor: 'primary.main',
                                    color: 'white',
                                    borderColor: 'primary.main'
                                  }
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenDialog(activity, activityUser);
                                }}
                                title="View details"
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>

                              {/* More Options */}
                              <IconButton
                                size="small"
                                sx={{
                                  border: '1px solid',
                                  borderColor: 'divider',
                                  borderRadius: '4px',
                                  '&:hover': {
                                    bgcolor: 'action.hover'
                                  }
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertIcon fontSize="small" />
                              </IconButton>
                            </Box>

                            {/* Activity Body and Attachments - Collapsible */}
                            <Collapse in={expandedCards.has(activity.id)} timeout="auto" unmountOnExit>
                              {/* Activity Body */}
                              {activity.body && (
                                <Box sx={{ mt: 1 }}>
                                  <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem', lineHeight: 1.4 }}>
                                    {(() => {
                                      const isExpanded = expandedBodies.has(activity.id);
                                      const isLong = isBodyTooLong(activity.body);

                                      if (!isLong || isExpanded) {
                                        // Show full content
                                        return containsHtml(activity.body) ? (
                                          <span dangerouslySetInnerHTML={{ __html: activity.body }} />
                                        ) : (
                                          activity.body
                                        );
                                      } else {
                                        // Show truncated content
                                        const truncated = getTruncatedText(activity.body);
                                        return containsHtml(truncated) ? (
                                          <span dangerouslySetInnerHTML={{ __html: truncated }} />
                                        ) : (
                                          truncated
                                        );
                                      }
                                    })()}
                                  </Typography>
                                  {isBodyTooLong(activity.body) && (
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        color: 'primary.main',
                                        cursor: 'pointer',
                                        mt: 0.5,
                                        display: 'inline-block',
                                        fontWeight: 600,
                                        '&:hover': { textDecoration: 'underline' }
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleBodyExpansion(activity.id);
                                      }}
                                    >
                                      {expandedBodies.has(activity.id) ? 'Show less' : 'Show more'}
                                    </Typography>
                                  )}
                                </Box>
                              )}

                              {/* Attachments indicator when metadata exists but list is missing */}
                              {attachmentItems.length === 0 && activity.hasAttachment && (
                                <Box sx={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: 0.5, 
                                  mt: activity.body ? 1 : 0.5,
                                  pt: activity.body ? 1 : 0,
                                  borderTop: activity.body ? `1px solid ${theme.palette.grey[200]}` : 'none'
                                }}>
                                  <AttachFileIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                    {activity.attachmentCount || 1} attachment{(activity.attachmentCount || 1) > 1 ? 's' : ''}
                                  </Typography>
                                </Box>
                              )}
                              {attachmentItems.length > 0 && (
                                <Box
                                  sx={{
                                    mt: activity.body ? 1 : 0.5,
                                    pt: activity.body ? 1 : 0,
                                    borderTop: activity.body ? `1px solid ${theme.palette.grey[200]}` : 'none'
                                  }}
                                >
                                  <ActivityAttachmentList items={attachmentItems} variant="compact" />
                                </Box>
                              )}
                            </Collapse>
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              ))}
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant="body2" color="text.secondary">No activities in this filter criteria.</Typography>
            </Box>
          )}
        </Collapse>
      </CardContent>

      {/* Activity Detail Dialog */}
      <ActivityDetailDialog
        open={dialogOpen}
        activity={selectedActivity?.activity}
        user={selectedActivity?.user}
        onClose={handleCloseDialog}
        renderDescription={renderDescription}
        theme={theme}
      />

      {/* Email Detail Dialog */}
      <EmailDetailDialog
        open={emailDialogOpen}
        email={selectedEmail}
        onClose={handleCloseEmailDialog}
        theme={theme}
      />
    </Card>
  );
};

export default ActivityFeed;
