import React, { useState } from 'react';
import Modal from '@presentation/components/Modal';
import BaseForm from '@presentation/components/common/forms/BaseForm';
import CustomSnackbar from '@presentation/components/CustomSnackbar';
import { DealFormConfigWrapper, transformDealData } from '@presentation/components/common/forms';
import { createDeal, updateDeal } from '@src/data';

/**
 * CreateDealModal - Container (Smart) Component
 *
 * Handles business logic for deal creation:
 * - API submission
 * - Data transformation
 * - Navigation
 * - Side effects
 *
 * Delegates UI concerns to BaseForm (Presentational component)
 */
const CreateDealModal = ({
  open,
  onClose,
  onSubmit,
  initialData = null,
  isEdit = false,
  title = null
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' });

  // Get dynamic form config with customer, contact, and user data
  const baseConfig = DealFormConfigWrapper();
  // In edit mode, disable Customer select to prevent changing linkage
  const formConfig = isEdit
    ? {
      ...baseConfig,
      sections: baseConfig.sections.map(section => ({
        ...section,
        fields: section.fields.map(field =>
          field.name === 'customerSelection'
            ? { ...field, disabled: true }
            : field
        )
      }))
    }
    : baseConfig;

  // Use provided title or default based on mode
  const modalTitle = title || (isEdit ? 'Edit Deal' : formConfig.title);

  // Prepare initial form data for edit mode
  const getInitialFormData = () => {
    if (initialData && isEdit) {
      // Convert deal data to form format for editing
      const formData = {
        name: initialData.name || '',
        description: initialData.description || '',
        expectedRevenue: initialData.expectedRevenue ? initialData.expectedRevenue.toString() : '',
        actualRevenue: initialData.actualRevenue ? initialData.actualRevenue.toString() : '',
        closeDate: initialData.closeDate || '',
        stage: initialData.stage || 'Prospecting',
        note: initialData.note || '',
        customerId: initialData.customerId ? initialData.customerId.toString() : '',
        contactId: initialData.contactId ? initialData.contactId.toString() : '',
        ownerId: initialData.ownerId ? initialData.ownerId.toString() : '',
        teamId: initialData.salesTeamId ? initialData.salesTeamId.toString() : '',
        customerSelection: initialData.customerId ? initialData.customerId.toString() : 'create_new',
        contactSelection: initialData.contactId ? initialData.contactId.toString() : 'create_new',
        // For edit mode, we don't recreate contact/customer unless user chooses to
        new_contact_data: null,
        new_customer_data: null
      };

      return formData;
    }
    return formConfig.initialData;
  };

  const handleSubmit = async (formData) => {
    setLoading(true);
    setError(null);

    try {
      // Transform form data to deal, contact, and customer objects
      const { deal, contact, customer } = transformDealData(formData);

      // Call real API to create or update deal (and customer/contact if needed)
      const dealResult = isEdit
        ? await updateDeal({
            dealId: initialData.id,
            deal,
            contact,
            customer,
            selectedContactId: formData.contactSelection !== 'create_new' ? formData.contactSelection : null,
            selectedCustomerId: formData.customerSelection !== 'create_new' ? formData.customerSelection : null
          })
        : await createDeal({
            deal,
            contact,
            customer,
            selectedContactId: formData.contactSelection !== 'create_new' ? formData.contactSelection : null,
            selectedCustomerId: formData.customerSelection !== 'create_new' ? formData.customerSelection : null
          });

      // Pass the created/updated deal back to parent component in expected format
      await onSubmit({
        deal: dealResult,
        contact: null, // API doesn't return updated contact data
        customer: null, // API doesn't return updated customer data
      });
      handleClose();
    } catch (err) {
      // Extract error message from API response
      const errorMessage = err?.response?.data?.message ||
                          err?.message ||
                          `Failed to ${isEdit ? 'update' : 'create'} deal. Please try again.`;

      // Show error via snackbar
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });

      console.error('Deal creation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  return (
    <>
      <Modal
        open={open}
        onClose={handleClose}
        title={modalTitle}
        size="large"
      >
        <BaseForm
          config={formConfig}
          initialData={getInitialFormData()}
          onSubmit={handleSubmit}
          onCancel={handleClose}
          loading={loading}
          error={error}
        />
      </Modal>

      {/* Error Snackbar */}
      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      />
    </>
  );
};

export default CreateDealModal;
