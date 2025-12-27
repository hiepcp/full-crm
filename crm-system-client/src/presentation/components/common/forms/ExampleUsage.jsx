import React, { useState } from 'react';
import { Button, Box } from '@mui/material';
import Modal from '@presentation/components/Modal';
import BaseForm from './BaseForm';

/**
 * Example form configuration for demonstration
 */
const ExampleFormConfig = {
  title: "Example Form",

  initialData: {
    name: '',
    email: '',
    age: 25,
    notes: ''
  },

  sections: [
    {
      id: 'personal-info',
      title: 'Personal Information',
      fields: [
        {
          name: 'name',
          label: 'Full Name',
          type: 'text',
          required: true,
          grid: { sm: 6 }
        },
        {
          name: 'email',
          label: 'Email Address',
          type: 'email',
          required: true,
          grid: { sm: 6 }
        },
        {
          name: 'age',
          label: 'Age',
          type: 'text',
          required: false,
          grid: { sm: 6 }
        }
      ]
    },
    {
      id: 'additional-info',
      title: 'Additional Information',
      fields: [
        {
          name: 'notes',
          label: 'Notes',
          type: 'textarea',
          required: false,
          rows: 4,
          grid: { sm: 12 }
        }
      ]
    }
  ],

  actions: {
    cancel: {
      label: 'Cancel'
    },
    submit: {
      label: 'Save Example',
      gradient: 'linear-gradient(135deg, #586a68 0%, #4e605e 100%)'
    }
  }
};

/**
 * Example Container Component demonstrating the Smart-Dumb pattern
 */
const ExampleFormModal = ({ open, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (formData) => {
    setLoading(true);
    setError(null);

    try {
      // Simulate API call
      console.log('Submitting form data:', formData);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // In real app, call API and handle response
      alert('Form submitted successfully!\n' + JSON.stringify(formData, null, 2));
      onClose();
    } catch (err) {
      setError('Failed to submit form. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setError(null);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleCancel}
      title={ExampleFormConfig.title}
      size="medium"
    >
      <BaseForm
        config={ExampleFormConfig}
        initialData={ExampleFormConfig.initialData}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        error={error}
      />
    </Modal>
  );
};

/**
 * Demo component to show the pattern in action
 */
const ExampleUsage = () => {
  const [open, setOpen] = useState(false);

  return (
    <Box sx={{ p: 3 }}>
      <Button
        variant="contained"
        onClick={() => setOpen(true)}
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #5568d3 0%, #653a8b 100%)',
          }
        }}
      >
        Open Example Form
      </Button>

      <ExampleFormModal
        open={open}
        onClose={() => setOpen(false)}
      />
    </Box>
  );
};

export default ExampleUsage;
