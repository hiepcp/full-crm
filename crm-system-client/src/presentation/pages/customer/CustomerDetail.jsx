import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { RestAllCRMRepository } from '@infrastructure/repositories/RestAllCRMRepository';
import { GetCRMCustTableEntityByAccountNumUseCase } from '@application/usecases/all-crms';
import CustomerDashboard from './CustomerDashboard';
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
  Tabs,
  Tab,
  Button,
  Menu,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  LinearProgress,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationOnIcon,
  ArrowDropDown as ArrowDropDownIcon,
  Person as PersonIcon,
  Sync as SyncIcon,
  MoreVert as MoreVertIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Add as AddIcon,
  Event as EventIcon,
  Description as DescriptionIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
  PieChart as PieChartIcon
} from '@mui/icons-material';
import ActivityFeed from '../../components/common/ActivityFeed';
import CustomerAddressForm from '../../components/customerAddress/CustomerAddressForm';
import CreateContact from '../contact/components/CreateContact';
import CustomerActivitySection from '../../components/customer/CustomerActivitySection';
import customerAddressesApi from '@infrastructure/api/customerAddressesApi';
import customersApi from '@infrastructure/api/customersApi';
import contactsApi from '@infrastructure/api/contactsApi';
import { formatDate } from '../../../utils/formatDate';
import { getTypeColor } from './utils/customerUtils';
import { formatCurrency } from '../../../utils/formatCurrency';
import CustomSnackbar from '@presentation/components/CustomSnackbar';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Collapse
} from '@mui/material';

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();

  // accountNum from URL (e.g., /customers/10501)
  const accountNum = id;
  // Use accountNum as customerId for local API calls that need it
  const customerId = accountNum;

  const [currentTab, setCurrentTab] = useState(0);
  const [quickActionsAnchorEl, setQuickActionsAnchorEl] = useState(null);

  // Activity form states
  const [sendEmailOpen, setSendEmailOpen] = useState(false);
  const [logCallOpen, setLogCallOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [attachFileOpen, setAttachFileOpen] = useState(false);
  const [syncEmailOpen, setSyncEmailOpen] = useState(false);

  // Collapse states
  const [customerDetailsExpanded, setCustomerDetailsExpanded] = useState(true);
  const [addressExpanded, setAddressExpanded] = useState(true);
  const [dealsExpanded, setDealsExpanded] = useState(true);
  const [detailsTab, setDetailsTab] = useState(0);
  const [leadsExpanded, setLeadsExpanded] = useState(true);
  const [contactsExpanded, setContactsExpanded] = useState(true);
  const [recentActivitiesExpanded, setRecentActivitiesExpanded] = useState(true);
  const [activitiesTableExpanded, setActivitiesTableExpanded] = useState(false);
  const [recentActivitiesPage, setRecentActivitiesPage] = useState(1);
  const recentActivitiesPerPage = 5;

  // Snackbar state for success/error notifications
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const [users, setUsers] = useState([]);

  // Customer data from Dynamics 365
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Related data (these will still use local APIs for now)
  const [addresses, setAddresses] = useState([]);
  const [deals, setDeals] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [activities, setActivities] = useState([]);
  const [leads, setLeads] = useState([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [dealsLoading, setDealsLoading] = useState(false);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [addressFormOpen, setAddressFormOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [contactFormOpen, setContactFormOpen] = useState(false);
  const [contactError, setContactError] = useState(null);
  const [contactFieldErrors, setContactFieldErrors] = useState(null);

  // Initialize repository and use case
  const allCRMRepository = useMemo(() => new RestAllCRMRepository(), []);
  const getCustomerUseCase = useMemo(() => new GetCRMCustTableEntityByAccountNumUseCase(allCRMRepository), [allCRMRepository]);

  // Load customer from Dynamics 365
  useEffect(() => {
    const fetchCustomer = async () => {
      if (!accountNum) return;
      
      try {
        setLoading(true);
        setError(null);
        const customerData = await getCustomerUseCase.execute(accountNum);
        
        if (customerData) {
          // Normalize field names from Dynamics 365
          const normalized = {
            accountNum: customerData.accountNum,
            name: customerData.name,
            nameAlias: customerData.nameAlias,
            dataAreaId: customerData.dataAreaId,
            partyNumber: customerData.partyNumber,
            
            // Classification
            custGroup: customerData.custGroup,
            custClassificationId: customerData.custClassificationId,
            blocked: customerData.blocked,
            oneTimeCustomer: customerData.oneTimeCustomer,
            
            // Geographic
            partyCountry: customerData.partyCountry,
            partyState: customerData.partyState,
            
            // Financial
            currency: customerData.currency,
            vatNum: customerData.vatNum,
            creditMax: customerData.creditMax,
            creditRating: customerData.creditRating,
            
            // Payment
            paymTermId: customerData.paymTermId,
            paymMode: customerData.paymMode,
            cashDisc: customerData.cashDisc,
            useCashDisc: customerData.useCashDisc,
            
            // Delivery
            dlvTerm: customerData.dlvTerm,
            dlvMode: customerData.dlvMode,
            freightZone: customerData.freightZone,
            
            // Shipping
            shipCarrierId: customerData.shipCarrierId,
            shipCarrierAccount: customerData.shipCarrierAccount,
            
            // RSVN Custom (matching C# property names with camelCase conversion)
            rsVnPlaceofdel: customerData.rsVnPlaceofdel,
            rsVnNotifyingParty: customerData.rsVnNotifyingParty,
            rsVnConsignee: customerData.rsVnConsignee,
            rsVnAssemblyInstruction: customerData.rsVnAssemblyInstruction,
            rsVnDocumentsneeded: customerData.rsVnDocumentsneeded,
            rsVnBookingagentinVietnam: customerData.rsVnBookingagentinVietnam,
            rsVnInspection_QCDemands: customerData.rsVnInspection_QCDemands,
            rsVnInspectionDetails: customerData.rsVnInspectionDetails,
            rsVnShippingmark: customerData.rsVnShippingmark,
            rsVnRequiredTests: customerData.rsVnRequiredTests,
            rsvn_FR: customerData.rsvn_FR,
            rsvnInternalinspection: customerData.rsvnInternalinspection,
            rsvnSoComment: customerData.rsvnSoComment,
            rsvnSalesResponsible: customerData.rsvnSalesResponsible,
            rsvnPenalty: customerData.rsvnPenalty,
            rsvn3rdinspection: customerData.rsvn3rdinspection,
            
            // VTV Custom
            vtvCustInspectionCompany: customerData.vtvCustInspectionCompany,
            vtvSOForwarder: customerData.vtvSOForwarder,
            vtvCustSpecialNotes: customerData.vtvCustSpecialNotes,
            
            // Contact info (check actual API field names)
            email: customerData.email,
            phone: customerData.phone,
            website: customerData.url,
            
            // System fields
            createdOn: customerData.createdDateTime,
            modifiedOn: customerData.modifiedDateTime,
            
            // Keep raw data for any unmapped fields
            ...customerData
          };
          
          setCustomer(normalized);
        } else {
          setError('Customer not found');
          setCustomer(null);
        }
      } catch (error) {
        console.error('Error loading customer from Dynamics 365:', error);
        setError(error.message || 'Failed to load customer');
        setCustomer(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomer();
  }, [accountNum, getCustomerUseCase]);

  // Load related data (addresses, deals, contacts, activities) from local APIs
  useEffect(() => {
    const loadAddresses = async () => {
      if (!customerId) return;
      try {
        setAddressesLoading(true);
        const response = await customerAddressesApi.getByCustomerId(customerId);
        setAddresses(response?.data?.data || []);
      } catch (error) {
        console.error('Error loading addresses:', error);
        setAddresses([]);
      } finally {
        setAddressesLoading(false);
      }
    };

    const loadDeals = async () => {
      if (!customerId) return;
      try {
        setDealsLoading(true);
        const response = await customersApi.getDealsByCustomer(customerId);
        setDeals(response?.data?.data || []);
      } catch (error) {
        console.error('Error loading deals:', error);
        setDeals([]);
      } finally {
        setDealsLoading(false);
      }
    };

    const loadContacts = async () => {
      if (!customerId) return;
      try {
        setContactsLoading(true);
        const response = await customersApi.getContactsByCustomer(customerId);
        setContacts(response?.data?.data || []);
      } catch (error) {
        console.error('Error loading contacts:', error);
        setContacts([]);
      } finally {
        setContactsLoading(false);
      }
    };

    const loadActivities = async () => {
      if (!customerId) return;
      try {
        setActivitiesLoading(true);
        const response = await customersApi.getActivitiesByCustomer(customerId);
        setActivities(response?.data?.data || []);
      } catch (error) {
        console.error('Error loading activities:', error);
        setActivities([]);
      } finally {
        setActivitiesLoading(false);
      }
    };

    const loadLeads = async () => {
      if (!customerId) return;
      try {
        setLeadsLoading(true);
        const response = await customersApi.getLeadsByCustomer(customerId);
        setLeads(response?.data?.data || []);
      } catch (error) {
        console.error('Error loading leads:', error);
        setLeads([]);
      } finally {
        setLeadsLoading(false);
      }
    };

    if (customerId) {
      loadAddresses();
      loadDeals();
      loadContacts();
      loadActivities();
      loadLeads();
    }
  }, [customerId]);

  // Helper function to get user by ID
  const getUserByIdSync = (userId) => {
    return users.find(user => user.id === parseInt(userId)) || null;
  };

  // Normalize activities to match ActivityFeed expected format
  const normalizedActivities = useMemo(() => {
    if (!activities || activities.length === 0) return [];

    return activities.map(activity => ({
      ...activity,
      created_by: activity.createdBy, // ActivityFeed expects created_by
      created_on: activity.createdOn, // ActivityFeed expects created_on
    }));
  }, [activities]);


  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleQuickActionsMenuOpen = (event) => {
    setQuickActionsAnchorEl(event.currentTarget);
  };

  const handleQuickActionsMenuClose = () => {
    setQuickActionsAnchorEl(null);
  };

  // Activity form handlers
  const handleSendEmail = () => {
    setSendEmailOpen(true);
    setQuickActionsAnchorEl(null);
  };

  const handleLogCall = () => {
    setLogCallOpen(true);
    setQuickActionsAnchorEl(null);
  };

  const handleAddNote = () => {
    setNoteOpen(true);
    setQuickActionsAnchorEl(null);
  };

  const handleAttachFile = () => {
    setAttachFileOpen(true);
    setQuickActionsAnchorEl(null);
  };

  const handleSyncEmail = () => {
    setSyncEmailOpen(true);
    setQuickActionsAnchorEl(null);
  };

  // Activity submission handler
  const handleActivitySubmit = (activityData) => {
    // In a real app, this would make an API call to save the activity
    // For now, we'll update the local activities state
    const newActivity = {
      ...activityData,
      id: Date.now(), // Generate a temporary ID
    };

    setActivities(prevActivities => [newActivity, ...prevActivities]);
  };

  // Customer Address handlers
  const handleAddAddress = () => {
    setSelectedAddress(null);
    setAddressFormOpen(true);
  };

  const handleEditAddress = (address) => {
    setSelectedAddress(address);
    setAddressFormOpen(true);
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;

    try {
      await customerAddressesApi.delete(addressId);
      setAddresses(prev => prev.filter(addr => addr.id !== addressId));
    } catch (error) {
      console.error('Error deleting address:', error);
      alert('Failed to delete address');
    }
  };

  const handleSetPrimaryAddress = async (addressId) => {
    try {
      await customerAddressesApi.setAsPrimary(addressId);
      // Reload addresses to reflect the change
      const response = await customerAddressesApi.getByCustomerId(customerId);
      setAddresses(response?.data?.data || []);
    } catch (error) {
      console.error('Error setting primary address:', error);
      alert('Failed to set primary address');
    }
  };

  const handleSetPrimaryContact = async (contactId) => {
    try {
      await contactsApi.setAsPrimary(contactId);
      // Reload contacts to reflect the change
      const response = await customersApi.getContactsByCustomer(customerId);
      setContacts(response?.data?.data || []);
    } catch (error) {
      console.error('Error setting primary contact:', error);
      alert('Failed to set primary contact');
    }
  };

  const handleAddressSubmit = async (formData) => {
    try {
      if (selectedAddress) {
        // Update existing address
        await customerAddressesApi.update(selectedAddress.id, formData);
      } else {
        // Create new address
        await customerAddressesApi.create(formData);
      }

      // Reload addresses
      const response = await customerAddressesApi.getByCustomerId(customerId);
      setAddresses(response?.data?.data || []);
      setAddressFormOpen(false);
      setSelectedAddress(null);
    } catch (error) {
      console.error('Error saving address:', error);
      alert('Failed to save address');
    }
  };

  const handleAddContact = () => {
    setContactFormOpen(true);
    setContactError(null);
    setContactFieldErrors(null);
  };

  const handleContactSubmit = async (data) => {
    try {
      const { contact } = data;
      
      // Call API to create contact
      await contactsApi.create(contact);

      // Reload contacts
      const response = await customersApi.getContactsByCustomer(customerId);
      setContacts(response?.data?.data || []);
      
      // Close dialog and reset errors
      setContactFormOpen(false);
      setContactError(null);
      setContactFieldErrors(null);
    } catch (error) {
      console.error('Failed to create contact:', error);

      // Parse server validation errors
      let fieldErrors = {};
      let generalError = 'Failed to create contact';
      const serverData = error?.response?.data;

      if (serverData?.message) {
        generalError = serverData.message;
      }

      // If API provides structured errors
      if (serverData?.errors && typeof serverData.errors === 'object') {
        Object.keys(serverData.errors).forEach((key) => {
          const val = serverData.errors[key];
          fieldErrors[key] = Array.isArray(val) ? val[0] : (val || '').toString();
        });
      }

      setContactError(generalError);
      setContactFieldErrors(Object.keys(fieldErrors).length ? fieldErrors : null);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
        <Typography variant="body1" color="text.secondary">
          Loading customer from Dynamics 365...
        </Typography>
      </Box>
    );
  }

  if (error || !customer) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" color="error">
          {error || 'Customer not found'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Account Number: {accountNum}
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
                {customer.name}
                {customer.nameAlias && customer.nameAlias !== customer.name && (
                  <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                    ({customer.nameAlias})
                  </Typography>
                )}
              </Typography>
              <Chip
                label="Dynamics 365"
                size="small"
                sx={{
                  bgcolor: theme.palette.success.lighter,
                  color: theme.palette.success.main,
                  fontWeight: 500,
                  fontSize: '0.75rem'
                }}
              />
              {customer.blocked === 'Yes' && (
                <Chip
                  label="Blocked"
                  size="small"
                  color="error"
                  sx={{ fontWeight: 500, fontSize: '0.75rem' }}
                />
              )}
              <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
                Account: {customer.accountNum}
              </Typography>
              {customer.dataAreaId && (
                <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
                  Company: {customer.dataAreaId}
                </Typography>
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <IconButton size="small" sx={{ border: `1px solid ${theme.palette.grey[300]}`, borderRadius: '4px' }}>
                <MoreVertIcon />
              </IconButton>
            </Box>
          </Box>

          {/* Tabs */}
          <Tabs 
            value={currentTab} 
            onChange={handleTabChange}
            sx={{ 
              borderTop: `1px solid ${theme.palette.grey[200]}`,
              mt: 2,
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '0.95rem'
              }
            }}
          >
            <Tab label="Overview" />
            <Tab label="Dashboard" />
          </Tabs>
        </Box>
      </Box>

      {/* Tab Content - Overview */}
      {currentTab === 0 && (
      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        gap: 2,
        p: { xs: 1, sm: 2 }
      }}>
        {/* Left - Customer Details, Activity Feed, etc. */}
        <Box sx={{ flex: 1, width: { xs: '100%', md: 'auto' } }}>
          {/* Customer Details */}
          <Card sx={{ mb: 2 }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: customerDetailsExpanded ? 3 : 0 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    cursor: 'pointer',
                    flex: 1,
                    '&:hover': { opacity: 0.7 }
                  }}
                  onClick={() => setCustomerDetailsExpanded(!customerDetailsExpanded)}
                >
                  <IconButton
                    size="small"
                    sx={{ p: 0.5, pointerEvents: 'none' }}
                  >
                    {customerDetailsExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                  </IconButton>
                  <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                    Customer Details
                  </Typography>
                </Box>
              </Box>
              <Collapse in={customerDetailsExpanded} timeout="auto" unmountOnExit>
                <Tabs 
                  value={detailsTab} 
                  onChange={(e, newValue) => setDetailsTab(newValue)}
                  sx={{ borderBottom: `1px solid ${theme.palette.grey[200]}`, mb: 2 }}
                  variant="scrollable"
                  scrollButtons="auto"
                >
                  <Tab label="Overview" />
                  <Tab label="Financial & Payment" />
                  <Tab label="Shipping & Delivery" />
                  <Tab label="Custom Fields" />
                </Tabs>

                {/* Overview Tab */}
                {detailsTab === 0 && (
                  <Box>
                    {/* Basic Information Row */}
                    <Grid container spacing={0} sx={{ width: '100%', borderTop: `1px solid ${theme.palette.grey[200]}` }}>
                  <Grid item xs={12} sm={6} md={3} sx={{ flex: 1, borderRight: { md: `1px solid ${theme.palette.grey[200]}` }, borderBottom: `1px solid ${theme.palette.grey[200]}`, p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Account Number
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {customer.accountNum || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3} sx={{ flex: 1, borderRight: { md: `1px solid ${theme.palette.grey[200]}` }, borderBottom: `1px solid ${theme.palette.grey[200]}`, p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Customer Name
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {customer.name || 'N/A'}
                    </Typography>
                    {customer.nameAlias && customer.nameAlias !== customer.name && (
                      <Typography variant="caption" color="text.secondary">
                        Alias: {customer.nameAlias}
                      </Typography>
                    )}
                  </Grid>
                  <Grid item xs={12} sm={6} md={3} sx={{ flex: 1, borderRight: { md: `1px solid ${theme.palette.grey[200]}` }, borderBottom: `1px solid ${theme.palette.grey[200]}`, p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Party Number
                    </Typography>
                    <Typography variant="body2">
                      {customer.partyNumber || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3} sx={{ flex: 1, borderBottom: `1px solid ${theme.palette.grey[200]}`, p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Company (Data Area)
                    </Typography>
                    <Typography variant="body2">
                      {customer.dataAreaId || 'N/A'}
                    </Typography>
                  </Grid>
                </Grid>

                {/* Classification & Status Row */}
                <Grid container spacing={0} sx={{ width: '100%' }}>
                  <Grid item xs={12} sm={6} md={3} sx={{ flex: 1, borderRight: { md: `1px solid ${theme.palette.grey[200]}` }, borderBottom: `1px solid ${theme.palette.grey[200]}`, p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Customer Group
                    </Typography>
                    <Chip 
                      label={customer.custGroup || 'N/A'} 
                      color="primary" 
                      variant="outlined" 
                      size="small" 
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3} sx={{ flex: 1, borderRight: { md: `1px solid ${theme.palette.grey[200]}` }, borderBottom: `1px solid ${theme.palette.grey[200]}`, p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Classification
                    </Typography>
                    <Chip 
                      label={customer.custClassificationId || 'N/A'} 
                      color={customer.custClassificationId === 'Active' ? 'success' : 'default'}
                      size="small" 
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3} sx={{ flex: 1, borderRight: { md: `1px solid ${theme.palette.grey[200]}` }, borderBottom: `1px solid ${theme.palette.grey[200]}`, p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Status
                    </Typography>
                    <Chip 
                      label={customer.blocked === 'Yes' ? 'Blocked' : 'Active'} 
                      color={customer.blocked === 'Yes' ? 'error' : 'success'}
                      size="small" 
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3} sx={{ flex: 1, borderBottom: `1px solid ${theme.palette.grey[200]}`, p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      One Time Customer
                    </Typography>
                    <Typography variant="body2">
                      {customer.oneTimeCustomer === 'Yes' ? 'Yes' : 'No'}
                    </Typography>
                  </Grid>
                </Grid>

                {/* Contact Information Row */}
                <Grid container spacing={0} sx={{ width: '100%' }}>
                  <Grid item xs={12} sm={6} md={4} sx={{ flex: 1, borderRight: { md: `1px solid ${theme.palette.grey[200]}` }, borderBottom: `1px solid ${theme.palette.grey[200]}`, p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Email
                    </Typography>
                    <Typography variant="body2" sx={{ color: customer.email ? theme.palette.primary.main : 'inherit', cursor: customer.email ? 'pointer' : 'default', '&:hover': customer.email ? { textDecoration: 'underline' } : {} }}>
                      {customer.email || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4} sx={{ flex: 1, borderRight: { md: `1px solid ${theme.palette.grey[200]}` }, borderBottom: `1px solid ${theme.palette.grey[200]}`, p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Phone
                    </Typography>
                    <Typography variant="body2" sx={{ color: customer.phone ? theme.palette.primary.main : 'inherit', cursor: customer.phone ? 'pointer' : 'default', '&:hover': customer.phone ? { textDecoration: 'underline' } : {} }}>
                      {customer.phone || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4} sx={{ flex: 1, borderBottom: `1px solid ${theme.palette.grey[200]}`, p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Website
                    </Typography>
                    <Typography variant="body2" sx={{ color: customer.website ? theme.palette.primary.main : 'inherit', cursor: customer.website ? 'pointer' : 'default', '&:hover': customer.website ? { textDecoration: 'underline' } : {} }}
                      onClick={() => customer.website && window.open(customer.website.startsWith('http') ? customer.website : `https://${customer.website}`, '_blank')}>
                      {customer.website || 'N/A'}
                    </Typography>
                  </Grid>
                </Grid>

                {/* System Information Row */}
                <Grid container spacing={0} sx={{ width: '100%' }}>
                  <Grid item xs={12} sm={6} sx={{ flex: 1, borderRight: { sm: `1px solid ${theme.palette.grey[200]}` }, borderBottom: `1px solid ${theme.palette.grey[200]}`, p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Created On
                    </Typography>
                    <Typography variant="body2">
                      {customer.createdOn ? formatDate(customer.createdOn) : 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} sx={{ flex: 1, borderBottom: `1px solid ${theme.palette.grey[200]}`, p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Modified On
                    </Typography>
                    <Typography variant="body2">
                      {customer.modifiedOn ? formatDate(customer.modifiedOn) : 'N/A'}
                    </Typography>
                  </Grid>
                </Grid>
                  </Box>
                )}

                {/* Financial & Payment Tab */}
                {detailsTab === 1 && (
                  <Box>
                    {/* Financial Information Row */}
                    <Grid container spacing={0} sx={{ width: '100%', borderTop: `1px solid ${theme.palette.grey[200]}` }}>
                  <Grid item xs={12} sm={6} md={3} sx={{ flex: 1, borderRight: { md: `1px solid ${theme.palette.grey[200]}` }, borderBottom: `1px solid ${theme.palette.grey[200]}`, p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Currency
                    </Typography>
                    <Chip 
                      label={customer.currency || 'N/A'} 
                      size="small"
                      sx={{ 
                        bgcolor: theme.palette.info.lighter,
                        color: theme.palette.info.main,
                        fontWeight: 600
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3} sx={{ flex: 1, borderRight: { md: `1px solid ${theme.palette.grey[200]}` }, borderBottom: `1px solid ${theme.palette.grey[200]}`, p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      VAT Number
                    </Typography>
                    <Typography variant="body2">
                      {customer.vatNum || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3} sx={{ flex: 1, borderRight: { md: `1px solid ${theme.palette.grey[200]}` }, borderBottom: `1px solid ${theme.palette.grey[200]}`, p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Credit Maximum
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {customer.creditMax ? `${customer.currency || ''} ${customer.creditMax}`.trim() : 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3} sx={{ flex: 1, borderBottom: `1px solid ${theme.palette.grey[200]}`, p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Credit Rating
                    </Typography>
                    <Typography variant="body2">
                      {customer.creditRating || 'N/A'}
                    </Typography>
                  </Grid>
                </Grid>

                {/* Payment Information Row */}
                <Grid container spacing={0} sx={{ width: '100%' }}>
                  <Grid item xs={12} sm={6} md={3} sx={{ flex: 1, borderRight: { md: `1px solid ${theme.palette.grey[200]}` }, borderBottom: `1px solid ${theme.palette.grey[200]}`, p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Payment Terms
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {customer.paymTermId || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3} sx={{ flex: 1, borderRight: { md: `1px solid ${theme.palette.grey[200]}` }, borderBottom: `1px solid ${theme.palette.grey[200]}`, p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Payment Mode
                    </Typography>
                    <Typography variant="body2">
                      {customer.paymMode || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3} sx={{ flex: 1, borderRight: { md: `1px solid ${theme.palette.grey[200]}` }, borderBottom: `1px solid ${theme.palette.grey[200]}`, p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Cash Discount
                    </Typography>
                    <Typography variant="body2">
                      {customer.cashDisc || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3} sx={{ flex: 1, borderBottom: `1px solid ${theme.palette.grey[200]}`, p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Use Cash Discount
                    </Typography>
                    <Typography variant="body2">
                      {customer.useCashDisc === 'Yes' ? 'Yes' : 'No'}
                    </Typography>
                  </Grid>
                </Grid>
                  </Box>
                )}

                {/* Shipping & Delivery Tab */}
                {detailsTab === 2 && (
                  <Box>
                    {/* Geographic Information Row */}
                    <Grid container spacing={0} sx={{ width: '100%', borderTop: `1px solid ${theme.palette.grey[200]}` }}>
                      <Grid item xs={12} sm={6} md={4} sx={{ flex: 1, borderRight: { md: `1px solid ${theme.palette.grey[200]}` }, borderBottom: `1px solid ${theme.palette.grey[200]}`, p: 2, minWidth: 0 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                          Country
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {customer.partyCountry || 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={4} sx={{ flex: 1, borderRight: { md: `1px solid ${theme.palette.grey[200]}` }, borderBottom: `1px solid ${theme.palette.grey[200]}`, p: 2, minWidth: 0 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                          State/Province
                        </Typography>
                        <Typography variant="body2">
                          {customer.partyState || 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={4} sx={{ flex: 1, borderBottom: `1px solid ${theme.palette.grey[200]}`, p: 2, minWidth: 0 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                          Freight Zone
                        </Typography>
                        <Typography variant="body2">
                          {customer.freightZone || 'N/A'}
                        </Typography>
                      </Grid>
                    </Grid>

                    {/* Delivery & Shipping Row */}
                    <Grid container spacing={0} sx={{ width: '100%' }}>
                  <Grid item xs={12} sm={6} md={3} sx={{ flex: 1, borderRight: { md: `1px solid ${theme.palette.grey[200]}` }, borderBottom: `1px solid ${theme.palette.grey[200]}`, p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Delivery Terms
                    </Typography>
                    <Typography variant="body2">
                      {customer.dlvTerm || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3} sx={{ flex: 1, borderRight: { md: `1px solid ${theme.palette.grey[200]}` }, borderBottom: `1px solid ${theme.palette.grey[200]}`, p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Delivery Mode
                    </Typography>
                    <Typography variant="body2">
                      {customer.dlvMode || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3} sx={{ flex: 1, borderRight: { md: `1px solid ${theme.palette.grey[200]}` }, borderBottom: `1px solid ${theme.palette.grey[200]}`, p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Ship Carrier
                    </Typography>
                    <Typography variant="body2">
                      {customer.shipCarrierId || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3} sx={{ flex: 1, borderBottom: `1px solid ${theme.palette.grey[200]}`, p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Carrier Account
                    </Typography>
                    <Typography variant="body2">
                      {customer.shipCarrierAccount || 'N/A'}
                    </Typography>
                  </Grid>
                </Grid>
                  </Box>
                )}

                {/* Custom Fields Tab */}
                {detailsTab === 3 && (
                  <Box>
                    {/* RSVN Custom Fields Row 1 - Key Information */}
                    <Grid container spacing={0} sx={{ width: '100%', borderTop: `1px solid ${theme.palette.grey[200]}` }}>
                  <Grid item xs={12} sm={6} md={3} sx={{ flex: 1, borderRight: { md: `1px solid ${theme.palette.grey[200]}` }, borderBottom: `1px solid ${theme.palette.grey[200]}`, p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Sales Responsible
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {customer.rsvnSalesResponsible || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3} sx={{ flex: 1, borderRight: { md: `1px solid ${theme.palette.grey[200]}` }, borderBottom: `1px solid ${theme.palette.grey[200]}`, p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Place of Delivery
                    </Typography>
                    <Typography variant="body2">
                      {customer.rsVnPlaceofdel || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3} sx={{ flex: 1, borderRight: { md: `1px solid ${theme.palette.grey[200]}` }, borderBottom: `1px solid ${theme.palette.grey[200]}`, p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Notifying Party
                    </Typography>
                    <Typography variant="body2">
                      {customer.rsVnNotifyingParty || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3} sx={{ flex: 1, borderBottom: `1px solid ${theme.palette.grey[200]}`, p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Consignee
                    </Typography>
                    <Typography variant="body2">
                      {customer.rsVnConsignee || 'N/A'}
                    </Typography>
                  </Grid>
                </Grid>

                {/* RSVN Custom Fields Row 2 - Additional Details */}
                <Grid container spacing={0} sx={{ width: '100%' }}>
                  <Grid item xs={12} sm={6} md={4} sx={{ flex: 1, borderRight: { md: `1px solid ${theme.palette.grey[200]}` }, borderBottom: `1px solid ${theme.palette.grey[200]}`, p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Penalty Terms
                    </Typography>
                    <Typography variant="body2">
                      {customer.rsvnPenalty || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4} sx={{ flex: 1, borderRight: { md: `1px solid ${theme.palette.grey[200]}` }, borderBottom: `1px solid ${theme.palette.grey[200]}`, p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Booking Agent (Vietnam)
                    </Typography>
                    <Typography variant="body2">
                      {customer.rsVnBookingagentinVietnam || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4} sx={{ flex: 1, borderBottom: `1px solid ${theme.palette.grey[200]}`, p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      FR Status
                    </Typography>
                    <Typography variant="body2">
                      {customer.rsvn_FR || 'N/A'}
                    </Typography>
                  </Grid>
                </Grid>

                {/* RSVN Inspection & Quality Control */}
                <Grid container spacing={0} sx={{ width: '100%' }}>
                  <Grid item xs={12} sm={6} md={4} sx={{ flex: 1, borderRight: { md: `1px solid ${theme.palette.grey[200]}` }, borderBottom: `1px solid ${theme.palette.grey[200]}`, p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      QC Demands
                    </Typography>
                    <Typography variant="body2">
                      {customer.rsVnInspection_QCDemands || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4} sx={{ flex: 1, borderRight: { md: `1px solid ${theme.palette.grey[200]}` }, borderBottom: `1px solid ${theme.palette.grey[200]}`, p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Internal Inspection
                    </Typography>
                    <Typography variant="body2">
                      {customer.rsvnInternalinspection || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4} sx={{ flex: 1, borderBottom: `1px solid ${theme.palette.grey[200]}`, p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      3rd Party Inspection
                    </Typography>
                    <Typography variant="body2">
                      {customer.rsvn3rdinspection || 'N/A'}
                    </Typography>
                  </Grid>
                </Grid>

                {/* RSVN Documentation & Instructions */}
                {(customer.rsVnDocumentsneeded || customer.rsVnAssemblyInstruction || customer.rsVnShippingmark || customer.rsVnRequiredTests || customer.rsVnInspectionDetails) && (
                  <Grid container spacing={0} sx={{ width: '100%' }}>
                    {customer.rsVnDocumentsneeded && (
                      <Grid item xs={12} sm={6} sx={{ flex: 1, borderRight: { sm: `1px solid ${theme.palette.grey[200]}` }, borderBottom: `1px solid ${theme.palette.grey[200]}`, p: 2, minWidth: 0 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                          Documents Needed
                        </Typography>
                        <Typography variant="body2">
                          {customer.rsVnDocumentsneeded}
                        </Typography>
                      </Grid>
                    )}
                    {customer.rsVnAssemblyInstruction && (
                      <Grid item xs={12} sm={6} sx={{ flex: 1, borderBottom: `1px solid ${theme.palette.grey[200]}`, p: 2, minWidth: 0 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                          Assembly Instructions
                        </Typography>
                        <Typography variant="body2">
                          {customer.rsVnAssemblyInstruction}
                        </Typography>
                      </Grid>
                    )}
                    {customer.rsVnShippingmark && (
                      <Grid item xs={12} sm={6} sx={{ flex: 1, borderRight: { sm: `1px solid ${theme.palette.grey[200]}` }, borderBottom: `1px solid ${theme.palette.grey[200]}`, p: 2, minWidth: 0 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                          Shipping Mark
                        </Typography>
                        <Typography variant="body2">
                          {customer.rsVnShippingmark}
                        </Typography>
                      </Grid>
                    )}
                    {customer.rsVnRequiredTests && (
                      <Grid item xs={12} sm={6} sx={{ flex: 1, borderBottom: `1px solid ${theme.palette.grey[200]}`, p: 2, minWidth: 0 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                          Required Tests
                        </Typography>
                        <Typography variant="body2">
                          {customer.rsVnRequiredTests}
                        </Typography>
                      </Grid>
                    )}
                    {customer.rsVnInspectionDetails && (
                      <Grid item xs={12} sx={{ borderBottom: `1px solid ${theme.palette.grey[200]}`, p: 2 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                          Inspection Details
                        </Typography>
                        <Typography variant="body2">
                          {customer.rsVnInspectionDetails}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                )}

                {/* RSVN Comments */}
                {customer.rsvnSoComment && (
                  <Grid container spacing={0} sx={{ width: '100%' }}>
                    <Grid item xs={12} sx={{ borderBottom: `1px solid ${theme.palette.grey[200]}`, p: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        Sales Order Comment
                      </Typography>
                      <Typography variant="body2">
                        {customer.rsvnSoComment}
                      </Typography>
                    </Grid>
                  </Grid>
                )}

                {/* VTV Custom Fields */}
                <Grid container spacing={0} sx={{ width: '100%' }}>
                  <Grid item xs={12} sm={6} md={4} sx={{ flex: 1, borderRight: { md: `1px solid ${theme.palette.grey[200]}` }, borderBottom: `1px solid ${theme.palette.grey[200]}`, p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      VTV SO Forwarder
                    </Typography>
                    <Typography variant="body2">
                      {customer.vtvSOForwarder || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4} sx={{ flex: 1, borderRight: { md: `1px solid ${theme.palette.grey[200]}` }, borderBottom: `1px solid ${theme.palette.grey[200]}`, p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Inspection Company
                    </Typography>
                    <Typography variant="body2">
                      {customer.vtvCustInspectionCompany || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4} sx={{ flex: 1, borderBottom: `1px solid ${theme.palette.grey[200]}`, p: 2, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Special Notes
                    </Typography>
                    <Typography variant="body2">
                      {customer.vtvCustSpecialNotes || 'N/A'}
                    </Typography>
                  </Grid>
                </Grid>
                  </Box>
                )}
              </Collapse>
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <Card sx={{ mb: 2 }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: recentActivitiesExpanded ? 3 : 0 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    cursor: 'pointer',
                    flex: 1,
                    '&:hover': { opacity: 0.7 }
                  }}
                  onClick={() => setRecentActivitiesExpanded(!recentActivitiesExpanded)}
                >
                  <IconButton
                    size="small"
                    sx={{ p: 0.5, pointerEvents: 'none' }}
                  >
                    {recentActivitiesExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                  </IconButton>
                  <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                    Recent Activities ({activities?.length || 0})
                  </Typography>
                </Box>
              </Box>

              <Collapse in={recentActivitiesExpanded}>
                {activitiesLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                    <LinearProgress sx={{ width: '100%' }} />
                  </Box>
                ) : activities && activities.length > 0 ? (
                  <List sx={{ py: 0 }}>
                    {activities.slice(0, recentActivitiesPage * recentActivitiesPerPage).map((activity, index) => {
                      const activityUser = activity.createdBy ? getUserByIdSync(activity.createdBy) : null;
                      const assignedUser = activity.assignedTo ? getUserByIdSync(activity.assignedTo) : null;
                      
                      // Get icon based on activity type
                      const getActivityIcon = () => {
                        const type = activity.activityType?.toLowerCase();
                        if (type === 'call' || type === 'phone-call') return <PhoneIcon fontSize="small" />;
                        if (type === 'email') return <EmailIcon fontSize="small" />;
                        if (type === 'meeting') return <EventIcon fontSize="small" />;
                        return <DescriptionIcon fontSize="small" />;
                      };

                      // Get priority color
                      const getPriorityColor = (priority) => {
                        const colors = {
                          'high': theme.palette.error.main,
                          'medium': theme.palette.warning.main,
                          'low': theme.palette.success.main
                        };
                        return colors[priority?.toLowerCase()] || theme.palette.grey[400];
                      };

                      // Get status color
                      const getStatusColor = (status) => {
                        const colors = {
                          'completed': 'success',
                          'pending': 'warning',
                          'cancelled': 'error',
                          'in-progress': 'info'
                        };
                        return colors[status?.toLowerCase()] || 'default';
                      };
                      
                      return (
                        <React.Fragment key={activity.id}>
                          <ListItem
                            sx={{
                              px: 0,
                              py: 0.5,
                              cursor: 'pointer',
                              borderRadius: 1,
                              transition: 'all 0.2s',
                              '&:hover': {
                                bgcolor: theme.palette.action.hover,
                                pl: 0.5
                              }
                            }}
                            onClick={() => navigate(`/activities/${activity.id}`)}
                          >
                            <ListItemAvatar sx={{ minWidth: 36 }}>
                              <Avatar
                                sx={{
                                  width: 28,
                                  height: 28,
                                  bgcolor: theme.palette.primary.lighter,
                                  color: theme.palette.primary.main
                                }}
                              >
                                {getActivityIcon()}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.25 }}>
                                  {activity.subject || 'No subject'}
                                </Typography>
                              }
                              secondary={
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 0.25 }}>
                                  {/* Activity Type */}
                                  {activity.activityType && (
                                    <Chip
                                      label={activity.activityType}
                                      size="small"
                                      sx={{ height: 18, fontSize: '0.65rem', bgcolor: theme.palette.grey[100] }}
                                    />
                                  )}
                                  
                                  {/* Status */}
                                  {activity.status && (
                                    <Chip
                                      label={activity.status}
                                      size="small"
                                      color={getStatusColor(activity.status)}
                                      sx={{ height: 18, fontSize: '0.65rem' }}
                                    />
                                  )}
                                  
                                  {/* Priority */}
                                  {activity.priority && (
                                    <Chip
                                      label={activity.priority}
                                      size="small"
                                      sx={{ 
                                        height: 18, 
                                        fontSize: '0.65rem',
                                        bgcolor: getPriorityColor(activity.priority) + '20',
                                        color: getPriorityColor(activity.priority),
                                        borderColor: getPriorityColor(activity.priority)
                                      }}
                                    />
                                  )}
                                  
                                  {/* Relation Type */}
                                  {activity.relationType && (
                                    <Chip
                                      label={activity.relationType}
                                      size="small"
                                      variant="outlined"
                                      sx={{ height: 18, fontSize: '0.65rem' }}
                                    />
                                  )}
                                  
                                  {/* Created By */}
                                  {activityUser && (
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                                      By: {activityUser.firstName} {activityUser.lastName}
                                    </Typography>
                                  )}
                                  
                                  {/* Assigned To */}
                                  {assignedUser && (
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                                      Assigned: {assignedUser.firstName} {assignedUser.lastName}
                                    </Typography>
                                  )}
                                  
                                  {/* Due Date */}
                                  {activity.dueAt && (
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                                      Due: {formatDate(activity.dueAt)}
                                    </Typography>
                                  )}
                                </Box>
                              }
                            />
                          </ListItem>
                          {index < activities.slice(0, recentActivitiesPage * recentActivitiesPerPage).length - 1 && <Divider />}
                        </React.Fragment>
                      );
                    })}
                  </List>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    <TimelineIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      No recent activities
                    </Typography>
                  </Box>
                )}
                {activities && activities.length > recentActivitiesPage * recentActivitiesPerPage && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                    <Button
                      variant="text"
                      size="small"
                      onClick={() => setRecentActivitiesPage(recentActivitiesPage + 1)}
                      sx={{ color: theme.palette.primary.main }}
                    >
                      Load More
                    </Button>
                  </Box>
                )}
              </Collapse>
            </CardContent>
          </Card>

          {/* Activity Feed */}
          <ActivityFeed
            entityType="customer"
            entityId={accountNum}
            activities={normalizedActivities}
            getUserById={getUserByIdSync}
            onActivityCreated={(data, options = {}) => {
              try {
                setActivities((prevActivities) => {
                  const existingActivities = prevActivities || [];
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
                      return prevActivities;
                    } else {
                      // Add new non-email activities to the beginning
                      updatedActivities = [data, ...existingActivities];
                      message = 'Activity created successfully';
                    }
                  }

                  return updatedActivities;
                });

                // Show success message for non-email-update cases
                if (!options.isEmailUpdate) {
                  setSnackbar({ open: true, message: 'Activity created successfully', severity: 'success' });
                }
              } catch (e) {
                setSnackbar({ open: true, message: 'Failed to update activity list', severity: 'warning' });
              }
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
                  onClick={() => navigate(`/customers/${accountNum}`)}
                >
                  {customer.name}
                </Typography>
              </>
            )}
          />

          {/* Customer Activities Table Section */}
          <CustomerActivitySection
            customerId={customerId}
            customerName={customer?.name}
            expanded={activitiesTableExpanded}
            onExpandChange={setActivitiesTableExpanded}
          />

          {/* Deals Section */}
          <Card sx={{ mt: 2, mb: 2 }}>
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
                    Deals ({dealsLoading ? '...' : deals?.length || 0})
                  </Typography>
                </Box>
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => navigate(`/deals/new?customerId=${accountNum}`)}
                >
                  Add Deal
                </Button>
              </Box>
              <Collapse in={dealsExpanded} timeout="auto" unmountOnExit>
                {dealsLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                    <LinearProgress sx={{ width: '100%' }} />
                  </Box>
                ) : deals && deals.length > 0 ? (
                  <List sx={{ py: 0 }}>
                    {deals.map((deal, index) => {
                      // Get stage color
                      const getStageColor = (stage) => {
                        const stageColors = {
                          'Prospecting': '#1976D2',
                          'Quotation': '#7B1FA2',
                          'Proposal': '#F57C00',
                          'Negotiation': '#C2185B',
                          'Closed Won': '#388E3C',
                          'Closed Lost': '#D32F2F',
                          'On Hold': '#455A64'
                        };
                        return stageColors[stage] || '#616161';
                      };

                      const stageColor = getStageColor(deal.stage);
                      const isOverdue = deal.closeDate && new Date(deal.closeDate) < new Date() &&
                        deal.stage !== 'Closed Won' && deal.stage !== 'Closed Lost';

                      return (
                        <React.Fragment key={deal.id}>
                          <ListItem
                            sx={{
                              px: 0,
                              py: 1.5,
                              cursor: 'pointer',
                              borderRadius: 1,
                              transition: 'all 0.2s',
                              '&:hover': {
                                bgcolor: theme.palette.action.hover,
                                pl: 1
                              }
                            }}
                            onClick={() => navigate(`/deals/${deal.id}`)}
                          >
                            {/* Stage Indicator */}
                            <Box
                              sx={{
                                width: 4,
                                height: 40,
                                bgcolor: stageColor,
                                borderRadius: 1,
                                mr: 2,
                                flexShrink: 0
                              }}
                            />

                            {/* Deal Info */}
                            <ListItemText
                              primary={
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      fontWeight: 600,
                                      flex: 1,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap'
                                    }}
                                  >
                                    {deal.name}
                                  </Typography>
                                  {isOverdue && (
                                    <Chip
                                      label="Overdue"
                                      size="small"
                                      color="error"
                                      sx={{ height: '18px', fontSize: '0.65rem' }}
                                    />
                                  )}
                                </Stack>
                              }
                              secondary={
                                <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 0.5 }}>
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Box component="span" sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: stageColor }} />
                                    {deal.stage}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    📅 {deal.closeDate ? formatDate(deal.closeDate) : 'No date'}
                                  </Typography>
                                </Stack>
                              }
                              sx={{ my: 0 }}
                            />

                            {/* Revenue */}
                            <Box sx={{ textAlign: 'right', ml: 2, flexShrink: 0 }}>
                              <Typography
                                variant="subtitle2"
                                sx={{
                                  fontWeight: 700,
                                  color: stageColor
                                }}
                              >
                                {formatCurrency(deal.actualRevenue || deal.expectedRevenue || 0)}
                              </Typography>
                            </Box>

                            {/* Arrow Icon */}
                            <IconButton size="small" sx={{ ml: 1 }}>
                              <ArrowDropDownIcon sx={{ transform: 'rotate(-90deg)' }} />
                            </IconButton>
                          </ListItem>
                          {index < deals.length - 1 && <Divider />}
                        </React.Fragment>
                      );
                    })}
                  </List>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    <TrendingUpIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                      No deals yet
                    </Typography>
                    <Button
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() => navigate(`/deals/new?customerId=${accountNum}`)}
                    >
                      Add Deal
                    </Button>
                  </Box>
                )}
              </Collapse>
            </CardContent>
          </Card>

        </Box>

        {/* Right Sidebar */}
        <Box sx={{
          width: { xs: '100%', md: '340px' },
          flexShrink: 0
        }}>
          {/* Contacts Section */}
          <Card sx={{ mb: 2 }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: contactsExpanded ? 2 : 0 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    cursor: 'pointer',
                    flex: 1,
                    '&:hover': { opacity: 0.7 }
                  }}
                  onClick={() => setContactsExpanded(!contactsExpanded)}
                >
                  <IconButton
                    size="small"
                    sx={{ p: 0.5, pointerEvents: 'none' }}
                  >
                    {contactsExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                  </IconButton>
                  <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                    Contacts ({contactsLoading ? '...' : contacts?.length || 0})
                  </Typography>
                </Box>
                <Button 
                  size="small" 
                  startIcon={<AddIcon />}
                  onClick={handleAddContact}
                >
                  Add Contact
                </Button>
              </Box>
              <Collapse in={contactsExpanded} timeout="auto" unmountOnExit>
                {contactsLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                    <LinearProgress sx={{ width: '100%' }} />
                  </Box>
                ) : contacts && contacts.length > 0 ? (
                  <List sx={{ py: 0 }}>
                    {contacts.map((contact) => (
                      <ListItem
                        key={contact.id}
                        sx={{
                          cursor: 'pointer',
                          borderRadius: 1,
                          mb: 0.5,
                          bgcolor: contact.isPrimary ? theme.palette.primary.lighter : 'transparent',
                          '&:hover': { bgcolor: contact.isPrimary ? theme.palette.primary.lighter : 'action.hover' }
                        }}
                        secondaryAction={
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            {!contact.isPrimary && (
                              <Tooltip title="Set as primary">
                                <IconButton
                                  size="small"
                                  edge="end"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSetPrimaryContact(contact.id);
                                  }}
                                >
                                  <PersonIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        }
                        onClick={() => navigate(`/contacts/${contact.id}`)}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                            {contact.firstName?.charAt(0)}{contact.lastName?.charAt(0)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <span>{`${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'N/A'}</span>
                              {contact.isPrimary && (
                                <Chip label="Primary" size="small" color="primary" sx={{ height: 18, fontSize: '0.7rem' }} />
                              )}
                            </Box>
                          }
                          secondary={`${contact.jobTitle || 'No title'} • ${contact.email || 'No email'}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    <PersonIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                      No contacts yet
                    </Typography>
                    <Button
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={handleAddContact}
                    >
                      Add Contact
                    </Button>
                  </Box>
                )}
              </Collapse>
            </CardContent>
          </Card>

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
                    Addresses ({addresses.length})
                  </Typography>
                </Box>
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={handleAddAddress}
                >
                  Add Address
                </Button>
              </Box>
              <Collapse in={addressExpanded} timeout="auto" unmountOnExit>
                {addressesLoading ? (
                  <Box sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="body2" color="text.secondary">Loading addresses...</Typography>
                  </Box>
                ) : addresses.length > 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {addresses.map((address) => (
                      <Box
                        key={address.id}
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          border: `1px solid ${theme.palette.grey[200]}`,
                          bgcolor: address.isPrimary ? theme.palette.primary.lighter : 'transparent',
                          transition: 'box-shadow 0.2s ease-in-out',
                          '&:hover': {
                            boxShadow: theme.shadows[3]
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LocationOnIcon sx={{ fontSize: 20, color: theme.palette.primary.main }} />
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
                              {address.addressType}
                            </Typography>
                            {address.isPrimary && (
                              <Chip label="Primary" size="small" color="primary" sx={{ height: 20, fontSize: '0.7rem' }} />
                            )}
                          </Box>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            {!address.isPrimary && (
                              <Tooltip title="Set as primary">
                                <IconButton
                                  size="small"
                                  onClick={() => handleSetPrimaryAddress(address.id)}
                                >
                                  <BusinessIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            <IconButton
                              size="small"
                              onClick={() => handleEditAddress(address)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteAddress(address.id)}
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>

                        {address.companyName && (
                          <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                            {address.companyName}
                          </Typography>
                        )}

                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                          {address.addressLine}
                        </Typography>

                        <Typography variant="body2" color="text.secondary">
                          {[address.city, address.postcode].filter(Boolean).join(', ')}
                        </Typography>

                        {address.country && (
                          <Typography variant="body2" color="text.secondary">
                            {address.country}
                          </Typography>
                        )}

                        {(address.contactPerson || address.email || address.telephoneNo) && (
                          <Box sx={{ mt: 1, pt: 1, borderTop: `1px solid ${theme.palette.grey[200]}` }}>
                            {address.contactPerson && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                Contact: {address.contactPerson}
                              </Typography>
                            )}
                            {address.email && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                Email: {address.email}
                              </Typography>
                            )}
                            {address.telephoneNo && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                Phone: {address.telephoneNo}
                              </Typography>
                            )}
                          </Box>
                        )}

                        {address.portOfDestination && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                            Port: {address.portOfDestination}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <LocationOnIcon sx={{ fontSize: 48, color: theme.palette.grey[300], mb: 1 }} />
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      No addresses yet
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={handleAddAddress}
                    >
                      Add First Address
                    </Button>
                  </Box>
                )}
              </Collapse>
            </CardContent>
          </Card>
        </Box>
      </Box>
      )}

      {/* Dashboard Tab */}
      {currentTab === 1 && (
        <Box sx={{ p: { xs: 1, sm: 2 } }}>
          <CustomerDashboard
            customer={customer}
            deals={deals}
            leads={leads}
            activities={activities}
            contacts={contacts}
          />
        </Box>
      )}

      <CustomerAddressForm
        open={addressFormOpen}
        onClose={() => {
          setAddressFormOpen(false);
          setSelectedAddress(null);
        }}
        onSubmit={handleAddressSubmit}
        address={selectedAddress}
        customerId={accountNum}
      />

      {/* Contact Form Dialog */}
      <Dialog
        open={contactFormOpen}
        onClose={() => setContactFormOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Add New Contact
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create a new contact for {customer?.name}
          </Typography>
        </DialogTitle>
        <DialogContent dividers sx={{ px: 3, py: 2 }}>
          <CreateContact
            onSubmit={handleContactSubmit}
            isEdit={false}
            showActions={false}
            initialData={{
              customerId: accountNum
            }}
            serverError={contactError}
            serverFieldErrors={contactFieldErrors}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => setContactFormOpen(false)}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              // Trigger form submit from CreateContact
              const form = document.querySelector('form');
              if (form) form.requestSubmit();
            }}
            variant="contained"
          >
            Create Contact
          </Button>
        </DialogActions>
      </Dialog>

      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      />
    </Box>
  );
};

export default CustomerDetail;

