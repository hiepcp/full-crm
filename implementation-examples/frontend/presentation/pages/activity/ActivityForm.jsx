import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Grid,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

/**
 * ActivityForm Component
 * Feature 006-contract-activity-fields: Added contract date and value fields
 * T017 [US1]: Added DatePicker for contract date
 * T027 [US2]: Added NumberInput for contract value
 * T029 [US2]: Added client-side validation
 */
const ActivityForm = ({ activity, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    description: '',
    dueDate: null,
    status: 'pending',
    customerId: null,
    leadId: null,
    dealId: null,
    // NEW FIELDS (Feature 006-contract-activity-fields)
    contractDate: null,    // T017 [US1]
    contractValue: null,   // T027 [US2]
    ...activity
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (activity) {
      setFormData({ ...formData, ...activity });
    }
  }, [activity]);

  // T029 [US2]: Client-side validation for contract value
  const validateContractValue = (value) => {
    if (value === null || value === undefined || value === '') {
      return null; // Optional field
    }

    const numValue = parseFloat(value);

    if (isNaN(numValue)) {
      return 'Contract value must be a valid number';
    }

    if (numValue < 0) {
      return 'Contract value cannot be negative';
    }

    if (numValue >= 1000000000000) {
      return 'Contract value exceeds maximum allowed (1 trillion)';
    }

    // Check decimal places
    const decimalPlaces = (value.toString().split('.')[1] || '').length;
    if (decimalPlaces > 2) {
      return 'Contract value cannot have more than 2 decimal places';
    }

    return null;
  };

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setFormData({ ...formData, [field]: value });

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  // T027 [US2]: Handle contract value change with validation
  const handleContractValueChange = (event) => {
    const value = event.target.value;
    setFormData({ ...formData, contractValue: value ? parseFloat(value) : null });

    // T029 [US2]: Validate on change
    const error = validateContractValue(value);
    setErrors({ ...errors, contractValue: error });
  };

  // T017 [US1]: Handle contract date change
  const handleContractDateChange = (newDate) => {
    setFormData({ ...formData, contractDate: newDate });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Final validation
    const contractValueError = validateContractValue(formData.contractValue);
    if (contractValueError) {
      setErrors({ ...errors, contractValue: contractValueError });
      return;
    }

    onSave(formData);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
        <Grid container spacing={2}>
          {/* Existing fields */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Activity Name"
              value={formData.name}
              onChange={handleChange('name')}
              required
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth required>
              <InputLabel>Activity Type</InputLabel>
              <Select
                value={formData.type}
                onChange={handleChange('type')}
                label="Activity Type"
              >
                <MenuItem value="call">Call</MenuItem>
                <MenuItem value="meeting">Meeting</MenuItem>
                <MenuItem value="email">Email</MenuItem>
                <MenuItem value="contract">Contract</MenuItem>
                <MenuItem value="task">Task</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth required>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                onChange={handleChange('status')}
                label="Status"
              >
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={handleChange('description')}
              multiline
              rows={3}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <DatePicker
              label="Due Date"
              value={formData.dueDate}
              onChange={(newDate) => setFormData({ ...formData, dueDate: newDate })}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
          </Grid>

          {/* NEW: Contract-specific section (Feature 006-contract-activity-fields) */}
          {formData.type === 'contract' && (
            <>
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                  Contract Details
                </Typography>
              </Grid>

              {/* T017 [US1]: Contract Date Picker */}
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Contract Date"
                  value={formData.contractDate}
                  onChange={handleContractDateChange}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      helperText="Date when contract was signed or becomes effective"
                    />
                  )}
                />
              </Grid>

              {/* T027 [US2]: Contract Value Input with T029 validation */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Contract Value"
                  type="number"
                  value={formData.contractValue || ''}
                  onChange={handleContractValueChange}
                  inputProps={{
                    min: 0,
                    step: 0.01
                  }}
                  error={!!errors.contractValue}
                  helperText={
                    errors.contractValue ||
                    'Financial value of the contract (optional)'
                  }
                />
              </Grid>
            </>
          )}

          {/* Form actions */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={!!errors.contractValue}
              >
                Save Activity
              </Button>
              <Button variant="outlined" onClick={onCancel}>
                Cancel
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </LocalizationProvider>
  );
};

export default ActivityForm;
