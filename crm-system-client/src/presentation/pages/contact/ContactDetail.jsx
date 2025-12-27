import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Grid,
  Avatar,
  Button,
  IconButton,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Breadcrumbs,
  Link as MuiLink
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocationOn as LocationOnIcon,
  MoreVert as MoreVertIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Add as AddIcon,
  Event as EventIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Task as TaskIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import contactsApi from '@infrastructure/api/contactsApi';
import { formatDate } from '../../../utils/formatDate';

const ContactDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const contactId = id ? parseInt(id, 10) : null;

  // State for contact data
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Collapse states
  const [contactDetailsExpanded, setContactDetailsExpanded] = useState(true);
  const [dealsExpanded, setDealsExpanded] = useState(true);
  const [activitiesExpanded, setActivitiesExpanded] = useState(true);
  const [relatedContactsExpanded, setRelatedContactsExpanded] = useState(true);

  // Related data states
  const [deals, setDeals] = useState([]);
  const [dealsLoading, setDealsLoading] = useState(false);
  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [relatedContacts, setRelatedContacts] = useState([]);
  const [relatedContactsLoading, setRelatedContactsLoading] = useState(false);

  // Load contact data
  useEffect(() => {
    const loadContact = async () => {
      if (!contactId) return;

      try {
        setLoading(true);
        const response = await contactsApi.getById(contactId);
        setContact(response?.data.data || null);
        setError(null);
      } catch (err) {
        console.error('Error loading contact:', err);
        setError('Failed to load contact');
      } finally {
        setLoading(false);
      }
    };

    loadContact();
  }, [contactId]);

  // Load deals
  useEffect(() => {
    const loadDeals = async () => {
      if (!contactId) return;

      try {
        setDealsLoading(true);
        const response = await contactsApi.getDealsByContact(contactId);
        setDeals(response?.data || []);
      } catch (error) {
        console.error('Error loading deals:', error);
        setDeals([]);
      } finally {
        setDealsLoading(false);
      }
    };

    if (contact && dealsExpanded) {
      loadDeals();
    }
  }, [contactId, contact, dealsExpanded]);

  // Load activities
  useEffect(() => {
    const loadActivities = async () => {
      if (!contactId) return;

      try {
        setActivitiesLoading(true);
        const response = await contactsApi.getActivitiesByContact(contactId);
        setActivities(response?.data || []);
      } catch (error) {
        console.error('Error loading activities:', error);
        setActivities([]);
      } finally {
        setActivitiesLoading(false);
      }
    };

    if (contact && activitiesExpanded) {
      loadActivities();
    }
  }, [contactId, contact, activitiesExpanded]);

  // Load related contacts (same customer)
  useEffect(() => {
    const loadRelatedContacts = async () => {
      if (!contact?.customerId) return;

      try {
        setRelatedContactsLoading(true);
        const response = await contactsApi.getByCustomer(contact.customerId);
        // Filter out current contact
        const others = (response?.data?.data || []).filter(c => c.id !== contactId);
        setRelatedContacts(others);
      } catch (error) {
        console.error('Error loading related contacts:', error);
        setRelatedContacts([]);
      } finally {
        setRelatedContactsLoading(false);
      }
    };

    if (contact && relatedContactsExpanded) {
      loadRelatedContacts();
    }
  }, [contact, contactId, relatedContactsExpanded]);

  const handleSetPrimaryContact = async (newPrimaryContactId) => {
    try {
      await contactsApi.setAsPrimary(newPrimaryContactId);
      // Reload current contact data
      const contactResponse = await contactsApi.getById(contactId);
      setContact(contactResponse?.data.data || null);
      // Reload related contacts
      if (contact?.customerId) {
        const response = await contactsApi.getByCustomer(contact.customerId);
        const others = (response?.data?.data || []).filter(c => c.id !== contactId);
        setRelatedContacts(others);
      }
    } catch (error) {
      console.error('Error setting primary contact:', error);
      alert('Failed to set primary contact');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !contact) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" color="error">
          {error || 'Contact not found'}
        </Typography>
      </Box>
    );
  }

  const fullName = `${contact.salutation || ''} ${contact.firstName || ''} ${contact.lastName || ''}`.trim();

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
                {fullName}
              </Typography>
              <Chip
                label="Contact"
                size="small"
                sx={{
                  bgcolor: theme.palette.primary.lighter,
                  color: theme.palette.primary.main,
                  fontWeight: 500,
                  fontSize: '0.75rem'
                }}
              />
              {contact.isPrimary && (
                <Chip
                  label="Primary"
                  size="small"
                  color="primary"
                  sx={{ fontWeight: 500, fontSize: '0.75rem' }}
                />
              )}
              <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
                ID: {contactId}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<EditIcon />}
                onClick={() => navigate(`/contacts/${contactId}/edit`)}
              >
                Edit
              </Button>
              <IconButton size="small" sx={{ border: `1px solid ${theme.palette.grey[300]}`, borderRadius: '4px' }}>
                <DeleteIcon />
              </IconButton>
              <IconButton size="small" sx={{ border: `1px solid ${theme.palette.grey[300]}`, borderRadius: '4px' }}>
                <MoreVertIcon />
              </IconButton>
            </Box>
          </Box>

          {/* Contact Info Row with Avatar */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, pt: 2, borderTop: `1px solid ${theme.palette.grey[200]}` }}>
            <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 48, height: 48 }}>
              {contact.firstName?.charAt(0)}{contact.lastName?.charAt(0)}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {fullName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {contact.jobTitle || 'No title'} {contact.jobTitle && contact.email ? '•' : ''} {contact.email || ''}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {contact.phone && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <PhoneIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Typography variant="body2" sx={{ color: theme.palette.primary.main, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                    {contact.phone}
                  </Typography>
                </Box>
              )}
              {contact.email && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <EmailIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Typography variant="body2" sx={{ color: theme.palette.primary.main, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                    {contact.email}
                  </Typography>
                </Box>
              )}
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
        {/* Left - Contact Details */}
        <Box sx={{ flex: 1, width: { xs: '100%', md: 'auto' } }}>
          {/* Contact Details */}
          <Card sx={{ mb: 2 }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: contactDetailsExpanded ? 3 : 0 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    cursor: 'pointer',
                    flex: 1,
                    '&:hover': { opacity: 0.7 }
                  }}
                  onClick={() => setContactDetailsExpanded(!contactDetailsExpanded)}
                >
                  <IconButton
                    size="small"
                    sx={{ p: 0.5, pointerEvents: 'none' }}
                  >
                    {contactDetailsExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                  </IconButton>
                  <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                    Contact Details
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
              <Collapse in={contactDetailsExpanded} timeout="auto" unmountOnExit>
                {/* Contact Information Row */}
                <Grid container spacing={0} sx={{ width: '100%', borderTop: `1px solid ${theme.palette.grey[200]}` }}>
                  <Grid item xs={12} sm={6} md={3} sx={{ flex: 1, borderRight: { md: `1px solid ${theme.palette.grey[200]}` }, borderBottom: `1px solid ${theme.palette.grey[200]}`, p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Email
                    </Typography>
                    <Typography variant="body2" sx={{ color: theme.palette.primary.main, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                      {contact.email || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3} sx={{ flex: 1, borderRight: { md: `1px solid ${theme.palette.grey[200]}` }, borderBottom: `1px solid ${theme.palette.grey[200]}`, p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Phone
                    </Typography>
                    <Typography variant="body2" sx={{ color: theme.palette.primary.main, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                      {contact.phone || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3} sx={{ flex: 1, borderRight: { md: `1px solid ${theme.palette.grey[200]}` }, borderBottom: `1px solid ${theme.palette.grey[200]}`, p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Mobile Phone
                    </Typography>
                    <Typography variant="body2" sx={{ color: theme.palette.primary.main, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                      {contact.mobilePhone || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3} sx={{ flex: 1, borderBottom: `1px solid ${theme.palette.grey[200]}`, p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Fax
                    </Typography>
                    <Typography variant="body2">
                      {contact.fax || 'N/A'}
                    </Typography>
                  </Grid>
                </Grid>

                {/* Professional Information Row */}
                <Grid container spacing={0} sx={{ width: '100%' }}>
                  <Grid item xs={12} sm={6} md={3} sx={{ flex: 1, borderRight: { md: `1px solid ${theme.palette.grey[200]}` }, borderBottom: `1px solid ${theme.palette.grey[200]}`, p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Job Title
                    </Typography>
                    <Typography variant="body2">
                      {contact.jobTitle || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3} sx={{ flex: 1, borderRight: { md: `1px solid ${theme.palette.grey[200]}` }, borderBottom: `1px solid ${theme.palette.grey[200]}`, p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Salutation
                    </Typography>
                    <Typography variant="body2">
                      {contact.salutation || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3} sx={{ flex: 1, borderRight: { md: `1px solid ${theme.palette.grey[200]}` }, borderBottom: `1px solid ${theme.palette.grey[200]}`, p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Customer
                    </Typography>
                    <Typography variant="body2" sx={{ color: theme.palette.primary.main, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }} onClick={() => contact.customerId && navigate(`/customers/${contact.customerId}`)}>
                      {contact.customerId ? `View Customer #${contact.customerId}` : 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3} sx={{ flex: 1, borderBottom: `1px solid ${theme.palette.grey[200]}`, p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Status
                    </Typography>
                    {contact.isPrimary ? (
                      <Chip label="Primary Contact" color="primary" size="small" />
                    ) : (
                      <Chip label="Standard Contact" variant="outlined" size="small" />
                    )}
                  </Grid>
                </Grid>

                {/* Address & System Information Row */}
                <Grid container spacing={0} sx={{ width: '100%' }}>
                  <Grid item xs={12} sm={6} sx={{ flex: 1, borderRight: { sm: `1px solid ${theme.palette.grey[200]}` }, borderBottom: `1px solid ${theme.palette.grey[200]}`, p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Address
                    </Typography>
                    <Typography variant="body2">
                      {contact.address || 'No address provided'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} sx={{ flex: 1, borderBottom: `1px solid ${theme.palette.grey[200]}`, p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Notes
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {contact.notes || 'No notes'}
                    </Typography>
                  </Grid>
                </Grid>

                {/* Metadata Row */}
                <Grid container spacing={0} sx={{ width: '100%' }}>
                  <Grid item xs={12} sm={6} md={3} sx={{ flex: 1, borderRight: { md: `1px solid ${theme.palette.grey[200]}` }, p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Created On
                    </Typography>
                    <Typography variant="body2">
                      {formatDate(contact.createdOn)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3} sx={{ flex: 1, borderRight: { md: `1px solid ${theme.palette.grey[200]}` }, p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Created By
                    </Typography>
                    <Typography variant="body2">
                      {contact.createdBy || 'System'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3} sx={{ flex: 1, p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Updated On
                    </Typography>
                    <Typography variant="body2">
                      {contact.updatedOn ? formatDate(contact.updatedOn) : 'Never'}
                    </Typography>
                  </Grid>
                </Grid>
              </Collapse>
            </CardContent>
          </Card>


          {/* Deals Card */}
          <Card sx={{ mt: 2 }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: dealsExpanded ? 2 : 0 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    cursor: 'pointer',
                    flex: 1,
                    '&:hover': { opacity: 0.7 }
                  }}
                  onClick={() => setDealsExpanded(!dealsExpanded)}
                >
                  <IconButton
                    size="small"
                    sx={{ p: 0.5, pointerEvents: 'none' }}
                  >
                    {dealsExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                  </IconButton>
                  <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                    Deals
                  </Typography>
                </Box>
              </Box>
              <Collapse in={dealsExpanded} timeout="auto" unmountOnExit>
                <Box sx={{ mt: 2 }}>
                  {dealsLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : deals.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                      No deals found for this contact.
                    </Typography>
                  ) : (
                    <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #e5e7eb' }}>
                      <Table>
                        <TableHead>
                          <TableRow sx={{ bgcolor: '#f8fafc' }}>
                            <TableCell>Name</TableCell>
                            <TableCell>Expected Revenue</TableCell>
                            <TableCell>Stage</TableCell>
                            <TableCell>Close Date</TableCell>
                          </TableRow>
                        </TableHead>
                        {/* <TableBody>
                          {deals.map((deal) => (
                            <TableRow key={deal.id} hover onClick={() => navigate(`/deals/${deal.id}`)} sx={{ cursor: 'pointer' }}>
                              <TableCell>{deal.name}</TableCell>
                              <TableCell>${deal.expectedRevenue?.toLocaleString()}</TableCell>
                              <TableCell>
                                <Chip 
                                  label={deal.stage} 
                                  size="small" 
                                  sx={{ 
                                    bgcolor: deal.stage === 'Closed Won' ? '#e8f5e9' : '#fff3e0',
                                    color: deal.stage === 'Closed Won' ? '#2e7d32' : '#e65100'
                                  }}
                                />
                              </TableCell>
                              <TableCell>{deal.closeDate ? formatDate(deal.closeDate) : 'N/A'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody> */}
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              </Collapse>
            </CardContent>
          </Card>

          {/* Activities Card */}
          <Card sx={{ mt: 2 }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: activitiesExpanded ? 2 : 0 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    cursor: 'pointer',
                    flex: 1,
                    '&:hover': { opacity: 0.7 }
                  }}
                  onClick={() => setActivitiesExpanded(!activitiesExpanded)}
                >
                  <IconButton
                    size="small"
                    sx={{ p: 0.5, pointerEvents: 'none' }}
                  >
                    {activitiesExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                  </IconButton>
                  <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                    Activities
                  </Typography>
                </Box>
              </Box>
              <Collapse in={activitiesExpanded} timeout="auto" unmountOnExit>
                <Box sx={{ mt: 2 }}>
                  {activitiesLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : activities.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                      No activities found for this contact.
                    </Typography>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {/* {activities.map((activity) => (
                        <Box
                          key={activity.id}
                          sx={{
                            p: 2,
                            border: '1px solid #e5e7eb',
                            borderRadius: 1,
                            '&:hover': { bgcolor: '#f8fafc' },
                            cursor: 'pointer'
                          }}
                          onClick={() => navigate(`/activities/${activity.id}`)}
                        >
                          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                            <Box sx={{ 
                              bgcolor: 'primary.light', 
                              color: 'primary.main', 
                              p: 0.75, 
                              borderRadius: 1,
                              display: 'flex',
                              alignItems: 'center'
                            }}>
                              {getActivityIcon(activity.activityType)}
                            </Box>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                {activity.subject || 'No subject'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                {activity.activityType} • {activity.status}
                              </Typography>
                              {activity.body && (
                                <Typography variant="body2" color="text.secondary" sx={{ 
                                  mt: 0.5,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical'
                                }}>
                                  {activity.body}
                                </Typography>
                              )}
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                {activity.dueAt ? formatDate(activity.dueAt) : formatDate(activity.createdOn)}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      ))} */}
                    </Box>
                  )}
                </Box>
              </Collapse>
            </CardContent>
          </Card>

        </Box>

        {/* Right Sidebar - Quick Info */}
        <Box sx={{
          width: { xs: '100%', md: '340px' },
          flexShrink: 0
        }}>

          {/* Address Card */}
          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <LocationOnIcon fontSize="small" color="action" />
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                  Address
                </Typography>
              </Box>

              {contact.address ? (
                <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                  {contact.address}
                </Typography>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  No address provided
                </Typography>
              )}

              {/* Notes */}
              {contact.notes && (
                <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e5e7eb' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                    Notes
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {contact.notes}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Related Contacts Card */}
          {contact?.customerId && (
            <Card sx={{ mt: 2 }}>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: relatedContactsExpanded ? 2 : 0 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      cursor: 'pointer',
                      flex: 1,
                      '&:hover': { opacity: 0.7 }
                    }}
                    onClick={() => setRelatedContactsExpanded(!relatedContactsExpanded)}
                  >
                    <IconButton
                      size="small"
                      sx={{ p: 0.5, pointerEvents: 'none' }}
                    >
                      {relatedContactsExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                    </IconButton>
                    <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                      Other Contacts ({relatedContactsLoading ? '...' : relatedContacts?.length || 0})
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => navigate(`/contacts/new?customerId=${contact.customerId}`)}
                  >
                    Add
                  </Button>
                </Box>
                <Collapse in={relatedContactsExpanded} timeout="auto" unmountOnExit>
                  {relatedContactsLoading ? (
                    <Box sx={{ textAlign: 'center', py: 2 }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : relatedContacts && relatedContacts.length > 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {relatedContacts.map((relContact) => (
                        <Box
                          key={relContact.id}
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            border: `1px solid ${theme.palette.grey[200]}`,
                            bgcolor: relContact.isPrimary ? theme.palette.primary.lighter : 'transparent',
                            transition: 'box-shadow 0.2s ease-in-out',
                            '&:hover': {
                              boxShadow: theme.shadows[3]
                            }
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, cursor: 'pointer' }}
                              onClick={() => navigate(`/contacts/${relContact.id}`)}>
                              <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 32, height: 32 }}>
                                {relContact.firstName?.charAt(0)}{relContact.lastName?.charAt(0)}
                              </Avatar>
                              <Box sx={{ flex: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                                    {`${relContact.firstName || ''} ${relContact.lastName || ''}`.trim() || 'N/A'}
                                  </Typography>
                                  {relContact.isPrimary && (
                                    <Chip label="Primary" size="small" color="primary" sx={{ height: 18, fontSize: '0.65rem' }} />
                                  )}
                                </Box>
                                <Typography variant="caption" color="text.secondary">
                                  {relContact.jobTitle || 'No title'}
                                </Typography>
                              </Box>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              {!relContact.isPrimary && (
                                <IconButton
                                  size="small"
                                  onClick={() => handleSetPrimaryContact(relContact.id)}
                                  title="Set as primary"
                                >
                                  <PersonIcon fontSize="small" />
                                </IconButton>
                              )}
                              <IconButton
                                size="small"
                                onClick={() => navigate(`/contacts/${relContact.id}`)}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </Box>
                          {relContact.email && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              {relContact.email}
                            </Typography>
                          )}
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                      <PersonIcon sx={{ fontSize: 32, color: theme.palette.grey[300], mb: 1 }} />
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                        No other contacts
                      </Typography>
                      <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => navigate(`/contacts/new?customerId=${contact.customerId}`)}
                      >
                        Add Contact
                      </Button>
                    </Box>
                  )}
                </Collapse>
              </CardContent>
            </Card>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default ContactDetail;

