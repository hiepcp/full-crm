import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Box,
  IconButton
} from '@mui/material';
import {
  Close as CloseIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';
import CreateCustomerAddress from './CreateCustomerAddress';

/**
 * CustomerAddressForm - Dialog wrapper for CreateCustomerAddress
 *
 * Handles dialog state and presentation
 * Delegates form logic to CreateCustomerAddress component
 */
const CustomerAddressForm = ({
  open,
  onClose,
  onSubmit,
  address = null,
  customerId,
  serverError = null,
  serverFieldErrors = null
}) => {
  const isEditMode = !!address;

  const handleSubmit = (addressData) => {
    onSubmit(addressData);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { 
          borderRadius: 3,
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        pb: 2, 
        bgcolor: '#f8f9fa', 
        borderBottom: '1px solid #e9ecef' 
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between' 
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <LocationIcon color="primary" sx={{ fontSize: 28 }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {isEditMode ? 'Edit Address' : 'Add New Address'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {isEditMode 
                  ? 'Update customer address information' 
                  : 'Add a new address for this customer'}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <CreateCustomerAddress
          onSubmit={handleSubmit}
          initialData={address}
          isEdit={isEditMode}
          showActions={true}
          onClose={onClose}
          customerId={customerId}
          serverError={serverError}
          serverFieldErrors={serverFieldErrors}
        />
      </DialogContent>
    </Dialog>
  );
};

export default CustomerAddressForm;
