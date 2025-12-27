import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { Box, Typography, Button } from '@mui/material';
import BaseForm from '@presentation/components/common/forms/BaseForm';
import { DealFormConfigWrapper, transformDealData } from '@presentation/components/common/forms';
import AddActivityForm from '@presentation/components/common/ActivityForms/AddActivityForm';

/**
 * CreateDeal - Container (Smart) Component
 *
 * Handles business logic for deal creation:
 * - API submission
 * - Data transformation
 * - Navigation
 * - Side effects
 *
 * Delegates UI concerns to BaseForm (Presentational component)
 */
const CreateDeal = forwardRef(({
  onSubmit,
  initialData = null,
  isEdit = false,
  showActions = true,
  onClose = () => { },
  serverError = null,
  serverFieldErrors = null
}, ref) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const activityFormRef = useRef(null);
  const baseFormRef = useRef(null);
  const [activityError, setActivityError] = useState(null);

  // Expose submit method to parent component
  useImperativeHandle(ref, () => ({
    submit: handleManualSubmit
  }));


  // Get dynamic form config with customer data
  const baseConfig = DealFormConfigWrapper();
  // Use base config directly
  const formConfig = baseConfig;

  // Helper function to create default activity data
  const getDefaultActivityData = () => ({
    subject: "init deal",
    body: "init deal",
    status: "open",
    priority: "normal",
    assignedTo: "",
    sourceFrom: "system-note",
    relationType: "deal",
    activityCategory: 'note',
    dueAt: null,
    completedAt: null,
    createdBy: 'sales@crm.com',
  });


  // Prepare initial form data for edit mode (matching ActivityForms structure)
  const getInitialDealData = () => {
    if (initialData && isEdit) {
      // Convert deal data to form format for editing
      const { ...dealData } = initialData; // Exclude activity from deal data

      return {
        ...formConfig.initialData,
        ...dealData,
        ownerId: initialData.ownerId ? initialData.ownerId.toString() : '',
      };
    }

    return formConfig.initialData;
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
      let activityData = null;
      // Only create activity in create mode
      if (!isEdit) {
        // Check if user provided activity data
        if (activityFormRef.current && activityFormRef.current.getActivityData) {
          // Validate the activity if provided
          if (activityFormRef.current.validate) {
            const v = activityFormRef.current.validate();
            if (!v.valid) {
              setActivityError(v.errors[0] || 'Please complete the activity.');
              setLoading(false);
              return;
            }
          }

          activityData = activityFormRef.current.getActivityData();
          if (!activityData || !activityData.subject) {
            activityData = null; // Reset to null if invalid
          }
        }

        // If no valid activity data, create default "init deal" activity
        if (!activityData) {
          activityData = getDefaultActivityData();
        }
      }

      // Transform form data to deal, contact, and customer objects
      const { deal, contact, customer } = transformDealData(formData);

      // Pass the entities back to parent component
      onSubmit({
        deal,
        contact: contact || null,
        customer: customer || null,
        ...(isEdit ? {} : { activity: activityData }),
        selectedContactId: null,
        selectedCustomerId: null,
      });
      handleClose();
    } catch (err) {
      setError('Failed to create deal. Please try again.');
      console.error('Deal creation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  // Handle email data from AddActivityForm
  const handleEmailData = (emailData) => {
    const { sender } = emailData;

    // Extract contact information from email
    const senderEmail = sender.address || '';

    // Try to extract company from email domain
    let company = '';
    if (senderEmail) {
      const emailDomain = senderEmail.split('@')[1];
      if (emailDomain) {
        // Convert domain to company name (remove common suffixes and capitalize)
        company = emailDomain.split('.')[0]
          .replace(/[-_]/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());
      }
    }

    // Update the deal form with extracted data
    if (baseFormRef.current) {
      baseFormRef.current.updateFormData({
        email: senderEmail,
        company: company,
        // You could also set note with email content if desired
        // note: `From email: ${subject}\n\n${body.substring(0, 200)}...`
      });
    }
  };

  return (
    <Box>
      {/* Manual Mode - 2 Column Layout */}
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', mt: 2 }}>
        {/* Left Column - Deal Form */}
        <Box sx={{ flex: 1 }}>
          <BaseForm
            ref={baseFormRef}
            config={formConfig}
            initialData={getInitialDealData()}
            onSubmit={handleSubmit}
            onCancel={() => { }}
            loading={loading}
            error={error || serverError}
            fieldErrors={serverFieldErrors}
            showActions={false}
          />
        </Box>

        {/* Right Column - Initial Activity */}
        {!isEdit && (
          <Box sx={{ flex: 1 }}>
            {activityError && (
              <Typography variant="body2" color="error" sx={{ mb: 1 }}>
                {activityError}
              </Typography>
            )}
            <AddActivityForm
              ref={activityFormRef}
              relationType="deal"
              initialData={{ activityCategory: 'note' }}
              showActions={false}
              onEmailData={handleEmailData}
            />
          </Box>
        )}
      </Box>

      {showActions && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button onClick={handleManualSubmit} variant="contained" disabled={loading}>
            {isEdit ? 'Save Changes' : 'Create Deal'}
          </Button>
          <Button onClick={() => { handleClose(); }} variant="outlined" disabled={loading}>
            Cancel
          </Button>
        </Box>
      )}
    </Box>
  );
});

CreateDeal.displayName = 'CreateDeal';

export default CreateDeal;

