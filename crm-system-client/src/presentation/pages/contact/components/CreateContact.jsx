import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { Box, Typography, Button } from '@mui/material';
import BaseForm from '@presentation/components/common/forms/BaseForm';
import { ContactFormConfigWrapper, transformContactData } from '@presentation/components/common/forms/ContactFormConfig';

/**
 * CreateContact - Container Component
 *
 * Handles business logic for contact creation:
 * - API submission
 * - Data transformation
 * - Navigation
 * - Side effects
 *
 * Delegates UI concerns to BaseForm (Presentational component)
 */
const CreateContact = forwardRef(({
  onSubmit,
  initialData = {},
  isEdit = false,
  showActions = true,
  onClose = () => { },
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

  // Get dynamic form config with locked customer info
  const formConfig = ContactFormConfigWrapper(initialData);

  // Prepare initial form data
  const getInitialContactData = () => {
    // Merge formConfig.initialData with initialData
    const baseData = { ...formConfig.initialData };
    
    if (initialData) {
      // For edit mode
      if (isEdit) {
        return {
          ...baseData,
          ...initialData,
          customerId: initialData.customerId ? initialData.customerId.toString() : '',
        };
      }
      
      // For create mode with pre-filled data (e.g., from CustomerDetail)
      return {
        ...baseData,
        ...initialData,
        // Ensure customerId is string for form handling
        // customerId: initialData.customerId ? initialData.customerId.toString() : baseData.customerId
      };
    }

    return baseData;
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
      // Transform form data to contact object
      const { contact } = transformContactData(formData);

      // Pass the contact back to parent component
      onSubmit({ contact });
      handleClose();
    } catch (err) {
      setError('Failed to create contact. Please try again.');
      console.error('Contact creation error:', err);
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
      {/* Contact Form */}
      <Box sx={{ mt: 2 }}>
        <BaseForm
          ref={baseFormRef}
          config={formConfig}
          initialData={getInitialContactData()}
          onSubmit={handleSubmit}
          onCancel={() => { }}
          loading={loading}
          error={error || serverError}
          fieldErrors={serverFieldErrors}
          showActions={false}
        />
      </Box>

      {showActions && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
          <Button onClick={handleManualSubmit} variant="contained" disabled={loading}>
            {isEdit ? 'Save Changes' : 'Create Contact'}
          </Button>
          <Button onClick={() => { handleClose(); }} variant="outlined" disabled={loading}>
            Cancel
          </Button>
        </Box>
      )}
    </Box>
  );
});

CreateContact.displayName = 'CreateContact';

export default CreateContact;
