import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Divider,
  List,
  ListItem,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Collapse,
  IconButton,
  Alert
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  Business as BusinessIcon,
  People as PeopleIcon,
  Search as SearchIcon,
  Description as DescriptionIcon,
  AttachMoney as MoneyIcon,
  LocationOn as LocationIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { getQuotations, getDealQuotations } from '../../../data';
import NumberField from '../common/NumberField';
import { formatCurrency } from '@src/utils/formatCurrency';

// Helper function to get address type label
const getAddressTypeLabel = (type) => {
  const labels = {
    'legal': 'Legal Address',
    'delivery': 'Delivery Address',
    'forwarder': 'Forwarder',
    'forwarder_agent_asia': 'Forwarder Agent Asia',
    'other': 'Other'
  };
  return labels[type] || type;
};

const ConvertToDealForm = ({
  open,
  onClose,
  onSubmit,
  lead
}) => {
  // Form data
  const [formData, setFormData] = useState({
    dealName: '',
    expectedRevenue: '',
    closeDate: dayjs().add(1, 'month').format('YYYY-MM-DD'),
    stage: 'Prospecting',
    dealDescription: '',
    note: '',
    selectedQuotationNumbers: [],
    createContact: true
  });

  // Data states
  const [quotations, setQuotations] = useState([]);
  const [unlinkedQuotations, setUnlinkedQuotations] = useState([]);
  const [leadAddresses, setLeadAddresses] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // UI states
  const [quotationsExpanded, setQuotationsExpanded] = useState(true);
  const [addressesExpanded, setAddressesExpanded] = useState(true);

  // Load data when dialog opens
  useEffect(() => {
    if (open && lead) {
      // Reset form data
      setFormData({
        dealName: `Deal with ${lead?.company || 'Company'}`,
        expectedRevenue: '',
        closeDate: dayjs().add(1, 'month').format('YYYY-MM-DD'),
        stage: 'Prospecting',
        dealDescription: '',
        note: '',
        selectedQuotationNumbers: [],
        createContact: true
      });

      // Load quotations and lead addresses
      loadConversionData();
    }
  }, [open, lead]);

  const loadConversionData = async () => {
    setLoadingData(true);
    try {
      // Load all quotations
      const allQuotations = await getQuotations();
      setQuotations(allQuotations);

      // Try to load deal quotations to filter unlinked ones
      // If API doesn't exist, we'll show all quotations
      let linkedQuotationNumbers = new Set();
      try {
        const allDealQuotations = await getDealQuotations();
        linkedQuotationNumbers = new Set(
          allDealQuotations.map(dq => dq.quotationNumber)
        );
      } catch (dealQuotationError) {
        // API endpoint might not exist, show all quotations
        console.warn('Could not load deal quotations, showing all quotations:', dealQuotationError);
      }

      // Filter unlinked quotations
      const unlinked = allQuotations.filter(q => !linkedQuotationNumbers.has(q.quotationNumber));
      setUnlinkedQuotations(unlinked);

      // Lead addresses are already available in lead object
      setLeadAddresses(lead.addresses || []);
    } catch (error) {
      console.error('Error loading conversion data:', error);
      // On error, still try to show quotations if available
      try {
        const allQuotations = await getQuotations();
        setQuotations(allQuotations);
        setUnlinkedQuotations(allQuotations);
      } catch (quotationError) {
        console.error('Error loading quotations:', quotationError);
      }
    } finally {
      setLoadingData(false);
    }
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    const conversionData = {
      // Deal information
      name: formData.dealName,
      description: formData.dealDescription,
      stage: formData.stage,
      expectedRevenue: formData.expectedRevenue ? parseFloat(formData.expectedRevenue) : null,
      closeDate: formData.closeDate || null,
      note: formData.note,

      // Quotation selection
      selectedQuotationNumbers: formData.selectedQuotationNumbers,

      // Contact creation option
      createContact: formData.createContact
    };

    try {
      await onSubmit(conversionData);
      // Dialog is closed by parent component (handleConvertSubmit) on success
    } catch (error) {
      console.error('Error converting lead to deal:', error);
      // Dialog remains open on error, error handling is done by parent component
    }
  };

  const isFormValid = formData.dealName && formData.expectedRevenue && formData.closeDate;

  // Filter quotations by search term
  const filteredQuotations = unlinkedQuotations.filter(quotation =>
    searchTerm === '' ||
    quotation.quotationNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quotation.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quotation.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { minHeight: '80vh' }
      }}
    >
      <DialogTitle sx={{ pb: 1, bgcolor: '#f8f9fa', borderBottom: '1px solid #e9ecef' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <CheckCircleIcon color="success" sx={{ fontSize: 28 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Convert Lead to Deal</Typography>
            <Typography variant="body2" color="text.secondary">
              Transform this qualified lead into a business opportunity
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ px: 3, py: 3 }}>
        {/* Lead Information Summary */}
        <Box sx={{
          mb: 3,
          p: 2.5,
          bgcolor: '#e3f2fd',
          borderRadius: 2,
          border: '1px solid #90caf9',
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          <Box sx={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            bgcolor: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
              {lead?.firstName?.charAt(0)}{lead?.lastName?.charAt(0)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, color: 'primary.main' }}>
              Converting Lead:
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              <strong>{lead?.firstName} {lead?.lastName}</strong> from <strong>{lead?.company}</strong>
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Section 1: Customer Preview */}
          <Box>
            <Typography variant="h6" sx={{ 
              fontWeight: 600, 
              mb: 2, 
              color: 'primary.main', 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1 
            }}>
              <BusinessIcon />
              Customer Information (Will be created/linked)
            </Typography>

            <Paper sx={{
              p: 2.5,
              bgcolor: '#f5f5f5',
              border: '1px solid #e0e0e0'
            }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                <strong>Step 1:</strong> A prospect customer will be created from lead information or linked if already exists
              </Alert>
              
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Customer Name"
                    value={lead?.company || lead?.firstName + ' ' + lead?.lastName || ''}
                    InputProps={{
                      readOnly: true,
                    }}
                    variant="outlined"
                    size="small"
                    sx={{
                      bgcolor: 'white',
                      '& .MuiInputBase-input': {
                        color: 'text.primary',
                        fontWeight: 500
                      }
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={lead?.email || ''}
                    InputProps={{
                      readOnly: true,
                    }}
                    variant="outlined"
                    size="small"
                    sx={{ bgcolor: 'white' }}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Phone"
                    value={lead?.telephoneNo || ''}
                    InputProps={{
                      readOnly: true,
                    }}
                    variant="outlined"
                    size="small"
                    sx={{ bgcolor: 'white' }}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Website"
                    value={lead?.website || ''}
                    InputProps={{
                      readOnly: true,
                    }}
                    variant="outlined"
                    size="small"
                    sx={{ bgcolor: 'white' }}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="VAT Number"
                    value={lead?.vatNumber || 'N/A'}
                    InputProps={{
                      readOnly: true,
                    }}
                    variant="outlined"
                    size="small"
                    sx={{ bgcolor: 'white' }}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Country"
                    value={lead?.country || 'N/A'}
                    InputProps={{
                      readOnly: true,
                    }}
                    variant="outlined"
                    size="small"
                    sx={{ bgcolor: 'white' }}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Payment Terms"
                    value={lead?.paymentTerms || 'N/A'}
                    InputProps={{
                      readOnly: true,
                    }}
                    variant="outlined"
                    size="small"
                    sx={{ bgcolor: 'white' }}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Section 2: Deal Information */}
          <Box>
            <Typography variant="h6" sx={{ 
              fontWeight: 600, 
              mb: 2, 
              color: 'primary.main', 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1 
            }}>
              <MoneyIcon />
              Deal Information
            </Typography>

            <Alert severity="info" sx={{ mb: 2 }}>
              <strong>Step 2:</strong> Enter deal details that will be created from this lead
            </Alert>

            <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label="Deal Name *"
                  value={formData.dealName}
                  onChange={(e) => handleFormChange('dealName', e.target.value)}
                  placeholder={`Deal with ${lead?.company || 'Company'}`}
                  variant="outlined"
                  size="small"
                  error={!formData.dealName && formData.dealName !== ''}
                  helperText={!formData.dealName && formData.dealName !== '' ? 'Deal name is required' : ''}
                />
              </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                <NumberField
                  fullWidth
                  label="Expected Revenue *"
                  value={formData.expectedRevenue}
                  onChange={(e) => handleFormChange('expectedRevenue', e.target.value)}
                  placeholder="0.00"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                  variant="outlined"
                  size="small"
                  error={!formData.expectedRevenue && formData.expectedRevenue !== ''}
                  helperText={!formData.expectedRevenue && formData.expectedRevenue !== '' ? 'Expected revenue is required' : ''}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label="Close Date *"
                  type="date"
                  value={formData.closeDate || dayjs().add(1, 'month').format('YYYY-MM-DD')}
                  onChange={(e) => handleFormChange('closeDate', e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  variant="outlined"
                  size="small"
                  error={!formData.closeDate && formData.closeDate !== ''}
                  helperText={!formData.closeDate && formData.closeDate !== '' ? 'Close date is required' : ''}
                />
              </Grid>

              {/* <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Stage</InputLabel>
                  <Select
                    value={formData.stage}
                    label="Stage"
                    onChange={(e) => handleFormChange('stage', e.target.value)}
                  >
                    <MenuItem value="Prospecting">Prospecting</MenuItem>
                    <MenuItem value="Proposal">Proposal</MenuItem>
                    <MenuItem value="Quotation">Quotation</MenuItem>
                    <MenuItem value="Negotiation">Negotiation</MenuItem>
                    <MenuItem value="Closed Won">Closed Won</MenuItem>
                    <MenuItem value="Closed Lost">Closed Lost</MenuItem>
                  </Select>
                </FormControl>
              </Grid> */}

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label="Deal Description"
                  value={formData.dealDescription}
                  onChange={(e) => handleFormChange('dealDescription', e.target.value)}
                  multiline
                  rows={2}
                  variant="outlined"
                  size="small"
                  placeholder="Brief description of the deal..."
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label="Notes"
                  value={formData.note}
                  onChange={(e) => handleFormChange('note', e.target.value)}
                  multiline
                  rows={2}
                  variant="outlined"
                  size="small"
                  placeholder="Additional notes about this conversion..."
                />
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 2 }} />


          {/* Section 4: Address Transfer Preview */}
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ 
                fontWeight: 600, 
                color: 'primary.main', 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1 
              }}>
                <LocationIcon />
                Address Transfer Preview
              </Typography>
              <IconButton
                onClick={() => setAddressesExpanded(!addressesExpanded)}
                size="small"
              >
                {addressesExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>

            <Alert severity="info" sx={{ mb: 2 }}>
              <strong>Step 4 & 5:</strong> These addresses will be copied from lead address to customer address
            </Alert>

            <Collapse in={addressesExpanded}>
              {leadAddresses.length === 0 ? (
                <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#f5f5f5' }}>
                  <InfoIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                  <Typography color="text.secondary">
                    No addresses to transfer
                  </Typography>
                </Paper>
              ) : (
                <TableContainer component={Paper} sx={{ border: '1px solid #e0e0e0' }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Company</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Address</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>City / Country</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Contact</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Primary</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {leadAddresses.map((address, index) => (
                        <TableRow key={index} hover>
                          <TableCell>
                            <Chip 
                              label={getAddressTypeLabel(address.addressType)} 
                              size="small" 
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>{address.companyName || '-'}</TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {address.addressLine || '-'}
                            </Typography>
                            {address.postcode && (
                              <Typography variant="caption" color="text.secondary">
                                {address.postcode}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {address.city || '-'} / {address.country || '-'}
                            {address.portOfDestination && (
                              <Typography variant="caption" display="block" color="text.secondary">
                                Port: {address.portOfDestination}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {address.contactPerson && (
                              <Typography variant="body2">{address.contactPerson}</Typography>
                            )}
                            {address.email && (
                              <Typography variant="caption" display="block">{address.email}</Typography>
                            )}
                            {address.telephoneNo && (
                              <Typography variant="caption" display="block">{address.telephoneNo}</Typography>
                            )}
                            {!address.contactPerson && !address.email && !address.telephoneNo && '-'}
                          </TableCell>
                          <TableCell>
                            {address.isPrimary ? (
                              <Chip label="Primary" size="small" color="primary" />
                            ) : (
                              '-'
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Collapse>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Section 5: Summary */}
          <Box>
            <Paper sx={{ p: 2.5, bgcolor: '#f0f7ff', border: '1px solid #90caf9' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
                Conversion Summary
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <Typography variant="body2" color="text.secondary">Customer:</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {lead?.company || lead?.firstName + ' ' + lead?.lastName}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <Typography variant="body2" color="text.secondary">Deal Name:</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {formData.dealName || 'Not set'}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <Typography variant="body2" color="text.secondary">Expected Revenue:</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {formData.expectedRevenue ? formatCurrency(formData.expectedRevenue) : 'Not set'}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <Typography variant="body2" color="text.secondary">Quotations Selected:</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {formData.selectedQuotationNumbers.length} quotation(s)
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <Typography variant="body2" color="text.secondary">Addresses to Transfer:</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {leadAddresses.length} address(es)
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1, bgcolor: '#f8f9fa', borderTop: '1px solid #e9ecef' }}>
        <Button
          onClick={onClose}
          variant="outlined"
          startIcon={<CloseIcon />}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          startIcon={<CheckCircleIcon />}
          disabled={!isFormValid}
          color="success"
          size="large"
        >
          Convert to Deal
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConvertToDealForm;
