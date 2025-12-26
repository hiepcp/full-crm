import React, { useState } from 'react';
import { Card, CardContent, Typography, Box, Alert, Button } from '@mui/material';
import BaseForm from '@presentation/components/common/forms/BaseForm';
import { PublicLeadFormConfig, transformPublicLeadData } from '@presentation/components/common/forms/PublicLeadFormConfig';
import leadsApi from '@infrastructure/api/leadsApi';
import PrimaryButton from '@presentation/components/common/PrimaryButton';
import AuthWrapper from '@presentation/pages/auth/AuthWrapper';

/**
 * PublicLeadForm - Public page for external lead submission
 * 
 * This page allows anyone (without authentication) to submit a lead.
 * Based on Customer's Legal Information form layout.
 */
const PublicLeadFormContent = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState(null);

  const handleSubmit = async (formData) => {
    setLoading(true);
    setError(null);
    setFieldErrors(null);
    setSuccess(false);

    try {
      // Transform form data to lead entity
      const request = transformPublicLeadData(formData);

      // Submit to public API endpoint
      const response = await leadsApi.createPublic(request);

      if (response.status === 200 || response.status === 201) {
        setSuccess(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      console.error('Public lead submission error:', err);

      // Parse server validation errors
      let generalError = 'Failed to submit request. Please try again.';
      let parsedFieldErrors = {};

      const serverData = err?.response?.data;
      if (serverData?.message) {
        generalError = serverData.message;

        // Parse field-specific errors
        const emailMatch = serverData.message.match(/--\s*Email:\s*(.+?)(?:\.|\r|\n|$)/i);
        if (emailMatch && emailMatch[1]) {
          parsedFieldErrors.email = emailMatch[1].trim();
        }
      }

      setError(generalError);
      setFieldErrors(Object.keys(parsedFieldErrors).length > 0 ? parsedFieldErrors : null);
    } finally {
      setLoading(false);
    }
  };

  const handleNewSubmission = () => {
    setSuccess(false);
    setError(null);
    setFieldErrors(null);
    window.location.reload();
  };

  return (
    <Card sx={{ p: 2, borderRadius: 3, boxShadow: 3, maxWidth: 900, mx: 'auto' }}>
      <CardContent>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Customer Information
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Please provide your company details and we will contact you shortly.
          </Typography>
        </Box>

        {/* Success Message */}
        {success && (
          <Box sx={{ mb: 3 }}>
            <Alert severity="success" sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Thank you for your submission!
              </Typography>
              <Typography variant="body2">
                We have received your information successfully. Our team will review and contact you soon.
              </Typography>
            </Alert>
            <PrimaryButton
              variant="outlined"
              onClick={handleNewSubmission}
              fullWidth
            >
              Submit Another Request
            </PrimaryButton>
          </Box>
        )}

        {/* Error Message */}
        {error && !success && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Form */}
        {!success && (
          <Box>
            <BaseForm
              config={PublicLeadFormConfig}
              initialData={PublicLeadFormConfig.initialData}
              onSubmit={handleSubmit}
              onCancel={handleNewSubmission}
              loading={loading}
              error={error}
              fieldErrors={fieldErrors}
              showActions={false}
              onFormDataChange={() => { }}
            />

            {/* Custom Submit Buttons */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
              <Button
                variant="outlined"
                onClick={handleNewSubmission}
                disabled={loading}
                size="small"
              >
                Reset Form
              </Button>
              <PrimaryButton
                variant="contained"
                onClick={() => {
                  const form = document.querySelector('form');
                  if (form) form.requestSubmit();
                }}
                disabled={loading}
                size="small"
                sx={{ px: 4 }}
              >
                {loading ? 'Submitting...' : 'Submit'}
              </PrimaryButton>
            </Box>
          </Box>
        )}

        {/* Footer */}
        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider', textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            By submitting this form, you agree to our privacy policy and terms of service.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default function PublicLeadForm() {
  return (
    <AuthWrapper>
    <PublicLeadFormContent />
    </AuthWrapper>
  );
}