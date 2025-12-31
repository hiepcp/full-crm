import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { RestAllCRMRepository } from '@infrastructure/repositories/RestAllCRMRepository';
import { GetCRMCustTableEntityByAccountNumUseCase } from '@application/usecases/all-crms';
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
import TeamSection from '../../components/common/TeamSection';
import customerAddressesApi from '@infrastructure/api/customerAddressesApi';
import customersApi from '@infrastructure/api/customersApi';
import contactsApi from '@infrastructure/api/contactsApi';
import teamsApi from '@infrastructure/api/teamsApi';
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

  // Team state
  const [team, setTeam] = useState(null);
  const [teamLoading, setTeamLoading] = useState(false);
  const [detailsTab, setDetailsTab] = useState(0);
  const [leadsExpanded, setLeadsExpanded] = useState(true);
  const [contactsExpanded, setContactsExpanded] = useState(true);
  const [recentActivitiesExpanded, setRecentActivitiesExpanded] = useState(true);
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
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [dealsLoading, setDealsLoading] = useState(false);
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

  // Load team when customer changes
  useEffect(() => {
    const loadTeam = async () => {
      if (customer?.salesTeamId && !team) {
        try {
          setTeamLoading(true);
          const teamData = await teamsApi.getTeam(customer.salesTeamId);
          setTeam(teamData.data.data);
        } catch (error) {
          console.error('Error loading team:', error);
          setTeam(null);
        } finally {
          setTeamLoading(false);
        }
      }
    };

    loadTeam();
  }, [customer?.salesTeamId, team]);

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

    if (customerId) {
      loadAddresses();
      loadDeals();
      loadContacts();
      loadActivities();
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
            </Collapse>
          </CardContent>
        </Card>

        {/* Team Section */}
        <TeamSection
          customer={customer}
          team={team}
          loading={teamLoading}
        />

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

