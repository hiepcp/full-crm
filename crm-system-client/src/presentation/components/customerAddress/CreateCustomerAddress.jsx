import React, { useState, forwardRef, useImperativeHandle, useRef } from 'react';
import { Box, Button } from '@mui/material';
import BaseForm from '@presentation/components/common/forms/BaseForm';
import { CustomerAddressFormConfig, transformAddressData } from '@presentation/components/common/forms';

/**
 * CreateCustomerAddress - Container (Smart) Component
 *
 * Handles business logic for customer address creation/editing:
 * - API submission
 * - Data transformation
 * - Side effects
 *
 * Delegates UI concerns to BaseForm (Presentational component)
 */
const CreateCustomerAddress = forwardRef(({
  onSubmit,
  initialData = null,
  isEdit = false,
  showActions = true,
  onClose = () => { },
  customerId,
  serverError = null,
  serverFieldErrors = null
}, ref) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const baseFormRef = useRef(null);

  // Expose submit method to parent component
  useImperativeHandle(ref, () => ({
    submit: handleManualSubmit
  }));

  // Get form config
  const formConfig = {
    ...CustomerAddressFormConfig,
    actions: {
      ...CustomerAddressFormConfig.actions,
      submit: {
        ...CustomerAddressFormConfig.actions.submit,
        label: isEdit ? 'Update Address' : 'Add Address'
      }
    }
  };

  // Prepare initial form data for edit mode
  const getInitialAddressData = () => {
    if (initialData && isEdit) {
      return {
        ...formConfig.initialData,
        ...initialData,
        customerId: initialData.customerId || customerId,
        isPrimary: initialData.isPrimary || false,
        isActive: initialData.isActive !== false
      };
    }

    return {
      ...formConfig.initialData,
      customerId: customerId || ''
    };
  };

  const handleManualSubmit = () => {
    if (baseFormRef.current) {
      baseFormRef.current.submit();
    }
  };

  const handleSubmit = async (formData) => {
    setLoading(true);
    setError(null);

    try {
      // Transform form data to address object
      const address = transformAddressData(formData);

      // Pass the address back to parent component
      onSubmit(address);
      handleClose();
    } catch (err) {
      setError(`Failed to ${isEdit ? 'update' : 'create'} address. Please try again.`);
      console.error('Address submission error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  return (
    <Box>
      <BaseForm
        ref={baseFormRef}
        config={formConfig}
        initialData={getInitialAddressData()}
        onSubmit={handleSubmit}
        onCancel={handleClose}
        loading={loading}
        error={error || serverError}
        fieldErrors={serverFieldErrors}
        showActions={showActions}
      />

      {!showActions && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
          <Button onClick={handleClose} variant="outlined" disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleManualSubmit} variant="contained" disabled={loading}>
            {isEdit ? 'Update Address' : 'Add Address'}
          </Button>
        </Box>
      )}
    </Box>
  );
});

CreateCustomerAddress.displayName = 'CreateCustomerAddress';

export default CreateCustomerAddress;
