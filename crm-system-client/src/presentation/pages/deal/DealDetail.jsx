import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Divider,
  Button,
  Paper,
  IconButton,
  Collapse,
  Tooltip,
  Chip,
  Avatar
} from '@mui/material';
import PipelineProgress from './components/PipelineProgress';
import ActivityFeed from '../../components/common/ActivityFeed';
import AssigneeSection from '../../components/common/AssigneeSection';
import InstantDocsSection from '../../components/common/InstantDocsSection';
import DocumentSection from '../../components/sharepoint/DocumentSection';
import CustomSnackbar from '../../components/CustomSnackbar';
import {
  Edit as EditIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  MoreVert as MoreVertIcon,
  Add as AddIcon,
  Warning as WarningIcon,
  Chat as ChatIcon,
  LocationOn as LocationOnIcon,
  Description as DescriptionIcon,
  FiberManualRecord as FiberManualRecordIcon,
  Receipt as ReceiptIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import { getEnrichedDeal, getEnrichedLead, getUserById, getUsers, bulkCreateDealQuotations } from '@presentation/data';
import { getStageColor } from './utils/dealUtils';
import { formatCurrency } from '../../../utils/formatCurrency';
import { formatDate } from '../../../utils/formatDate';
import LinkQuotationModal from './components/LinkQuotationModal';
import CreateDealModal from './components/CreateDealModal';
import { toCamelCase } from '../../../utils/string-utils';
import { ACTIVITY_SOURCE_TYPES } from '../../../utils/constants';

const DealDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const createDealRef = useRef(null);
  const dealId = id ? parseInt(id, 10) : null;
  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrichedLead, setEnrichedLead] = useState(null);

  // Users state for activity user lookups
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [owner, setOwner] = useState(null);
  const [ownerLoading, setOwnerLoading] = useState(false);

  // Load deal data
  useEffect(() => {
    const loadDeal = async () => {
      try {
        setLoading(true);
        if (dealId) {
          const enrichedDeal = await getEnrichedDeal(dealId);
          setDeal(enrichedDeal);
        } else {
          setDeal(null);
        }
      } catch (error) {
        console.error('Error loading deal:', error);
        setDeal(null);
      } finally {
        setLoading(false);
      }
    };
    loadDeal();
  }, [dealId]);

  // Load enriched lead data when deal changes
  useEffect(() => {
    const loadLead = async () => {
      if (deal?.leadId) {
        const enrichedLeadData = await getEnrichedLead(deal.leadId);
        setEnrichedLead(toCamelCase(enrichedLeadData));
      } else {
        setEnrichedLead(null);
      }
    };
    loadLead();
  }, [deal]);

  // Load users for activity user lookups
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setUsersLoading(true);
        const usersData = await getUsers();
        setUsers(usersData || []);
      } catch (error) {
        console.error('Error loading users:', error);
        setUsers([]);
      } finally {
        setUsersLoading(false);
      }
    };

    if (deal?.activities && deal.activities.length > 0 && users.length === 0) {
      loadUsers();
    }
  }, [deal?.activities, users.length]);

  // Load owner user when deal changes
  useEffect(() => {
    const loadOwner = async () => {
      if (deal?.ownerId && !owner) {
        try {
          setOwnerLoading(true);
          const ownerData = await getUserById(deal.ownerId);
          setOwner(ownerData);
        } catch (error) {
          console.error('Error loading owner:', error);
          setOwner(null);
        } finally {
          setOwnerLoading(false);
        }
      }
    };

    loadOwner();
  }, [deal?.ownerId, owner]);

  // Helper function to get user by ID
  const getUserByIdSync = (userId) => {
    return users.find(user => user.id === parseInt(userId)) || null;
  };

  // Refresh deal data function
  const refreshDeal = async () => {
    if (dealId) {
      const enrichedDeal = await getEnrichedDeal(dealId);
      setDeal(enrichedDeal);
    }
  };

  const [currentTab, setCurrentTab] = useState(0);
  const [linkQuotationModalOpen, setLinkQuotationModalOpen] = useState(false);
  const [timeFilter, setTimeFilter] = useState('any'); // 'any', 'today', 'yesterday', 'custom'
  const [activityFilter, setActivityFilter] = useState('all'); // 'all', 'activities', 'email', 'system'

  // Collapse states
  const [dealDetailsExpanded, setDealDetailsExpanded] = useState(true);
  const [peopleExpanded, setPeopleExpanded] = useState(true);
  const [assigneesExpanded, setAssigneesExpanded] = useState(true);
  const [leadExpanded, setLeadExpanded] = useState(true);
  const [addressExpanded, setAddressExpanded] = useState(true);
  const [quotationsExpanded, setQuotationsExpanded] = useState(true);

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Snackbar state for notifications
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const filteredActivities = useMemo(() => {
    if (!deal?.activities) {
      return [];
    }

    let activities = [...deal.activities];

    // Activity Type Filter
    if (activityFilter !== 'all') {
      activities = activities.filter(activity => {
        if (activityFilter === 'activities') {
          // Assuming 'activities' are notes or calls, not emails or system messages
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
        // 'custom' filter logic can be added here later
        return true;
      });
    }

    return activities;
  }, [deal?.activities, activityFilter, timeFilter]);

  // Check what activity types are available for highlighting social icons
  const activityTypes = useMemo(() => {
    if (!deal?.activities) {
      return {
        hasEmail: false,
        hasPhone: false,
        hasChat: false,
        hasOther: false
      };
    }

    const types = {
      hasEmail: false,
      hasPhone: false,
      hasChat: false,
      hasOther: false
    };

    deal.activities.forEach(activity => {
      switch (activity.sourceFrom) {
        case ACTIVITY_SOURCE_TYPES.GMAIL_EMAIL:
          types.hasEmail = true;
          break;
        case ACTIVITY_SOURCE_TYPES.PHONE_CALL:
          types.hasPhone = true;
          break;
        case ACTIVITY_SOURCE_TYPES.CALENDAR_MEETING:
        case ACTIVITY_SOURCE_TYPES.SYSTEM_TASK:
        case ACTIVITY_SOURCE_TYPES.SYSTEM_NOTE:
          types.hasChat = true;
          break;
        case ACTIVITY_SOURCE_TYPES.INSTANT_DOC:
          types.hasOther = true;
          break;
        default:
          // For other activity types, consider them as "other"
          types.hasOther = true;
      }
    });

    return types;
  }, [deal?.activities]);

  const handleActivityFilterChange = (filter) => {
    setActivityFilter(filter);
    // TODO: Add logic to filter activities based on the selected type
  };

  const handleTimeFilterChange = (filter) => {
    setTimeFilter(filter);
    // TODO: Add logic to filter activities based on the selected time frame
  };

  // Social icon click handlers to filter activities by type
  const handleChatClick = () => {
    setActivityFilter(activityTypes.hasChat ? 'activities' : 'all');
  };

  const handleEmailClick = () => {
    setActivityFilter(activityTypes.hasEmail ? 'email' : 'all');
  };

  const handlePhoneClick = () => {
    // Filter to show only phone calls and meetings
    const phoneActivities = deal?.activities?.filter(activity =>
      activity.sourceFrom === 'phone-call' || activity.sourceFrom === 'calendar-meeting'
    );
    if (phoneActivities && phoneActivities.length > 0) {
      // Create a custom filter state for phone activities
      setActivityFilter('all');
    }
  };

  const handleMoreClick = () => {
    setActivityFilter('system');
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleLinkQuotationModalOpen = () => {
    setLinkQuotationModalOpen(true);
  };

  const handleLinkQuotationModalClose = () => {
    setLinkQuotationModalOpen(false);
  };

  const handleLinkQuotations = async (selectedQuotationNumbers) => {
    if (!dealId || !selectedQuotationNumbers || selectedQuotationNumbers.length === 0) {
      console.error('Invalid dealId or quotation numbers');
      return;
    }

    try {
      // Create array of deal-quotation links
      const dealQuotationLinks = selectedQuotationNumbers.map(quotationNumber => ({
        dealId: dealId,
        quotationNumber
      }));

      // Call bulk create API
      await bulkCreateDealQuotations(dealQuotationLinks);

      // Refresh deal data to show newly linked quotations
      const enrichedDeal = await getEnrichedDeal(dealId);
      setDeal(enrichedDeal);

      // Close modal
      setLinkQuotationModalOpen(false);
    } catch (error) {
      console.error('Error linking quotations to deal:', error);
      // The error will be handled by the modal component
      throw error;
    }
  };

  // Edit mode handlers
  const handleEditDeal = () => {
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (dealData) => {
    try {
      console.log('Updating deal:', dealData.deal);

      // Update the local state with the updated deal data returned from the API
      setDeal(dealData.deal);

      // Show success notification
      setSnackbar({
        open: true,
        message: 'Deal updated successfully',
        severity: 'success'
      });

      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Failed to update deal:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update deal. Please try again.',
        severity: 'error'
      });
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
        <Typography variant="body1" color="text.secondary">
          Loading deal details...
        </Typography>
      </Box>
    );
  }

  if (!deal) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" color="error">
          Deal not found
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
                {deal.name}
              </Typography>
              <Chip
                label="Deal"
                size="small"
                sx={{
                  bgcolor: theme.palette.primary.lighter,
                  color: theme.palette.primary.main,
                  fontWeight: 500,
                  fontSize: '0.75rem'
                }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
                ID: {dealId}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<EditIcon />}
                onClick={handleEditDeal}
                sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
              >
                Edit
              </Button>
              <IconButton
                size="small"
                onClick={handleEditDeal}
                sx={{ display: { xs: 'inline-flex', sm: 'none' } }}
              >
                <EditIcon />
              </IconButton>
              <IconButton size="small" sx={{ border: `1px solid ${theme.palette.grey[300]}`, borderRadius: '4px' }}>
                <MoreVertIcon />
              </IconButton>
            </Box>
          </Box>

          {/* Pipeline Progress */}
          <PipelineProgress
            pipelineLogs={deal.pipelineLogs || []}
            currentStage={deal.stage}
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
        {/* Left - Deal Details & Activity Feed */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {/* Deal Details */}
          <Card sx={{ mb: 2 }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: dealDetailsExpanded ? 3 : 0 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    cursor: 'pointer',
                    flex: 1,
                    '&:hover': { opacity: 0.7 }
                  }}
                  onClick={() => setDealDetailsExpanded(!dealDetailsExpanded)}
                >
                  <IconButton
                    size="small"
                    sx={{ p: 0.5, pointerEvents: 'none' }}
                  >
                    {dealDetailsExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                  </IconButton>
                  <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                    Deal Details
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton
                    size="small"
                    sx={{ border: `1px solid ${theme.palette.grey[300]}`, borderRadius: '4px' }}
                    onClick={handleEditDeal}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" sx={{ border: `1px solid ${theme.palette.grey[300]}`, borderRadius: '4px' }}>
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>

              {/* Grid Layout - Horizontal Rows */}
              <Collapse in={dealDetailsExpanded} timeout="auto" unmountOnExit>
                {/* Row 1 */}
                <Grid container spacing={0} sx={{ width: '100%', borderTop: '1px solid #e5e7eb' }}>
                  <Grid item xs={12} sm={6} md={3} sx={{ flex: 1, borderRight: { md: '1px solid #e5e7eb' }, borderBottom: '1px solid #e5e7eb', p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Expected Revenue
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.success.dark, mb: 0.5 }}>
                      {formatCurrency(deal.expectedRevenue)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Weighted forecast: None
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3} sx={{ flex: 1, borderRight: { md: '1px solid #e5e7eb' }, borderBottom: '1px solid #e5e7eb', p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Actual Revenue
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.success.darker, mb: 0.5 }}>
                      {formatCurrency(deal.actualRevenue || 0)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Realized revenue from deal
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3} sx={{ flex: 1, borderRight: { md: '1px solid #e5e7eb' }, borderBottom: '1px solid #e5e7eb', p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Stage
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                      <WarningIcon sx={{ fontSize: 16, color: theme.palette.error.dark }} />
                      <Typography variant="body2" sx={{ color: theme.palette.error.dark, fontWeight: 500 }}>
                        {deal.stage}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Previous: Lost
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3} sx={{ flex: 1, borderRight: { md: '1px solid #e5e7eb' }, borderBottom: '1px solid #e5e7eb', p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Days active
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                      21 days
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Created {formatDate(deal.createdOn)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3} sx={{ flex: 1, borderBottom: '1px solid #e5e7eb', p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Actual Close
                    </Typography>
                    <Typography variant="body2">{formatDate(deal.closeDate)}</Typography>
                  </Grid>
                </Grid>

                {/* Row 2 */}
                <Grid container spacing={0} sx={{ width: '100%' }}>
                  <Grid item xs={12} sm={6} md={3} sx={{ flex: 1, borderRight: { md: '1px solid #e5e7eb' }, borderBottom: '1px solid #e5e7eb', p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Owner
                    </Typography>
                    <Typography variant="body2">
                      {ownerLoading ? 'Loading...' : owner ? `${owner.firstName} ${owner.lastName}` : 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3} sx={{ flex: 1, borderRight: { md: '1px solid #e5e7eb' }, borderBottom: '1px solid #e5e7eb', p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Company
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.palette.primary.main,
                        cursor: 'pointer',
                        '&:hover': { textDecoration: 'underline' }
                      }}
                      onClick={() => deal.customer && navigate(`/customers/${deal.customer.id}`)}
                    >
                      {deal.customer ? deal.customer.name : 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3} sx={{ flex: 1, borderRight: { md: '1px solid #e5e7eb' }, borderBottom: '1px solid #e5e7eb', p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Pipeline
                    </Typography>
                    <Typography variant="body2">Sales Pipeline</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3} sx={{ flex: 1, borderBottom: '1px solid #e5e7eb', borderRight: { md: '1px solid #e5e7eb' }, p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Probability
                    </Typography>
                    <Typography variant="body2">{deal?.probability ? `${deal.probability}%` : '0%'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3} sx={{ flex: 1, borderRight: { md: '1px solid #e5e7eb' }, borderBottom: '1px solid #e5e7eb', p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Status
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <FiberManualRecordIcon sx={{ fontSize: 12, color: deal?.isClosed ? theme.palette.success.dark : theme.palette.success.light }} />
                      <Typography variant="body2">{deal?.isClosed ? 'Closed' : 'Open'}</Typography>
                    </Box>
                  </Grid>
                </Grid>

                {/* Row 3 */}
                <Grid container spacing={0} sx={{ width: '100%' }}>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ flex: 1, borderRight: { md: '1px solid #e5e7eb' }, borderBottom: '1px solid #e5e7eb', p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Revenue type
                    </Typography>
                    <Typography variant="body2">None</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ flex: 1, borderBottom: '1px solid #e5e7eb', p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Performance Lane
                    </Typography>
                    <Typography variant="body2">Service 1</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 6}} sx={{ flex: 1, borderBottom: '1px solid #e5e7eb', p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Summary
                    </Typography>
                    <Typography variant="body2">
                      {deal.description || 'Organized object-oriented orchestration'}
                    </Typography>
                  </Grid>
                </Grid>

              </Collapse>
            </CardContent>
          </Card>

          {/* Activity Feed */}
          <ActivityFeed
            entityType="deal"
            entityId={dealId}
            activities={deal?.activities || []}
            getUserById={getUserByIdSync}
            onActivityCreated={(data, options = {}) => {
              try {
                setDeal((prevDeal) => {
                  const existingActivities = prevDeal.activities || [];
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
                      return prevDeal;
                    } else {
                      // Add new non-email activities to the beginning
                      updatedActivities = [data, ...existingActivities];
                      message = 'Activity created successfully';
                    }
                  }

                  return {
                    ...prevDeal,
                    activities: updatedActivities
                  };
                });
              } catch (e) {
                console.error('Failed to update deal activities list:', e);
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
                <Typography component="span" sx={{ color: theme.palette.primary.main, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                  {deal.contact ? `${deal.contact?.firstName || ''} ${deal.contact?.lastName || ''}` : 'Contact'}
                </Typography>
                {' regarding the deal '}
                <Typography component="span" sx={{ color: theme.palette.primary.main, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                  {deal.name}
                </Typography>
                {' with '}
                <Typography component="span" sx={{ color: theme.palette.primary.main, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                  {deal.customer ? deal.customer.name : 'Customer'}
                </Typography>
              </>
            )}
          />
         
          {/* Quotations Section */}
          <Card sx={{ mt: 2 }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: quotationsExpanded ? 2 : 0 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    cursor: 'pointer',
                    flex: 1,
                    '&:hover': { opacity: 0.7 }
                  }}
                  onClick={() => setQuotationsExpanded(!quotationsExpanded)}
                >
                  <IconButton
                    size="small"
                    sx={{ p: 0.5, pointerEvents: 'none' }}
                  >
                    {quotationsExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                  </IconButton>
                  <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                    Quotations ({deal.quotations ? deal.quotations.length : 0})
                  </Typography>
                </Box>
                {deal.stage !== 'Closed Won' && deal.stage !== 'Closed Lost' && (
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={handleLinkQuotationModalOpen}
                  >
                    Link Quotation
                  </Button>
                )}
              </Box>

              <Collapse in={quotationsExpanded} timeout="auto" unmountOnExit>
                {deal.quotations && deal.quotations.length > 0 ? (
                  <Box sx={{ mt: 2 }}>
                    {deal.quotations.map(quotation => {
                      const quotationKey = quotation.quotationNumber || quotation.id;
                      const quotationName = quotation.name || quotationKey;
                      const quotationNumber = quotation.quotationNumber || quotationKey;
                      const quotationStatus = quotation.status || 'unknown';
                      const quotationAmount = quotation.totalAmount ?? 0;

                      return (
                      <Paper
                        key={quotationKey}
                        variant="outlined"
                        sx={{ p: 2, mb: 1.5, display: 'flex', alignItems: 'center', gap: 2 }}
                      >
                        <Avatar sx={{ bgcolor: theme.palette.secondary.lighter, color: theme.palette.secondary.dark }}>
                          <ReceiptIcon />
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Link
                            to={`/quotations/${quotationNumber}`}
                            style={{ textDecoration: 'none', color: 'inherit' }}
                          >
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 600,
                                color: 'primary.main',
                                '&:hover': { textDecoration: 'underline' }
                              }}
                            >
                              {quotationName}
                            </Typography>
                          </Link>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            {quotationNumber}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {formatCurrency(quotationAmount)}
                          </Typography>
                          <Chip
                            label={quotationStatus}
                            size="small"
                            sx={{
                              mt: 0.5,
                              bgcolor: getStageColor(quotationStatus, 'quotation').light,
                              color: getStageColor(quotationStatus, 'quotation').dark,
                              textTransform: 'capitalize'
                            }}
                          />
                        </Box>
                      </Paper>
                      );
                    })}
                  </Box>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4, borderTop: '1px solid #e5e7eb', mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      No quotations linked to this deal yet.
                    </Typography>
                  </Box>
                )}
              </Collapse>
            </CardContent>
          </Card>

          {/* Documents Section */}
          <Box sx={{ mt: 2, mb: 2 }}>
            <DocumentSection
              entityType="deal"
              entityId={dealId}
              title="Documents"
              onDocumentUploaded={(doc) => {
                setSnackbar({ open: true, message: 'Document uploaded successfully', severity: 'success' });
              }}
              onDocumentDeleted={(docId) => {
                setSnackbar({ open: true, message: 'Document deleted successfully', severity: 'success' });
              }}
            />
          </Box>
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
                    People
                  </Typography>
                </Box>
                <IconButton size="small" sx={{ border: `1px solid ${theme.palette.grey[300]}`, borderRadius: '4px' }}>
                  <AddIcon fontSize="small" />
                </IconButton>
              </Box>

              <Collapse in={peopleExpanded} timeout="auto" unmountOnExit>
                {deal.contact && (
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 40, height: 40 }}>
                      {deal.contact?.firstName?.charAt(0) || '?'}{deal.contact?.lastName?.charAt(0) || ''}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            color: theme.palette.primary.main,
                            cursor: 'pointer',
                            '&:hover': { textDecoration: 'underline' }
                          }}
                          onClick={() => navigate(`/contacts/${deal.contact.id}`)}
                        >
                          {deal.contact.firstName} {deal.contact.lastName} (sample)
                        </Typography>
                      </Box>
                      <Chip label="Primary contact" size="small" sx={{ fontSize: '0.7rem', height: '18px', mb: 1.5 }} />

                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5, mb: 0.5 }}>
                        Owner
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1.5 }}>
                        {ownerLoading ? 'Loading...' : owner ? `${owner.firstName} ${owner.lastName}` : 'N/A'}
                      </Typography>

                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5, mb: 0.5 }}>
                        Title
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1.5 }}>
                        {deal.contact.jobTitle || 'VP Product Management'}
                      </Typography>

                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5, mb: 0.5 }}>
                        Company
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          mb: 1.5,
                          color: theme.palette.primary.main,
                          cursor: 'pointer',
                          '&:hover': { textDecoration: 'underline' }
                        }}
                        onClick={() => deal.customer && navigate(`/customers/${deal.customer.id}`)}
                      >
                        {deal.customer ? `${deal.customer.name} (sample)` : 'N/A'}
                      </Typography>

                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5, mb: 0.5 }}>
                        Work Phone
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          mb: 1.5,
                          color: theme.palette.primary.main,
                          cursor: 'pointer',
                          '&:hover': { textDecoration: 'underline' }
                        }}
                      >
                        {deal.contact.phone || '(372)242-9880'}
                      </Typography>

                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5, mb: 0.5 }}>
                        Work Email
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          mb: 1.5,
                          color: theme.palette.primary.main,
                          cursor: 'pointer',
                          '&:hover': { textDecoration: 'underline' }
                        }}
                      >
                        {deal.contact.email || ''}
                      </Typography>

                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5, mb: 0.5 }}>
                        Company
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1.5 }}>
                        {deal.customer?.domain || '400 Golden Leaf Road, Lafayette, LA 70505, US'}
                      </Typography>

                      {/* Social Icons */}
                      <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
                        <Tooltip title={activityTypes.hasChat ? "View meetings, tasks & notes" : "No chat activities"}>
                          <IconButton
                            size="small"
                            onClick={handleChatClick}
                            sx={{
                              border: `1px solid ${activityTypes.hasChat ? theme.palette.primary.main : theme.palette.grey[300]}`,
                              bgcolor: activityTypes.hasChat ? theme.palette.primary.lighter : 'transparent',
                              color: activityTypes.hasChat ? theme.palette.primary.main : 'inherit',
                              '&:hover': {
                                bgcolor: activityTypes.hasChat ? theme.palette.primary.lighter : theme.palette.grey[50],
                                borderColor: activityTypes.hasChat ? theme.palette.primary.main : theme.palette.grey[400]
                              },
                              cursor: 'pointer'
                            }}
                          >
                            <ChatIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={activityTypes.hasEmail ? "View emails" : "No email activities"}>
                          <IconButton
                            size="small"
                            onClick={handleEmailClick}
                            sx={{
                              border: `1px solid ${activityTypes.hasEmail ? theme.palette.success.main : theme.palette.grey[300]}`,
                              bgcolor: activityTypes.hasEmail ? theme.palette.success.lighter : 'transparent',
                              color: activityTypes.hasEmail ? theme.palette.success.main : 'inherit',
                              '&:hover': {
                                bgcolor: activityTypes.hasEmail ? theme.palette.success.lighter : theme.palette.grey[50],
                                borderColor: activityTypes.hasEmail ? theme.palette.success.main : theme.palette.grey[400]
                              },
                              cursor: 'pointer'
                            }}
                          >
                            <EmailIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={activityTypes.hasPhone ? "View calls & meetings" : "No phone activities"}>
                          <IconButton
                            size="small"
                            onClick={handlePhoneClick}
                            sx={{
                              border: `1px solid ${activityTypes.hasPhone ? theme.palette.warning.main : theme.palette.grey[300]}`,
                              bgcolor: activityTypes.hasPhone ? theme.palette.warning.lighter : 'transparent',
                              color: activityTypes.hasPhone ? theme.palette.warning.main : 'inherit',
                              '&:hover': {
                                bgcolor: activityTypes.hasPhone ? theme.palette.warning.lighter : theme.palette.grey[50],
                                borderColor: activityTypes.hasPhone ? theme.palette.warning.main : theme.palette.grey[400]
                              },
                              cursor: 'pointer'
                            }}
                          >
                            <PhoneIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={activityTypes.hasOther ? "View documents & other activities" : "No other activities"}>
                          <IconButton
                            size="small"
                            onClick={handleMoreClick}
                            sx={{
                              border: `1px solid ${activityTypes.hasOther ? theme.palette.info.main : theme.palette.grey[300]}`,
                              bgcolor: activityTypes.hasOther ? theme.palette.info.lighter : 'transparent',
                              color: activityTypes.hasOther ? theme.palette.info.main : 'inherit',
                              '&:hover': {
                                bgcolor: activityTypes.hasOther ? theme.palette.info.lighter : theme.palette.grey[50],
                                borderColor: activityTypes.hasOther ? theme.palette.info.main : theme.palette.grey[400]
                              },
                              cursor: 'pointer'
                            }}
                          >
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </Box>
                )}
              </Collapse>
            </CardContent>
          </Card>

          {/* Assignees Section */}
          <AssigneeSection
            relationType="deal"
            relationId={dealId}
            assignees={deal.assignees}
            onRefresh={refreshDeal}
          />

          {/* Lead Section */}
          {enrichedLead && (
            <Card sx={{ mb: 2 }}>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: leadExpanded ? 3 : 0 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      cursor: 'pointer',
                      flex: 1,
                      '&:hover': { opacity: 0.7 }
                    }}
                    onClick={() => setLeadExpanded(!leadExpanded)}
                  >
                    <IconButton
                      size="small"
                      sx={{ p: 0.5, pointerEvents: 'none' }}
                    >
                      {leadExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                    </IconButton>
                    <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                      Source Lead
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    sx={{ border: `1px solid ${theme.palette.grey[300]}`, borderRadius: '4px' }}
                    onClick={() => navigate(`/leads/${enrichedLead.id}`)}
                  >
                    <PersonIcon fontSize="small" />
                  </IconButton>
                </Box>

                <Collapse in={leadExpanded} timeout="auto" unmountOnExit>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 40, height: 40 }}>
                      {enrichedLead.firstName?.charAt(0)}{enrichedLead.lastName?.charAt(0)}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            color: theme.palette.primary.main,
                            cursor: 'pointer',
                            '&:hover': { textDecoration: 'underline' }
                          }}
                          onClick={() => navigate(`/leads/${enrichedLead.id}`)}
                        >
                          {enrichedLead.firstName} {enrichedLead.lastName}
                        </Typography>
                        <Chip
                          label={enrichedLead.status}
                          size="small"
                          sx={{
                            fontSize: '0.7rem',
                            height: '18px',
                            bgcolor: enrichedLead.status === 'converted' ? theme.palette.success.lighter : theme.palette.warning.lighter,
                            color: enrichedLead.status === 'converted' ? theme.palette.success.dark : theme.palette.warning.main,
                            textTransform: 'capitalize'
                          }}
                        />
                      </Box>

                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5, mb: 0.5 }}>
                        Company
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1.5 }}>
                        {enrichedLead.customer?.name || 'N/A'}
                      </Typography>

                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5, mb: 0.5 }}>
                        Email
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          mb: 1.5,
                          color: theme.palette.primary.main,
                          cursor: 'pointer',
                          '&:hover': { textDecoration: 'underline' }
                        }}
                      >
                        {enrichedLead.email}
                      </Typography>

                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5, mb: 0.5 }}>
                        Phone
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          mb: 1.5,
                          color: theme.palette.primary.main,
                          cursor: 'pointer',
                          '&:hover': { textDecoration: 'underline' }
                        }}
                      >
                        {enrichedLead.phone || 'N/A'}
                      </Typography>

                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5, mb: 0.5 }}>
                        Source
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1.5 }}>
                        {enrichedLead.source || 'N/A'}
                      </Typography>

                      {enrichedLead.assignees && enrichedLead.assignees.length > 0 && (
                        <>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5, mb: 0.5 }}>
                            Lead Owner
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1.5 }}>
                            {(() => {
                              const primaryOwner = enrichedLead.assignees.find(a => a.role === 'primaryOwner');
                              if (primaryOwner && primaryOwner.user) {
                                return `${primaryOwner.user.firstName} ${primaryOwner.user.lastName}`;
                              }
                              return 'N/A';
                            })()}
                          </Typography>
                        </>
                      )}

                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5, mb: 0.5 }}>
                        Created
                      </Typography>
                      <Typography variant="body2">
                        {formatDate(enrichedLead.createdOn)}
                      </Typography>
                    </Box>
                  </Box>
                </Collapse>
              </CardContent>
            </Card>
          )}

          {/* Address Section */}
          <Card sx={{ mb: 2 }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: addressExpanded ? 3 : 0 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    cursor: 'pointer',
                    flex: 1,
                    '&:hover': { opacity: 0.7 }
                  }}
                  onClick={() => setAddressExpanded(!addressExpanded)}
                >
                  <IconButton
                    size="small"
                    sx={{ p: 0.5, pointerEvents: 'none' }}
                  >
                    {addressExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                  </IconButton>
                  <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                    Address
                  </Typography>
                </Box>
                <IconButton size="small" sx={{ border: `1px solid ${theme.palette.grey[300]}`, borderRadius: '4px' }}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Box>

              <Collapse in={addressExpanded} timeout="auto" unmountOnExit>
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <LocationOnIcon sx={{ fontSize: 40, color: theme.palette.grey[500], mb: 1 }} />
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    No Address has been added for this deal yet
                  </Typography>
                  <Button size="small" sx={{ mt: 0.5 }} startIcon={<AddIcon />}>
                    Add an address
                  </Button>
                </Box>
              </Collapse>
            </CardContent>
          </Card>


          {/* Instant Docs Section */}
          <InstantDocsSection
            title="Instant Docs"
            description="Effortlessly create personalized invoices, proposals, and contracts from your CRM data with just one click!"
            onAddClick={() => {
              // Handle add instant doc logic
              console.log('Add instant doc clicked');
            }}
            onLearnMoreClick={() => {
              // Handle learn more logic
              console.log('Learn more clicked');
            }}
            initialExpanded={true}
          />
        </Box>
      </Box>

      {/* Link Quotation Modal */}
      <LinkQuotationModal
        open={linkQuotationModalOpen}
        onClose={handleLinkQuotationModalClose}
        dealId={dealId}
        customerId={deal.customerId}
        onSubmit={handleLinkQuotations}
      />

      {/* Edit Deal Modal */}
      <CreateDealModal
        ref={createDealRef}
        open={isEditModalOpen}
        onSubmit={handleEditSubmit}
        initialData={deal}
        isEdit={true}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Deal"
      />

      {/* Success/Error Snackbar */}
      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      />
    </Box>
  );
};

export default DealDetail;
