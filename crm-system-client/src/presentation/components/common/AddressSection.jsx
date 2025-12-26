import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  IconButton,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Grid,
  Divider,
  Autocomplete,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocationOn as LocationOnIcon
} from '@mui/icons-material';
import CustomSnackbar from '../CustomSnackbar';
import { ADDRESS_TYPES } from '@utils/constants';
import { COUNTRY_OPTIONS } from '@utils/constants_contry';
import { createAddress, updateAddress, deleteAddress } from '@presentation/data';

const initialFormData = {
  addressType: '',
  companyName: '',
  addressLine: '',
  postcode: '',
  city: '',
  country: '',
  contactPerson: '',
  email: '',
  telephoneNo: '',
  portOfDestination: '',
  isPrimary: false,
};

const AddressSection = ({
  relationType = 'lead',
  relationId,
  addresses = [],
  customer = null,
  onRefresh,
  title = 'Address',
  expandedDefault = true
}) => {
  const theme = useTheme();
  const [addressExpanded, setAddressExpanded] = useState(expandedDefault);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const resetForm = () => setFormData(initialFormData);

  const handleOpenDialog = (address = null) => {
    if (address) {
      setEditingAddress(address);
      setFormData({
        addressType: address.addressType || '',
        companyName: address.companyName || '',
        addressLine: address.addressLine || '',
        postcode: address.postcode || '',
        city: address.city || '',
        country: address.country || '',
        contactPerson: address.contactPerson || '',
        email: address.email || '',
        telephoneNo: address.telephoneNo || '',
        portOfDestination: address.portOfDestination || '',
        isPrimary: Boolean(address.isPrimary),
      });
    } else {
      setEditingAddress(null);
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingAddress(null);
    resetForm();
  };

  const buildPayload = () => ({
    relationType,
    relationId,
    ...formData,
  });

  const handleSubmit = async () => {
    if (!relationId) {
      setSnackbar({ open: true, message: 'Missing relation id for address', severity: 'error' });
      return;
    }

    try {
      setSubmitting(true);
      const payload = buildPayload();

      if (editingAddress?.id) {
        await updateAddress(editingAddress.id, payload);
        setSnackbar({ open: true, message: 'Address updated successfully', severity: 'success' });
      } else {
        await createAddress(payload);
        setSnackbar({ open: true, message: 'Address added successfully', severity: 'success' });
      }

      if (onRefresh) {
        await onRefresh();
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving address:', error);
      setSnackbar({ open: true, message: 'Failed to save address', severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (addressId) => {
    if (!addressId) return;
    if (!window.confirm('Are you sure you want to delete this address?')) return;

    try {
      setSubmitting(true);
      await deleteAddress(addressId);
      setSnackbar({ open: true, message: 'Address deleted successfully', severity: 'success' });
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      console.error('Error deleting address:', error);
      setSnackbar({ open: true, message: 'Failed to delete address', severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const renderEmptyState = () => (
    <Box sx={{ textAlign: 'center', py: 2 }}>
      <LocationOnIcon sx={{ fontSize: 40, color: '#9e9e9e', mb: 1 }} />
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        No address has been added for this lead yet
      </Typography>
      <Button size="small" sx={{ mt: 0.5 }} startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
        Add an address
      </Button>
    </Box>
  );

  const typeLabel = (type) => {
    const found = ADDRESS_TYPES.find(t => t.value === (type || '').toLowerCase());
    return found ? found.label : 'Other Address';
  };

  const countryLabel = (code) => {
    if (!code) return '';
    const found = COUNTRY_OPTIONS.find(c => c.value === code);
    return found ? found.label : code;
  };

  const renderAddresses = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {addresses.map((addr, index) => (
        <Box
          key={addr.id || `${addr.addressType || 'addr'}-${index}`}
          sx={{
            border: `1px solid ${theme.palette.grey[200]}`,
            borderRadius: 2,
            p: 1.5,
            bgcolor: 'grey.50'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <LocationOnIcon sx={{ fontSize: 18, color: 'primary.main', mr: 0.5 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {typeLabel(addr.addressType)}
              </Typography>
              {addr.isPrimary && (
                <Chip
                  label="Primary"
                  size="small"
                  sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                  color="primary"
                />
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton size="small" sx={{ color: 'text.secondary' }} onClick={() => handleOpenDialog(addr)}>
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" sx={{ color: 'text.secondary' }} onClick={() => handleDelete(addr.id)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
          {addr.companyName && (
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {addr.companyName}
            </Typography>
          )}
          {addr.addressLine && (
            <Typography variant="body2">
              {addr.addressLine}
            </Typography>
          )}
          {(addr.postcode || addr.city) && (
            <Typography variant="body2">
              {[addr.postcode, addr.city].filter(Boolean).join(', ')}
            </Typography>
          )}
          {addr.country && (
            <Typography variant="body2">
              {countryLabel(addr.country)}
            </Typography>
          )}
          {(addr.contactPerson || addr.email || addr.telephoneNo) && (
            <Box sx={{ mt: 1 }}>
              {addr.contactPerson && (
                <Typography variant="body2">
                  Contact: {addr.contactPerson}
                </Typography>
              )}
              {addr.email && (
                <Typography variant="body2">
                  Email: {addr.email}
                </Typography>
              )}
              {addr.telephoneNo && (
                <Typography variant="body2">
                  Telephone: {addr.telephoneNo}
                </Typography>
              )}
            </Box>
          )}
          {addr.portOfDestination && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Port of Destination: {addr.portOfDestination}
            </Typography>
          )}
        </Box>
      ))}

      {!addresses.length && customer && (
        <Box
          sx={{
            border: `1px solid ${theme.palette.grey[200]}`,
            borderRadius: 2,
            p: 1.5,
            bgcolor: 'grey.50'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <LocationOnIcon sx={{ fontSize: 18, color: 'primary.main', mr: 0.5 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Customer Address
            </Typography>
          </Box>
          {customer.billingAddress && (
            <>
              <Typography variant="caption" color="text.secondary">
                Billing Address
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                {customer.billingAddress}
              </Typography>
            </>
          )}
          {customer.shippingAddress && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Shipping Address
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                {customer.shippingAddress}
              </Typography>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );

  const customerHasAddress = customer?.billingAddress || customer?.shippingAddress || customer?.shipping_address;
  const shouldRenderEmpty = !addresses.length && !customerHasAddress;

  return (
    <>
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
                {title} {addresses?.length ? `(${addresses.length})` : ''}
              </Typography>
            </Box>
            <IconButton
              size="small"
              sx={{ border: '1px solid #e0e0e0', borderRadius: '4px' }}
              onClick={() => handleOpenDialog()}
            >
              <AddIcon fontSize="small" />
            </IconButton>
          </Box>
          <Collapse in={addressExpanded} timeout="auto" unmountOnExit>
            {shouldRenderEmpty ? renderEmptyState() : renderAddresses()}
          </Collapse>
        </CardContent>
      </Card>

      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{editingAddress ? 'Edit Address' : 'Add Address'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box
              sx={{
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
                p: 2,
                bgcolor: 'grey.50'
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'text.secondary' }}>
                Address details
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="address-type-label">Address Type</InputLabel>
                    <Select
                      labelId="address-type-label"
                      value={formData.addressType}
                      label="Address Type"
                      onChange={(e) => setFormData(prev => ({ ...prev, addressType: e.target.value }))}
                    >
                      {ADDRESS_TYPES.map(type => (
                        <MenuItem key={type.value} value={type.value}>
                          {type.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Company Name"
                    value={formData.companyName}
                    onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                    fullWidth
                    size="small"
                    placeholder="Company at this address"
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Address Line"
                    value={formData.addressLine}
                    onChange={(e) => setFormData(prev => ({ ...prev, addressLine: e.target.value }))}
                    fullWidth
                    multiline
                    minRows={3}
                    size="small"
                    placeholder="Street, building, suite..."
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="City"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Postcode"
                    value={formData.postcode}
                    onChange={(e) => setFormData(prev => ({ ...prev, postcode: e.target.value }))}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Autocomplete
                    options={COUNTRY_OPTIONS}
                    autoHighlight
                    size="small"
                    value={COUNTRY_OPTIONS.find(opt => opt.value === formData.country) || null}
                    onChange={(e, newValue) => setFormData(prev => ({ ...prev, country: newValue?.value || '' }))}
                    isOptionEqualToValue={(option, value) => option.value === value?.value}
                    getOptionLabel={(option) => option?.label || ''}
                    renderOption={(props, option) => (
                      <li {...props} key={option.value}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                          <span>{option.label}</span>
                          <Typography variant="caption" color="text.secondary">
                            {option.value}
                          </Typography>
                        </Box>
                      </li>
                    )}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Country (ISO 3)"
                        placeholder="Select country code"
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Port of Destination"
                    value={formData.portOfDestination}
                    onChange={(e) => setFormData(prev => ({ ...prev, portOfDestination: e.target.value }))}
                    fullWidth
                    size="small"
                    placeholder="Destination port (optional)"
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider />

            <Box
              sx={{
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
                p: 2
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'text.secondary' }}>
                Contact & preferences
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Contact Person"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    fullWidth
                    type="email"
                    size="small"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Telephone"
                    value={formData.telephoneNo}
                    onChange={(e) => setFormData(prev => ({ ...prev, telephoneNo: e.target.value }))}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex', alignItems: 'center' }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.isPrimary}
                        onChange={(e) => setFormData(prev => ({ ...prev, isPrimary: e.target.checked }))}
                      />
                    }
                    label="Primary address"
                  />
                </Grid>
              </Grid>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} variant="outlined" disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant="contained" disabled={submitting}>
            {submitting ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      />
    </>
  );
};

export default AddressSection;

