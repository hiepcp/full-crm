import React, { useState, useMemo, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Grid,
  Divider,
  Avatar,
  Breadcrumbs,
  Stack,
  Tabs,
  Tab,
  Button,
  Menu,
  MenuItem,
  IconButton,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControl,
  Select
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Schedule as ScheduleIcon,
  Description as DescriptionIcon,
  AttachFile as AttachFileIcon,
  MoreVert as MoreVertIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Add as AddIcon,
  Assignment as AssignmentIcon,
  Event as EventIcon,
  Notes as NotesIcon
} from '@mui/icons-material';
import { getEnrichedActivity, getActivitiesByRelation, getUserById } from '@presentation/data';
import { getStatusColor, getPriorityColor, getActivityTypeIcon } from './utils/activityUtils';
import { ACTIVITY_CATEGORIES } from '../../../utils/constants';
import { formatDate } from '../../../utils/formatDate';
import { formatDateTime } from '../../../utils/formatDateTime';
import { sanitizeHtml } from '../../../utils/htmlSanitize';

// Helper function to get activity category
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

// Helper function to get icon configuration for activity categories
const getIconConfig = (category, theme) => {
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
};

const ActivityDetail = () => {
  const theme = useTheme();
  const { id } = useParams();
  const navigate = useNavigate();
  const activityId = parseInt(id, 10);
  const [activity, setActivity] = useState(null);
  const [activityLoading, setActivityLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState(0);
  const [assignedUser, setAssignedUser] = useState(null);
  const [assignedUserLoading, setAssignedUserLoading] = useState(false);
  const [quickActionsAnchorEl, setQuickActionsAnchorEl] = useState(null);

  // Collapse states
  const [activityDetailsExpanded, setActivityDetailsExpanded] = useState(true);
  const [relatedRecordExpanded, setRelatedRecordExpanded] = useState(true);

  const [timeFilter, setTimeFilter] = useState('any');
  const [activityFilter, setActivityFilter] = useState('all');

  // Load activity data
  useEffect(() => {
    const loadActivity = async () => {
      try {
        setActivityLoading(true);
        const activityData = await getEnrichedActivity(activityId);
        setActivity(activityData);
      } catch (error) {
        console.error('Error loading activity:', error);
        setActivity(null);
      } finally {
        setActivityLoading(false);
      }
    };

    loadActivity();
  }, [activityId]);

  // Load assigned user when activity changes
  useEffect(() => {
    const loadAssignedUser = async () => {
      if (activity?.assignedTo && !assignedUser) {
        try {
          setAssignedUserLoading(true);
          const userData = await getUserById(activity.assignedTo);
          setAssignedUser(userData);
        } catch (error) {
          console.error('Error loading assigned user:', error);
          setAssignedUser(null);
        } finally {
          setAssignedUserLoading(false);
        }
      }
    };

    loadAssignedUser();
  }, [activity?.assignedTo, assignedUser]);

  // Get all activities related to the same entity (lead/contact/deal/customer)
  // TODO: Implement async loading of related activities
  const relatedActivities = useMemo(() => {
    if (!activity) return [];
    // Temporarily return empty array until async loading is implemented
    return [];
  }, [activity]);

  const filteredActivities = useMemo(() => {
    if (!relatedActivities) {
      return [];
    }

    let activities = [...relatedActivities];

    // Activity Type Filter
    if (activityFilter !== 'all') {
      activities = activities.filter(activity => {
        if (activityFilter === 'activities') {
          return activity.sourceFrom === 'note' || activity.sourceFrom === 'phone-call' || activity.type === 'note' || activity.type === 'call';
        }
        if (activityFilter === 'email') {
          return activity.sourceFrom === 'email' || activity.type === 'email';
        }
        if (activityFilter === 'system') {
          return activity.sourceFrom === 'system' || activity.type === 'system';
        }
        return false;
      });
    }

    // Time Period Filter
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);

    if (timeFilter !== 'any') {
      activities = activities.filter(activity => {
        const activityDate = new Date(activity.createdOn);
        const activityDay = new Date(activityDate.getFullYear(), activityDate.getMonth(), activityDate.getDate());

        if (timeFilter === 'today') {
          return activityDay.getTime() === today.getTime();
        }
        if (timeFilter === 'yesterday') {
          return activityDay.getTime() === yesterday.getTime();
        }
        return true;
      });
    }

    return activities;
  }, [relatedActivities, activityFilter, timeFilter]);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleQuickActionsMenuOpen = (event) => {
    setQuickActionsAnchorEl(event.currentTarget);
  };

  const handleQuickActionsMenuClose = () => {
    setQuickActionsAnchorEl(null);
  };

  const handleActivityFilterChange = (filter) => {
    setActivityFilter(filter);
  };

  const handleTimeFilterChange = (filter) => {
    setTimeFilter(filter);
  };

  if (activityLoading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Typography variant="h6" color="text.secondary">
          Loading activity...
        </Typography>
      </Box>
    );
  }

  if (!activity) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" color="error">
          Activity not found
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#f5f7fa', minHeight: '100vh' }}>
      {/* Breadcrumbs */}
      <Box sx={{ bgcolor: 'white', borderBottom: '1px solid #e5e7eb', px: 2, py: 1.5 }}>
        <Breadcrumbs sx={{ fontSize: '0.875rem' }}>
          <Link style={{ color: '#0176d3', textDecoration: 'none' }} to="/">Home</Link>
          <Link style={{ color: '#0176d3', textDecoration: 'none' }} to="/activities">Activities</Link>
          <Typography sx={{ fontSize: '0.875rem', color: '#3e3e3c' }}>{activity.subject}</Typography>
        </Breadcrumbs>
      </Box>

      {/* Header */}
      <Box sx={{ bgcolor: 'white', borderBottom: '1px solid #e5e7eb' }}>
        <Box sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>
          {/* Title Row */}
          <Box sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: 2,
            mb: 2
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
              <Avatar sx={{ bgcolor: '#0176d3', width: 40, height: 40 }}>
                {getIconConfig(getActivityCategory(activity), theme).icon}
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: '1rem', sm: '1.125rem' } }}>
                {activity.subject}
              </Typography>
              <Chip
                label={activity.status}
                size="small"
                color={getStatusColor(activity.status)}
              />
              <Chip
                label={activity.priority}
                size="small"
                color={getPriorityColor(activity.priority)}
              />
              <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
                ID: {activityId}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<EditIcon />}
                onClick={() => navigate(`/activities/${activityId}/edit`)}
              >
                Edit
              </Button>
              <IconButton size="small" sx={{ border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                <DeleteIcon />
              </IconButton>
              <IconButton size="small" sx={{ border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                <MoreVertIcon />
              </IconButton>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Two Column Layout */}
      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        gap: 2,
        p: { xs: 1, sm: 2 }
      }}>
        {/* Left - Activity Details */}
        <Box sx={{ flex: 1, width: { xs: '100%', md: 'auto' } }}>
          {/* Activity Details */}
          <Card sx={{ mb: 2 }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: activityDetailsExpanded ? 3 : 0 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    cursor: 'pointer',
                    flex: 1,
                    '&:hover': { opacity: 0.7 }
                  }}
                  onClick={() => setActivityDetailsExpanded(!activityDetailsExpanded)}
                >
                  <IconButton
                    size="small"
                    sx={{ p: 0.5, pointerEvents: 'none' }}
                  >
                    {activityDetailsExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                  </IconButton>
                  <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                    Activity Details
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton size="small" sx={{ border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" sx={{ border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
              <Collapse in={activityDetailsExpanded} timeout="auto" unmountOnExit>
                <Grid container spacing={0} sx={{ width: '100%', borderTop: '1px solid #e5e7eb' }}>
                  {/* Row 1 */}
                  <Grid item xs={12} sm={6} md={3} sx={{ flex: 1, borderRight: { md: '1px solid #e5e7eb' }, borderBottom: '1px solid #e5e7eb', p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Type
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" fontSize="1.25rem">{getIconConfig(getActivityCategory(activity), theme).icon}</Typography>
                      <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                        {getActivityCategory(activity)}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3} sx={{ flex: 1, borderRight: { md: '1px solid #e5e7eb' }, borderBottom: '1px solid #e5e7eb', p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Status
                    </Typography>
                    <Chip label={activity.status} color={getStatusColor(activity.status)} size="small" />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3} sx={{ flex: 1, borderRight: { md: '1px solid #e5e7eb' }, borderBottom: '1px solid #e5e7eb', p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Priority
                    </Typography>
                    <Chip label={activity.priority} color={getPriorityColor(activity.priority)} size="small" />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3} sx={{ flex: 1, borderBottom: '1px solid #e5e7eb', p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Created On
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>{formatDate(activity.createdOn)}</Typography>
                  </Grid>
                </Grid>

                {/* Row 2 */}
                <Grid container spacing={0} sx={{ width: '100%' }}>
                  <Grid item xs={12} sm={6} md={3} sx={{ flex: 1, borderRight: { md: '1px solid #e5e7eb' }, borderBottom: '1px solid #e5e7eb', p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Related To
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5, textTransform: 'capitalize' }}>
                      {activity.relationType} #{activity.relationId}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3} sx={{ flex: 1, borderRight: { md: '1px solid #e5e7eb' }, borderBottom: '1px solid #e5e7eb', p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Assigned To
                    </Typography>
                    <Typography variant="body2">{activity.assignedTo}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3} sx={{ flex: 1, borderRight: { md: '1px solid #e5e7eb' }, borderBottom: '1px solid #e5e7eb', p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Due Date
                    </Typography>
                    <Typography variant="body2">{activity.dueAt ? formatDate(activity.dueAt) : 'Not set'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3} sx={{ flex: 1, borderBottom: '1px solid #e5e7eb', p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Completed
                    </Typography>
                    <Typography variant="body2">{activity.completedAt ? formatDate(activity.completedAt) : 'Not completed'}</Typography>
                  </Grid>
                </Grid>
              </Collapse>
            </CardContent>
          </Card>

          {/* Activity Information */}
          <Card sx={{ mb: 2 }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>Activity Information</Typography>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 12 }}>
                  <Typography variant="caption" color="text.secondary">SUBJECT</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.5 }}>{activity.subject}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography variant="caption" color="text.secondary">SOURCE</Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, textTransform: 'capitalize' }}>
                    {getActivityCategory(activity)}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography variant="caption" color="text.secondary">ASSIGNED TO</Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>{activity.assignedTo}</Typography>
                </Grid>
                {activity.externalId && (
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant="caption" color="text.secondary">EXTERNAL ID</Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>{activity.externalId}</Typography>
                  </Grid>
                )}
                {/* {activity.conversationId && (
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant="caption" color="text.secondary">CONVERSATION ID</Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>{activity.conversationId}</Typography>
                  </Grid>
                )} */}
                <Grid size={{ xs: 12, sm: 12 }}>
                  <Typography variant="caption" color="text.secondary">DESCRIPTION</Typography>
                  {activity.body ? (
                    <Box
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(activity.body) }}
                      sx={{
                        mt: 0.5,
                        '& p': { margin: 0, marginBottom: '8px' },
                        '& p:last-child': { marginBottom: 0 },
                        '& ul, & ol': { paddingLeft: '20px', margin: '8px 0' },
                        '& li': { marginBottom: '4px' },
                        '& a': { color: 'primary.main', textDecoration: 'underline' },
                        '& strong, & b': { fontWeight: 'bold' },
                        '& em, & i': { fontStyle: 'italic' },
                        '& code': { backgroundColor: 'grey.100', padding: '2px 4px', borderRadius: '3px', fontFamily: 'monospace' },
                        '& pre': { backgroundColor: 'grey.100', padding: '8px', borderRadius: '4px', overflow: 'auto', fontFamily: 'monospace' }
                      }}
                    />
                  ) : (
                    <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary', fontStyle: 'italic' }}>
                      No description available
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Type-Specific Information */}
          <Card sx={{ mb: 2 }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                {getActivityCategory(activity) === ACTIVITY_CATEGORIES.EMAIL ? 'Email Details' :
                 getActivityCategory(activity) === ACTIVITY_CATEGORIES.CALL ? 'Call Details' :
                 getActivityCategory(activity) === ACTIVITY_CATEGORIES.MEETING ? 'Meeting Details' :
                 'Activity Details'}
              </Typography>
              <Grid container spacing={3}>
                {(() => {
                  const category = getActivityCategory(activity);

                  // Email specific fields
                  if (category === ACTIVITY_CATEGORIES.EMAIL) {
                    return (
                      <>
                        {activity.participants && activity.participants.length > 0 && (
                          <>
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <Typography variant="caption" color="text.secondary">FROM</Typography>
                              <Typography variant="body2" sx={{ mt: 0.5 }}>
                                {(() => {
                                  const sender = activity.participants.find(p => p.role === 'from');
                                  if (sender) {
                                    const name = sender.user ? `${sender.user.firstName} ${sender.user.lastName}` : sender.contact?.name || 'Unknown';
                                    const email = sender.contact?.email || sender.user?.email || '';
                                    return email ? `${name} (${email})` : name;
                                  }
                                  return 'Unknown sender';
                                })()}
                              </Typography>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <Typography variant="caption" color="text.secondary">TO</Typography>
                              <Typography variant="body2" sx={{ mt: 0.5 }}>
                                {activity.participants.filter(p => p.role === 'to').map(p => {
                                  const name = p.user ? `${p.user.firstName} ${p.user.lastName}` : p.contact?.name || 'Unknown';
                                  const email = p.contact?.email || p.user?.email || '';
                                  return email ? `${name} (${email})` : name;
                                }).join(', ') || 'No recipients'}
                              </Typography>
                            </Grid>
                          </>
                        )}
                        {activity.attachments && activity.attachments.length > 0 && (
                          <Grid size={{ xs: 12 }}>
                            <Typography variant="caption" color="text.secondary">ATTACHMENTS</Typography>
                            <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                              {activity.attachments.map((attachment, index) => (
                                <Chip
                                  key={index}
                                  icon={<AttachFileIcon />}
                                  label={`${attachment.fileName} (${(attachment.fileSize / 1024).toFixed(1)} KB)`}
                                  size="small"
                                  variant="outlined"
                                />
                              ))}
                            </Box>
                          </Grid>
                        )}
                      </>
                    );
                  }

                  // Call specific fields
                  if (category === ACTIVITY_CATEGORIES.CALL) {
                    return (
                      <>
                        {activity.callDuration && (
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="caption" color="text.secondary">DURATION</Typography>
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                              {Math.floor(activity.callDuration / 60)}:{(activity.callDuration % 60).toString().padStart(2, '0')} minutes
                            </Typography>
                          </Grid>
                        )}
                        {activity.callOutcome && (
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="caption" color="text.secondary">OUTCOME</Typography>
                            <Typography variant="body2" sx={{ mt: 0.5, textTransform: 'capitalize' }}>
                              {activity.callOutcome.replace('_', ' ')}
                            </Typography>
                          </Grid>
                        )}
                      </>
                    );
                  }

                  // Meeting specific fields
                  if (category === ACTIVITY_CATEGORIES.MEETING) {
                    return (
                      <>
                        {activity.startAt && (
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="caption" color="text.secondary">START TIME</Typography>
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                              {formatDateTime(activity.startAt)}
                            </Typography>
                          </Grid>
                        )}
                        {activity.endAt && (
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="caption" color="text.secondary">END TIME</Typography>
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                              {formatDateTime(activity.endAt)}
                            </Typography>
                          </Grid>
                        )}
                        {activity.participants && activity.participants.length > 0 && (
                          <Grid size={{ xs: 12 }}>
                            <Typography variant="caption" color="text.secondary">PARTICIPANTS</Typography>
                            <Box sx={{ mt: 0.5 }}>
                              {activity.participants.map((participant, index) => (
                                <Typography key={index} variant="body2" sx={{ mb: 0.5 }}>
                                  {participant.user?.firstName} {participant.user?.lastName} ({participant.role})
                                </Typography>
                              ))}
                            </Box>
                          </Grid>
                        )}
                      </>
                    );
                  }

                  // Default/Note/Task specific fields
                  return (
                    <>
                      {activity.body && (
                        <Grid size={{ xs: 12 }}>
                          <Typography variant="caption" color="text.secondary">DETAILS</Typography>
                          {activity.body ? (
                            <Box
                              dangerouslySetInnerHTML={{ __html: sanitizeHtml(activity.body) }}
                              sx={{
                                mt: 0.5,
                                '& p': { margin: 0, marginBottom: '8px' },
                                '& p:last-child': { marginBottom: 0 },
                                '& ul, & ol': { paddingLeft: '20px', margin: '8px 0' },
                                '& li': { marginBottom: '4px' },
                                '& a': { color: 'primary.main', textDecoration: 'underline' },
                                '& strong, & b': { fontWeight: 'bold' },
                                '& em, & i': { fontStyle: 'italic' },
                                '& code': { backgroundColor: 'grey.100', padding: '2px 4px', borderRadius: '3px', fontFamily: 'monospace' },
                                '& pre': { backgroundColor: 'grey.100', padding: '8px', borderRadius: '4px', overflow: 'auto', fontFamily: 'monospace' }
                              }}
                            />
                          ) : (
                            <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary', fontStyle: 'italic' }}>
                              No additional details available
                            </Typography>
                          )}
                        </Grid>
                      )}
                    </>
                  );
                })()}
              </Grid>
            </CardContent>
          </Card>

          {/* Related Record */}
          <Card sx={{ mt: 2 }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: relatedRecordExpanded ? 3 : 0 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    cursor: 'pointer',
                    flex: 1,
                    '&:hover': { opacity: 0.7 }
                  }}
                  onClick={() => setRelatedRecordExpanded(!relatedRecordExpanded)}
                >
                  <IconButton
                    size="small"
                    sx={{ p: 0.5, pointerEvents: 'none' }}
                  >
                    {relatedRecordExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                  </IconButton>
                  <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                    Related Record
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton size="small" sx={{ border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                    <AddIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" sx={{ border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
              <Collapse in={relatedRecordExpanded} timeout="auto" unmountOnExit>
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  Related {activity.relationType} record #{activity.relationId}
                </Typography>
              </Collapse>
            </CardContent>
          </Card>
        </Box>

        {/* Right Sidebar - Quick Actions & Activity Feed */}
        <Box sx={{
          width: { xs: '100%', md: '340px' },
          flexShrink: 0
        }}>


          {/* Activity Feed */}
          <Card sx={{ mt: 2 }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                  Activity Feed
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton size="small" sx={{ border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                    <AddIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" sx={{ border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>

              {/* Filters */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                {/* Activity Type Filters */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Show:</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      label="All"
                      size="small"
                      variant={activityFilter === 'all' ? 'filled' : 'outlined'}
                      onClick={() => handleActivityFilterChange('all')}
                      sx={{ borderRadius: '16px', bgcolor: activityFilter === 'all' ? 'primary.main' : undefined, color: activityFilter === 'all' ? 'white' : undefined, '&:hover': { bgcolor: activityFilter === 'all' ? 'primary.dark' : undefined } }}
                    />
                    <Chip
                      label="Activities"
                      size="small"
                      variant={activityFilter === 'activities' ? 'filled' : 'outlined'}
                      onClick={() => handleActivityFilterChange('activities')}
                      sx={{ borderRadius: '16px', bgcolor: activityFilter === 'activities' ? 'primary.main' : undefined, color: activityFilter === 'activities' ? 'white' : undefined, '&:hover': { bgcolor: activityFilter === 'activities' ? 'primary.dark' : undefined } }}
                    />
                    <Chip
                      label="Email"
                      size="small"
                      variant={activityFilter === 'email' ? 'filled' : 'outlined'}
                      onClick={() => handleActivityFilterChange('email')}
                      sx={{ borderRadius: '16px', bgcolor: activityFilter === 'email' ? 'primary.main' : undefined, color: activityFilter === 'email' ? 'white' : undefined, '&:hover': { bgcolor: activityFilter === 'email' ? 'primary.dark' : undefined } }}
                    />
                    <Chip
                      label="System"
                      size="small"
                      variant={activityFilter === 'system' ? 'filled' : 'outlined'}
                      onClick={() => handleActivityFilterChange('system')}
                      sx={{ borderRadius: '16px', bgcolor: activityFilter === 'system' ? 'primary.main' : undefined, color: activityFilter === 'system' ? 'white' : undefined, '&:hover': { bgcolor: activityFilter === 'system' ? 'primary.dark' : undefined } }}
                    />
                  </Box>
                </Box>

                {/* Time Period Filters */}
                <Box>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      label="Any time"
                      size="small"
                      variant={timeFilter === 'any' ? 'filled' : 'outlined'}
                      onClick={() => handleTimeFilterChange('any')}
                      sx={{ borderRadius: '16px', bgcolor: timeFilter === 'any' ? 'primary.main' : undefined, color: timeFilter === 'any' ? 'white' : undefined, '&:hover': { bgcolor: timeFilter === 'any' ? 'primary.dark' : undefined } }}
                    />
                    <Chip
                      label="Today"
                      size="small"
                      variant={timeFilter === 'today' ? 'filled' : 'outlined'}
                      onClick={() => handleTimeFilterChange('today')}
                      sx={{ borderRadius: '16px', bgcolor: timeFilter === 'today' ? 'primary.main' : undefined, color: timeFilter === 'today' ? 'white' : undefined, '&:hover': { bgcolor: timeFilter === 'today' ? 'primary.dark' : undefined } }}
                    />
                    <Chip
                      label="Yesterday"
                      size="small"
                      variant={timeFilter === 'yesterday' ? 'filled' : 'outlined'}
                      onClick={() => handleTimeFilterChange('yesterday')}
                      sx={{ borderRadius: '16px', bgcolor: timeFilter === 'yesterday' ? 'primary.main' : undefined, color: timeFilter === 'yesterday' ? 'white' : undefined, '&:hover': { bgcolor: timeFilter === 'yesterday' ? 'primary.dark' : undefined } }}
                    />
                  </Box>
                </Box>
              </Box>

              {/* Activities List */}
              {filteredActivities.length > 0 ? (
                <Box sx={{ maxHeight: '400px', overflowY: 'auto', pr: 2 }}>
                  {filteredActivities.map((activity, index) => {
                    const activityIcon = activity.sourceFrom === 'phone-call' ? <PhoneIcon fontSize="small" /> : <DescriptionIcon fontSize="small" />;
                    const activityIconBg = activity.sourceFrom === 'phone-call' ? '#e3f2fd' : '#f3e5f5';
                    const activityIconColor = activity.sourceFrom === 'phone-call' ? '#1976d2' : '#9c27b0';
                    const activityTime = new Date(activity.createdOn).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                    const activityDate = new Date(activity.createdOn).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

                    return (
                      <Box
                        key={activity.id}
                        sx={{
                          mb: 2,
                          pb: 2,
                          borderBottom: index < filteredActivities.length - 1 ? '1px solid #e5e7eb' : 'none'
                        }}
                      >
                        <Box sx={{ display: 'flex', gap: 1.5 }}>
                          <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: activityIconBg, color: activityIconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, mt: 0.5 }}>
                            {activityIcon}
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 0.5 }}>
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {activity.subject}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">•</Typography>
                                  <Typography variant="caption" color="text.secondary">{activityTime}</Typography>
                                  <Typography variant="caption" color="text.secondary">•</Typography>
                                  <Typography variant="caption" color="text.secondary">{activityDate}</Typography>
                                </Box>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                  {assignedUserLoading ? 'Loading...' : assignedUser ? `${assignedUser.firstName} ${assignedUser.lastName}` : activity.assignedTo} created this activity
                                </Typography>
                                <Typography variant="body2">
                                  {activity.body}
                                </Typography>
                              </Box>
                              <IconButton size="small" sx={{ ml: 1, border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                                <MoreVertIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </Box>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    No activities in this filter criteria.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default ActivityDetail;

