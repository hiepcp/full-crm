import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Grid,
  Divider,
  Avatar,
  Stack,
  Button,
  MenuItem,
  Paper,
  IconButton,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import ActivityFeed from '../../components/common/ActivityFeed';
import CreateLead from './components/CreateLead';
import AssigneeSection from '../../components/common/AssigneeSection';
import AddressSection from '../../components/common/AddressSection';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  CheckCircle as CheckCircleIcon,
  MoreVert as MoreVertIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Add as AddIcon,
  Chat as ChatIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { getEnrichedLead, updateLead, convertLeadToDeal, getUsers, createAssignee, updateAssignee, deleteAssignee } from '@presentation/data';
import { getStatusColor, getSourceColor } from './utils/leadUtils';
import { canConvertLead } from '../../components/common/forms/LeadFormConfig';
import { formatDate } from '../../../utils/formatDate';
import LeadStatusProgress from './components/LeadStatusProgress';
import ConvertToDealForm from '../../components/lead/ConvertToDealForm';
import CustomSnackbar from '@presentation/components/CustomSnackbar';
import { ACTIVITY_CATEGORIES } from '../../../utils/constants';
import { toCamelCase } from '../../../utils/string-utils';

const LeadDetail = React.memo(() => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const leadId = parseInt(id, 10);
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLead = async () => {
      try {
        const enrichedLead = await getEnrichedLead(leadId);
        setLead(toCamelCase(enrichedLead));
      } catch (error) {
        console.error('Error loading lead:', error);
      } finally {
        setLoading(false);
      }
    };
    loadLead();
  }, [leadId]);

  // Activity form states
  const [sendEmailOpen, setSendEmailOpen] = useState(false);

  // Collapse states
  const [leadDetailsExpanded, setLeadDetailsExpanded] = useState(true);
  const [peopleExpanded, setPeopleExpanded] = useState(true);
  const [relatedInfoExpanded, setRelatedInfoExpanded] = useState(true);

  const [timeFilter, setTimeFilter] = useState('any');
  const [activityFilter, setActivityFilter] = useState('all');

  // Normalize activity to a category based on source/type
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

  // Snackbar state for success/error notifications
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Convert to deal form state
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const createLeadRef = useRef(null);

  // Helper function to get user by ID from enriched activity data
  const getUserByIdSync = (userId) => {
    // Since activities are already enriched, we can get user data from there
    // But for backward compatibility, we'll keep a simple implementation
    return null; // Activities should have enriched participant data instead
  };

  // Refresh lead data function
  const refreshLead = async () => {
    const refreshed = await getEnrichedLead(leadId);
    setLead(toCamelCase(refreshed));
  };

  // Owner loading removed - will be handled by getEnrichedLead in future optimization
  const filteredActivities = useMemo(() => {
    if (!lead?.activities) {
      return [];
    }

    let activities = [...lead.activities];

    // Activity Category Filter
    if (activityFilter !== 'all') {
      activities = activities.filter(activity => getActivityCategory(activity) === activityFilter);
    }

    // Time Period Filter
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

      activities = activities.filter(activity => {
        const activityDate = new Date(activity.createdOn);
        if (Number.isNaN(activityDate.getTime())) return false;
        const activityTime = activityDate.getTime();

        if (timeFilter === 'today') {
          return activityTime >= todayStart.getTime() && activityTime <= todayEnd.getTime();
        }

        if (timeFilter === 'yesterday') {
          return activityTime >= yesterdayStart.getTime() && activityTime <= yesterdayEnd.getTime();
        }

        if (timeFilter === 'last7') {
          return activityTime >= last7Start.getTime() && activityTime <= todayEnd.getTime();
        }

        if (timeFilter === 'last30') {
          return activityTime >= last30Start.getTime() && activityTime <= todayEnd.getTime();
        }

        if (timeFilter === 'custom') {
          const from = customStart ? dayjs(customStart).startOf('day').toDate().getTime() : null;
          const to = customEnd ? dayjs(customEnd).endOf('day').toDate().getTime() : null;
          if (from !== null && to !== null) {
            return activityTime >= from && activityTime <= to;
          }
          if (from !== null) {
            return activityTime >= from;
          }
          if (to !== null) {
            return activityTime <= to;
          }
          return true;
        }

        return true;
      });
    }

    return activities;
  }, [lead?.activities, activityFilter, timeFilter]);


  const handleConvertLead = () => {
    setConvertDialogOpen(true);
  };

  const handleConvertDialogClose = () => {
    setConvertDialogOpen(false);
  };

  const handleConvertSubmit = async (conversionData) => {
    try {
      setLoading(true);

      // Check if lead score meets conversion requirement
      if (!canConvertLead(lead.score)) {
        setSnackbar({
          open: true,
          message: `Cannot convert lead. Score must be at least 75. Current score: ${lead.score}`,
          severity: 'warning'
        });
        return;
      }

      // Call API to convert lead to deal
      const dealId = await convertLeadToDeal(leadId, conversionData);

      // Show success message
      setSnackbar({
        open: true,
        message: 'Lead successfully converted to deal!',
        severity: 'success'
      });

      // Close dialog
      setConvertDialogOpen(false);

      // Navigate to the newly created deal
      setTimeout(() => {
        navigate(`/deals/${dealId}`);
      }, 1500); // Small delay to show success message

    } catch (error) {
      console.error('Error converting lead to deal:', error);

      // Show error message
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to convert lead to deal. Please try again.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Edit mode handlers
  const handleEditLead = () => {
    setEditModalOpen(true);
  };

  const handleEditModalClose = () => {
    setEditModalOpen(false);
  };

  const handleEditSubmit = async (result) => {
    try {
      // Build update payload from form result, falling back to current lead values
      const payload = {
        firstName: result.lead?.firstName ?? lead.firstName,
        lastName: result.lead?.lastName ?? lead.lastName,
        email: result.lead?.email ?? lead.email ?? null,
        telephoneNo: result.lead?.telephoneNo ?? lead.telephoneNo ?? null,
        company: result.lead?.company ?? lead.company,
        website: result.lead?.website ?? lead.website ?? null,
        country: result.lead?.country ?? lead.country ?? null,
        vatNumber: result.lead?.vatNumber ?? lead.vatNumber ?? null,
        paymentTerms: result.lead?.paymentTerms ?? lead.paymentTerms ?? null,
        source: result.lead?.source ?? lead.source,
        status: result.lead?.status ?? lead.status,
        score: result.lead?.score ?? lead.score ?? 0,
        note: result.lead?.note ?? lead.note ?? null,
        type: result.lead?.type ?? lead.type ?? 0,
        ownerId: result.lead?.ownerId ?? lead.ownerId ?? null,
        followUpDate: result.lead?.followUpDate ?? lead.followUpDate ?? null,
        // Keep existing relations unless explicitly changed in the form
        contactId: result.lead?.contactId ?? lead.contactId ?? null,
        customerId: result.lead?.customerId ?? lead.customerId ?? null,
        // Include addresses from the form transformation
        addresses: result.lead?.addresses ?? lead.addresses ?? [],
      };

      // Persist update via API
      await updateLead(lead.id, payload);

      // Refresh enriched lead from server to reflect latest state
      const refreshed = await getEnrichedLead(lead.id);
      setLead(toCamelCase(refreshed));

      setEditModalOpen(false);
      setSnackbar({ open: true, message: 'Lead updated successfully', severity: 'success' });
    } catch (error) {
      console.error('Error updating lead:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update lead';
      // Clean up the message by removing extra whitespace and line breaks
      const cleanMessage = errorMessage.replace(/\r\n/g, ' ').replace(/\s+/g, ' ').trim();
      setSnackbar({
        open: true,
        message: cleanMessage,
        severity: 'error'
      });
      throw error; // Re-throw error so CreateLead knows submit failed
    }
  };


  // Activity submission handler
  const handleActivitySubmit = (activityData) => {
    // In a real app, this would make an API call to save the activity
    // For now, we'll update the local lead state
    const newActivity = {
      ...activityData,
      id: Date.now(), // Generate a temporary ID
    };

    setLead(prevLead => ({
      ...prevLead,
      activities: prevLead.activities ? [newActivity, ...prevLead.activities] : [newActivity]
    }));

    // Show success snackbar
    setSnackbar({ open: true, message: 'Activity created successfully', severity: 'success' });
  };


  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
        <Typography variant="body1" color="text.secondary">
          Loading lead details...
        </Typography>
      </Box>
    );
  }

  if (!lead) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" color="error">
          Lead not found
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: theme.palette.grey.A50, minHeight: '100vh' }}>
      {/* Top Header */}
      <Box sx={{ bgcolor: 'white', borderBottom: `1px solid ${theme.palette.grey[200]}` }}>
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
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: '1rem', sm: '1.125rem' } }}>
                {lead.firstName} {lead.lastName}
              </Typography>
              <Chip
                label="Lead"
                size="small"
                sx={{
                  bgcolor: theme.palette.primary.lighter,
                  color: theme.palette.primary.main,
                  fontWeight: 500,
                  fontSize: '0.75rem'
                }}
              />
              <Chip
                label={`${lead.score}/100`}
                size="small"
                sx={{
                  bgcolor: theme.palette.success.lighter,
                  color: theme.palette.success.dark,
                  fontWeight: 600,
                  fontSize: '0.75rem'
                }}
              />
              <Chip
                label={lead?.status?.toUpperCase()}
                size="small"
                color={getStatusColor(lead.status)}
              />
              <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
                ID: {leadId}
              </Typography>
              {/* Conversion Warning - Compact design */}
              {!lead.isConverted && !canConvertLead(lead.score) && (
                <Typography
                  variant="caption"
                  sx={{
                    color: 'warning.main',
                    fontSize: '0.7rem',
                    fontWeight: 500,
                    mt: 0.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5
                  }}
                >
                  <WarningIcon sx={{ fontSize: '0.8rem' }} />
                  Score: {lead.score}/100 (need ≥75 to convert)
                </Typography>
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<EditIcon />}
                onClick={handleEditLead}
              >
                Edit
              </Button>
              {!lead.isConverted && canConvertLead(lead.score) && (
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<CheckCircleIcon />}
                  onClick={handleConvertLead}
                >
                  Convert
                </Button>
              )}
              <IconButton size="small">
                <DeleteIcon />
              </IconButton>
              <IconButton size="small">
                <MoreVertIcon />
              </IconButton>
            </Box>


          </Box>

          {/* Pipeline Progress */}
          <LeadStatusProgress
            currentStatus={lead.status}
          />
        </Box>
      </Box>

      {/* Two Column Layout */}
      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        gap: 2,
        p: { xs: 1, sm: 2 }
      }}>
        {/* Left - Lead Details & Activity Feed */}
        <Box sx={{ flex: 1, width: { xs: '100%', md: 'auto' } }}>
          {/* Lead Details */}
          <Card sx={{ mb: 2 }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: leadDetailsExpanded ? 3 : 0 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    cursor: 'pointer',
                    flex: 1,
                    '&:hover': { opacity: 0.7 }
                  }}
                  onClick={() => setLeadDetailsExpanded(!leadDetailsExpanded)}
                >
                  <IconButton
                    size="small"
                    sx={{ p: 0.5, pointerEvents: 'none' }}
                  >
                    {leadDetailsExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                  </IconButton>
                  <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                    Lead Details
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton
                    size="small"
                    sx={{ border: `1px solid ${theme.palette.grey[300]}`, borderRadius: '4px' }}
                    onClick={handleEditLead}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" sx={{ border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
              <Collapse in={leadDetailsExpanded} timeout="auto" unmountOnExit>
                {/* Row 1 */}
                <Grid container spacing={0} sx={{ width: '100%', borderTop: `1px solid ${theme.palette.grey[200]}` }}>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ flex: 1, borderRight: { md: `1px solid ${theme.palette.grey[200]}` }, borderBottom: `1px solid ${theme.palette.grey[200]}`, p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Lead Score
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#2e7d32' }}>
                        {lead.score}/100
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ flex: 1, borderRight: { md: `1px solid ${theme.palette.grey[200]}` }, borderBottom: `1px solid ${theme.palette.grey[200]}`, p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Status
                    </Typography>
                    <Chip label={lead.status} color={getStatusColor(lead.status)} size="small" />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ flex: 1, borderRight: { md: `1px solid ${theme.palette.grey[200]}` }, borderBottom: `1px solid ${theme.palette.grey[200]}`, p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Company
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'primary.main', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                      {lead.company}
                    </Typography>
                  </Grid>
                </Grid>

                {/* Row 2 */}
                <Grid container spacing={0} sx={{ width: '100%' }}>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ flex: 1, borderRight: { md: `1px solid ${theme.palette.grey[200]}` }, borderBottom: `1px solid ${theme.palette.grey[200]}`, p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Source
                    </Typography>
                    <Chip label={lead.source} color={getSourceColor(lead.source)} size="small" />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ flex: 1, borderRight: { md: `1px solid ${theme.palette.grey[200]}` }, borderBottom: `1px solid ${theme.palette.grey[200]}`, p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Created By
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>{lead.createdBy}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ flex: 1, borderRight: { md: `1px solid ${theme.palette.grey[200]}` }, borderBottom: `1px solid ${theme.palette.grey[200]}`, p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Created On
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>{formatDate(lead.createdOn)}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ flex: 1, borderRight: { md: `1px solid ${theme.palette.grey[200]}` }, borderBottom: `1px solid ${theme.palette.grey[200]}`, p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Updated On
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>{formatDate(lead.updatedOn)}</Typography>
                  </Grid>
                </Grid>

                {/* Row 3 - Notes and Follow-up Date */}
                <Grid container spacing={0} sx={{ width: '100%' }}>
                  <Grid size={{ xs: 12, sm: 6, md: 6 }} sx={{ flex: 1, borderRight: { md: `1px solid ${theme.palette.grey[200]}` }, borderBottom: `1px solid ${theme.palette.grey[200]}`, p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Follow-up Date
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      {lead.followUpDate ? formatDate(lead.followUpDate) : 'Not set'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 6 }} sx={{ flex: 1, borderRight: { md: `1px solid ${theme.palette.grey[200]}` }, borderBottom: `1px solid ${theme.palette.grey[200]}`, p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Notes
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      {lead.note || 'No notes'}
                    </Typography>
                  </Grid>
                </Grid>

                {lead.isConverted && (
                  <Grid container spacing={0} sx={{ width: '100%' }}>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ flex: 1, borderRight: { md: `1px solid ${theme.palette.grey[200]}` }, borderBottom: `1px solid ${theme.palette.grey[200]}`, p: 2, minWidth: 0 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>Converted At</Typography>
                      <Typography variant="body2">{lead.convertedAt ? formatDate(lead.convertedAt) : 'N/A'}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ flex: 1, borderRight: { md: `1px solid ${theme.palette.grey[200]}` }, borderBottom: `1px solid ${theme.palette.grey[200]}`, p: 2, minWidth: 0 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>Customer</Typography>
                      <Typography variant="body2" sx={{ color: 'primary.main', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>{lead.customer ? lead.customer.name : 'N/A'}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ flex: 1, borderRight: { md: `1px solid ${theme.palette.grey[200]}` }, borderBottom: `1px solid ${theme.palette.grey[200]}`, p: 2, minWidth: 0 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>Contact</Typography>
                      <Typography variant="body2" sx={{ color: 'primary.main', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>{lead.contact ? `${lead.contact.firstName} ${lead.contact.lastName}` : 'N/A'}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ flex: 1, borderBottom: `1px solid ${theme.palette.grey[200]}`, p: 2, minWidth: 0 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>Deal</Typography>
                      <Typography variant="body2" sx={{ color: 'primary.main', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>{lead.dealId || 'N/A'}</Typography>
                    </Grid>
                  </Grid>
                )}
              </Collapse>
            </CardContent>
          </Card>

          {/* Activity Feed */}
          <ActivityFeed
            entityType="lead"
            entityId={leadId}
            activities={lead?.activities || []}
            getUserById={getUserByIdSync}
            onActivityCreated={(data, options = {}) => {
              try {
                setLead((prevLead) => {
                  const existingActivities = prevLead.activities || [];
                  const existingIndex = existingActivities.findIndex(activity => activity.id === data.id);

                  let updatedActivities;
                  let message;

                  if (existingIndex >= 0) {
                    // Activity already exists, update it in place (works for both email updates and regular updates)
                    updatedActivities = [...existingActivities];
                    updatedActivities[existingIndex] = { ...updatedActivities[existingIndex], ...data };
                    message = 'Activity updated successfully';
                  } else {
                    // Activity doesn't exist yet
                    if (options.isEmailUpdate) {
                      // Don't add new email activities to the list
                      setSnackbar({ open: true, message: 'Activity updated successfully', severity: 'success' });
                      return prevLead;
                    } else {
                      // Add new non-email activities to the beginning
                      updatedActivities = [data, ...existingActivities];
                      message = 'Activity created successfully';
                    }
                  }

                  return {
                    ...prevLead,
                    activities: updatedActivities
                  };
                });

                // Show success message for non-email-update cases
                if (!options.isEmailUpdate) {
                  setSnackbar({ open: true, message: 'Activity created successfully', severity: 'success' });
                }
              } catch (e) {
                setSnackbar({ open: true, message: 'Failed to update activity list', severity: 'warning' });
              }
            }}
            onActivityError={(data, options = {}) => {
              setSnackbar({
                open: true,
                message: 'Failed to create activity. Please check your data and try again.',
                severity: 'error'
              });
            }}
            renderDescription={({ activity, user, theme }) => (
              <>
                {user && (
                  <>
                    {user.firstName} {user.lastName}{' '}
                    {activity.sourceFrom === 'phone-call' ? 'wrote about' : 'generated document for the'}{' '}
                  </>
                )}
                <Typography
                  component="span"
                  sx={{ color: theme.palette.primary.main, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                  onClick={() => navigate(`/leads/${lead.id}`)}
                >
                  {lead.firstName} {lead.lastName}
                </Typography>
              </>
            )}
          />

          {/* Related Info Card */}
          <Card sx={{ mt: 2 }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: relatedInfoExpanded ? 2 : 0 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    cursor: 'pointer',
                    flex: 1,
                    '&:hover': { opacity: 0.7 }
                  }}
                  onClick={() => setRelatedInfoExpanded(!relatedInfoExpanded)}
                >
                  <IconButton
                    size="small"
                    sx={{ p: 0.5, pointerEvents: 'none' }}
                  >
                    {relatedInfoExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                  </IconButton>
                  <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                    Related Information
                  </Typography>
                </Box>
              </Box>
              <Collapse in={relatedInfoExpanded} timeout="auto" unmountOnExit>
                {lead.isConverted ? (
                  <Stack spacing={2} sx={{ borderTop: `1px solid ${theme.palette.grey[200]}`, pt: 2, mt: 2 }}>
                    {lead.customer && (
                      <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Related Customer</Typography>
                        <Link to={`/customers/${lead.customer.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                          <Typography variant="body2" color="primary" sx={{ '&:hover': { textDecoration: 'underline' } }}>{lead.customer.name}</Typography>
                        </Link>
                      </Paper>
                    )}
                    {lead.contact && (
                      <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Related Contact</Typography>
                        <Link to={`/contacts/${lead.contact.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                          <Typography variant="body2" color="primary" sx={{ '&:hover': { textDecoration: 'underline' } }}>{lead.contact.firstName} {lead.contact.lastName}</Typography>
                        </Link>
                      </Paper>
                    )}
                  </Stack>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4, borderTop: `1px solid ${theme.palette.grey[200]}`, mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      No related records found. Convert this lead to create related records.
                    </Typography>
                  </Box>
                )}
              </Collapse>
            </CardContent>
          </Card>
        </Box>

        {/* Right Sidebar - People, Address, Agenda */}
        <Box sx={{
          width: { xs: '100%', md: '340px' },
          flexShrink: 0
        }}>
          {/* People Section */}
          <Card sx={{ mb: 2 }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: peopleExpanded ? 3 : 0 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    cursor: 'pointer',
                    flex: 1,
                    '&:hover': { opacity: 0.7 }
                  }}
                  onClick={() => setPeopleExpanded(!peopleExpanded)}
                >
                  <IconButton
                    size="small"
                    sx={{ p: 0.5, pointerEvents: 'none' }}
                  >
                    {peopleExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                  </IconButton>
                  <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                    Infomation
                  </Typography>
                </Box>
                <IconButton size="small" sx={{ border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                  <AddIcon fontSize="small" />
                </IconButton>
              </Box>
              <Collapse in={peopleExpanded} timeout="auto" unmountOnExit>
                {lead && (
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                      {lead?.firstName?.charAt(0)}{lead?.lastName?.charAt(0)}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            color: 'primary.main',
                            cursor: 'pointer',
                            '&:hover': { textDecoration: 'underline' }
                          }}
                          onClick={() => navigate(`/leads/${lead.id}`)}
                        >
                          {lead.firstName} {lead.lastName}
                        </Typography>
                      </Box>

                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5, mb: 0.5 }}>
                        Company
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          mb: 1.5,
                          color: 'primary.main',
                          cursor: 'pointer',
                          '&:hover': { textDecoration: 'underline' }
                        }}
                        onClick={() => lead.customer && navigate(`/customers/${lead.customer.id}`)}
                      >
                        {lead.company}
                      </Typography>

                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5, mb: 0.5 }}>
                        VAT Number
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1.5 }}>
                        {lead.vatNumber || '—'}
                      </Typography>

                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5, mb: 0.5 }}>
                        Telephone No
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          mb: 1.5,
                          color: 'primary.main',
                          cursor: 'pointer',
                          '&:hover': { textDecoration: 'underline' }
                        }}
                      >
                        {lead.telephoneNo}
                      </Typography>

                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5, mb: 0.5 }}>
                        Work Email
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          mb: 1.5,
                          color: 'primary.main',
                          cursor: 'pointer',
                          '&:hover': { textDecoration: 'underline' }
                        }}
                      >
                        {lead.email}
                      </Typography>

                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5, mb: 0.5 }}>
                        Website
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1.5 }}>
                        {lead.website}
                      </Typography>

                      {/* Social Icons */}
                      <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
                        <IconButton size="small" sx={{ border: '1px solid #e0e0e0' }}>
                          <ChatIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" sx={{ border: '1px solid #e0e0e0' }}>
                          <EmailIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" sx={{ border: '1px solid #e0e0e0' }}>
                          <PhoneIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" sx={{ border: '1px solid #e0e0e0' }}>
                          <ChatIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" sx={{ border: '1px solid #e0e0e0' }}>
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  </Box>
                )}
              </Collapse>
            </CardContent>
          </Card>

          {/* Assignees Section */}
          <AssigneeSection
            relationType="lead"
            relationId={leadId}
            assignees={lead.assignees}
            onRefresh={refreshLead}
          />

          <AddressSection
            relationType="lead"
            relationId={leadId}
            addresses={lead?.addresses || []}
            customer={lead?.customer}
            onRefresh={refreshLead}
          />

        </Box>
      </Box>

      {/* Convert to Deal Form Component */}
      <ConvertToDealForm
        open={convertDialogOpen}
        onClose={handleConvertDialogClose}
        onSubmit={handleConvertSubmit}
        lead={lead}
      />

      {/* Edit Lead Dialog */}
      <Dialog
        open={editModalOpen}
        onClose={handleEditModalClose}
        maxWidth="lg"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            minHeight: '80vh',
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle>Edit Lead</DialogTitle>
        <DialogContent>
          <CreateLead
            ref={createLeadRef}
            onSubmit={handleEditSubmit}
            initialData={lead}
            isEdit={true}
            onClose={handleEditModalClose}
            showActions={false}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditModalClose} variant="outlined">
            Cancel
          </Button>
          <Button onClick={() => {
            if (createLeadRef.current) {
              createLeadRef.current.submit();
            }
          }} variant="contained">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>


      {/* Snackbar Notification */}
      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      />
    </Box>
  );
});

export default LeadDetail;
