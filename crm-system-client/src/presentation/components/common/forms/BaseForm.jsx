import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef, useCallback } from 'react';
import {
  Box,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Slider,
  Typography,
  Paper,
  Divider,
  InputAdornment,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  FormHelperText,
  Autocomplete,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import NumberField from '../NumberField';
import { Close as CloseIcon, ExpandMore as ExpandMoreIcon, Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { ContactFormConfig } from './ContactFormConfig';
import { CustomerFormConfig } from './CustomerFormConfig';

/**
 * BaseForm - Presentational (Dumb) Component
 *
 * Handles UI rendering, layout, validation, and user input.
 * Receives form configuration and callbacks via props.
 *
 * @param {Object} props
 * @param {Object} props.config - Form configuration object
 * @param {string} props.config.title - Form title
 * @param {Array} props.config.sections - Array of form sections
 * @param {Object} props.config.actions - Action buttons configuration
 * @param {Object} props.initialData - Initial form data
 * @param {Function} props.onSubmit - Submit callback
 * @param {Function} props.onCancel - Cancel callback
 * @param {boolean} props.loading - Loading state
 * @param {string} props.error - General error message
 */
const BaseForm = ({
  config,
  initialData = {},
  onSubmit,
  onCancel,
  loading = false,
  error = null,
  fieldErrors = null,
  compact = false,
  showActions = true,
  customRenderers,
}, ref) => {
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(error);
  const [dialogState, setDialogState] = useState({}); // Track dialog states for different fields
  const [dialogKey, setDialogKey] = useState(0); // Force dialog re-render
  const formRef = useRef(null);

  const deriveFn = config?.deriveFormData;

  const applyDerivedFormData = useCallback((data = {}, changedField) => {
    if (typeof deriveFn === 'function') {
      return deriveFn({ ...data }, changedField);
    }
    return data;
  }, [deriveFn]);

  useImperativeHandle(ref, () => ({
    submit() {
      if (formRef.current) {
        formRef.current.requestSubmit();
      }
    },
    updateFormData(newData) {
      setFormData(prev => applyDerivedFormData({
        ...prev,
        ...newData
      }));
    }
  }));

  // Update form data when initialData changes
  useEffect(() => {
    setFormData(applyDerivedFormData(initialData));
  }, [initialData, applyDerivedFormData]);

  // Update error when error prop changes
  useEffect(() => {
    setSubmitError(error);
  }, [error]);

  // Apply external field errors from server validation
  useEffect(() => {
    if (fieldErrors && typeof fieldErrors === 'object') {
      setErrors(fieldErrors || {});
    }
  }, [fieldErrors]);

  const handleChange = (fieldName) => (e) => {
    const { value } = e.target;
    setFormData(prev => applyDerivedFormData({
      ...prev,
      [fieldName]: value
    }, fieldName));

    // Clear error for this field when user starts typing
    if (errors[fieldName]) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: ''
      }));
    }

    // Special handling moved to MenuItem onClick handler
  };

  const handleCheckboxChange = (fieldName) => (e) => {
    const  checked  = e.target.checked;
    setFormData(prev => applyDerivedFormData({
      ...prev,
      [fieldName]: checked
    }, fieldName));

    // Clear error for this field when user starts typing
    if (errors[fieldName]) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: ''
      }));
    }

    // Special handling moved to MenuItem onClick handler
  };

  const handleSliderChange = (fieldName) => (e, newValue) => {
    setFormData(prev => applyDerivedFormData({
      ...prev,
      [fieldName]: newValue
    }, fieldName));
  };

  // Array field handlers
  const handleArrayAdd = (fieldName, itemTemplate = {}) => () => {
    const currentArray = formData[fieldName] || [];
    setFormData(prev => applyDerivedFormData({
      ...prev,
      [fieldName]: [...currentArray, itemTemplate]
    }, fieldName));
  };

  const handleArrayRemove = (fieldName, index) => () => {
    const currentArray = formData[fieldName] || [];
    setFormData(prev => applyDerivedFormData({
      ...prev,
      [fieldName]: currentArray.filter((_, i) => i !== index)
    }, fieldName));
  };

  const handleArrayItemChange = (fieldName, index, itemFieldName) => (e) => {
    const { value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    const currentArray = formData[fieldName] || [];
    const updatedArray = currentArray.map((item, i) =>
      i === index ? { ...item, [itemFieldName]: newValue } : item
    );
    setFormData(prev => applyDerivedFormData({
      ...prev,
      [fieldName]: updatedArray
    }, fieldName));

    // Clear error for this specific field when user changes it
    const errorKey = `${fieldName}[${index}].${itemFieldName}`;
    if (errors[errorKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  // Dialog handlers
  const handleCloseDialog = (dialogName) => {
    setDialogState(prev => ({
      ...prev,
      [dialogName]: false
    }));
  };

  const handleDialogSubmit = (dialogName, data) => {
    if (dialogName === 'contactDialog') {
      // Save contact data and update form
      setFormData(prev => applyDerivedFormData({
        ...prev,
        new_contact_data: data,
        contact_selection: 'create_new' // Keep selection as create_new
      }));
    } else if (dialogName === 'customerDialog') {
      // Save customer data and update form
      setFormData(prev => applyDerivedFormData({
        ...prev,
        new_customer_data: data
      }));
    }
    handleCloseDialog(dialogName);
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate each section's fields (skip hidden fields)
    config.sections.forEach(section => {
      const allFields = [
        ...(section.fields || []),
        ...((section.subSections || []).flatMap(sub => sub.fields || []))
      ];

      allFields.forEach(field => {
        if (field.style?.display === 'none') {
          return; // Skip validation for hidden fields
        }

        // Special validation for contact selection
        if (field.name === 'contact_selection' && formData[field.name] === 'create_new') {
          if (!formData.new_contact_data) {
            newErrors[field.name] = 'Please create a new contact first';
          }
        }

        // Validation for array fields (e.g., addresses)
        if (field.type === 'array' && field.name === 'addresses') {
          const addresses = formData[field.name] || [];

          // Check for duplicate primary addresses per addressType
          const primaryByType = {};
          addresses.forEach((addr, index) => {
            if (addr.isPrimary && addr.addressType) {
              if (!primaryByType[addr.addressType]) {
                primaryByType[addr.addressType] = [];
              }
              primaryByType[addr.addressType].push(index);
            }
          });

          // Flag error if any addressType has multiple primary addresses
          Object.entries(primaryByType).forEach(([type, indices]) => {
            if (indices.length > 1) {
              indices.forEach(index => {
                newErrors[`${field.name}[${index}].isPrimary`] = `Only one primary address allowed per type`;
              });
            }
          });
        }

        if (field.required && !formData[field.name]?.toString().trim()) {
          newErrors[field.name] = `${field.label} is required`;
        }

        // Email validation
        if (field.type === 'email' && formData[field.name]) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(formData[field.name])) {
            newErrors[field.name] = 'Invalid email format';
          }
        }

        // Custom validation
        if (field.validate && typeof field.validate === 'function') {
          const customError = field.validate(formData[field.name], formData);
          if (customError) {
            newErrors[field.name] = customError;
          }
        }
      });
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!validateForm()) {
      return;
    }

    onSubmit(formData);
  };

  const handleCancel = () => {
    setFormData(applyDerivedFormData(initialData));
    setErrors({});
    setSubmitError('');
    onCancel();
  };

  const renderField = (field) => {
    // Check conditional rendering
    if (field.conditional) {
      const { field: conditionField, value: conditionValue } = field.conditional;
      if (formData[conditionField] !== conditionValue) {
        return null; // Don't render this field
      }
    }

    const isFieldDisabled = !!(typeof field.disabled === 'function' ? field.disabled(formData) : field.disabled);
    const fieldProps = {
      fullWidth: true,
      label: field.label,
      name: field.name,
      value: formData[field.name] || '',
      onChange: handleChange(field.name),
      error: !!errors[field.name],
      helperText: errors[field.name] || field.helperText,
      required: field.required,
      disabled: loading || isFieldDisabled
    };

    switch (field.type) {
      case 'text':
      case 'email':
        return (
          <TextField
            {...fieldProps}
            type={field.type}
            placeholder={field.placeholder}
            InputProps={{
              startAdornment: field.icon ? (
                <InputAdornment position="start">
                  {React.createElement(field.icon, { sx: { color: 'action.active', fontSize: 20 } })}
                </InputAdornment>
              ) : null,
            }}
            sx={{
              minWidth: 120,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
          />
        );

      case 'number':
        return (
          <NumberField
            {...fieldProps}
            min={field.min}
            max={field.max}
            size={field.size}
            placeholder={field.placeholder}
            InputProps={{
              startAdornment: field.icon ? (
                <InputAdornment position="start">
                  {React.createElement(field.icon, { sx: { color: 'action.active', fontSize: 20 } })}
                </InputAdornment>
              ) : null,
            }}
            sx={{
              minWidth: 120,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
          />
        );

      case 'textarea':
        return (
          <TextField
            {...fieldProps}
            multiline
            rows={field.rows || 3}
            placeholder={field.placeholder}
            InputProps={{
              startAdornment: field.icon ? (
                <InputAdornment position="start">
                  {React.createElement(field.icon, { sx: { color: 'action.active', fontSize: 20, mt: 1 } })}
                </InputAdornment>
              ) : null,
            }}
            sx={{
              minWidth: 120,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
          />
        );

      case 'date':
        // Normalize various date formats to YYYY-MM-DD for HTML date input
        const normalizeDateValue = (val) => {
          if (!val) return '';
          // If Date instance
          if (val instanceof Date && !Number.isNaN(val)) {
            return val.toISOString().slice(0, 10);
          }
          if (typeof val === 'string') {
            const s = val.trim();
            // If already in YYYY-MM-DD or starts with it, use first 10 chars
            const match = s.match(/^\d{4}-\d{2}-\d{2}/);
            if (match) return match[0];
            // Try parse other string formats
            const d = new Date(s);
            if (!Number.isNaN(d.getTime())) {
              return d.toISOString().slice(0, 10);
            }
          }
          return '';
        };

        return (
          <TextField
            {...fieldProps}
            type="date"
            value={normalizeDateValue(formData[field.name])}
            InputLabelProps={{ shrink: true }}
            InputProps={{
              startAdornment: field.icon ? (
                <InputAdornment position="start">
                  {React.createElement(field.icon, { sx: { color: 'action.active', fontSize: 20 } })}
                </InputAdornment>
              ) : null,
            }}
            sx={{
              minWidth: 120,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
          />
        );

      case 'select':
        const { helperText, ...selectProps } = fieldProps;
        const handleSelectChange = (event) => {
          const newValue = event.target.value;
          console.log(`Select change for ${field.name}:`, newValue);
          // Normal selection (create_new is handled by MenuItem onClick)
          handleChange(field.name)({ target: { value: newValue } });
        };
        return (
          <FormControl fullWidth error={!!errors[field.name]}>
            <InputLabel>{field.label}</InputLabel>
            <Select
              {...selectProps}
              label={field.label}
              displayEmpty
              onChange={handleSelectChange}
              startAdornment={field.icon ? (
                <InputAdornment position="start">
                  {React.createElement(field.icon, { sx: { color: 'action.active', fontSize: 20, ml: 0.5 } })}
                </InputAdornment>
              ) : null}
              sx={{
                minWidth: 120,
                borderRadius: 2,
              }}
            >
              {(typeof field.options === 'function' ? field.options(formData) : field.options).map((option) => (
                <MenuItem
                  key={option.value}
                  value={option.value}
                  disabled={!!option.disabled}
                  onClick={(option.value === 'create_new' && field.name === 'contact_selection') ? () => {
                    setFormData(prev => applyDerivedFormData({
                      ...prev,
                      [field.name]: option.value,
                      new_contact_data: undefined
                    }, field.name));
                    setDialogKey(prev => prev + 1);
                    setDialogState(prev => ({ ...prev, contactDialog: true }));
                  } : undefined}
                >
                  {option.render ? option.render(option) : option.label}
                </MenuItem>
              ))}
            </Select>
            {(helperText || errors[field.name]) && (
              <FormHelperText>{errors[field.name] || helperText}</FormHelperText>
            )}
          </FormControl>
        );

      case 'autocomplete':
        const autocompleteOptions = typeof field.options === 'function' ? field.options(formData) : field.options;
        const defaultValue = initialData[field.name]
        const selectedOption = autocompleteOptions.find(option => option.value === formData[field.name]);

        const handleAutocompleteChange = (event, newValue) => {
          const value = newValue ? newValue.value : '';

          // Special handling for create_new options - only if creation is allowed
          if (value === 'create_new' && field.name === 'contact_selection' && field.canCreate) {
            setFormData(prev => applyDerivedFormData({
              ...prev,
              [field.name]: value,
              new_contact_data: undefined
            }, field.name));
            setDialogKey(prev => prev + 1);
            setDialogState(prev => ({ ...prev, contactDialog: true }));
          } else {
            handleChange(field.name)({ target: { value } });
          }
        };

        return (
          <Autocomplete
            fullWidth
            defaultValue={defaultValue}
            value={selectedOption || null}
            onChange={handleAutocompleteChange}
            options={autocompleteOptions}
            getOptionLabel={(option) => option.label || ''}
            getOptionKey={(option) => option.value}
            isOptionEqualToValue={(option, value) => option.value === value?.value}
            disabled={loading || isFieldDisabled}
            renderInput={(params) => (
              <TextField
                {...params}
                fullWidth
                label={field.label}
                error={!!errors[field.name]}
                helperText={errors[field.name] || field.helperText}
                required={field.required}
                InputProps={{
                  ...params.InputProps,
                  startAdornment: field.icon ? (
                    <InputAdornment position="start">
                      {React.createElement(field.icon, { sx: { color: 'action.active', fontSize: 20 } })}
                    </InputAdornment>
                  ) : null,
                }}
                sx={{
                  minWidth: 120,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
            )}
            renderOption={(props, option) => (
              <li {...props} key={option.value}>
                {option.render ? option.render(option) : option.label}
              </li>
            )}
          />
        );

      case 'freesolo-autocomplete':
        const freesoloOptions = typeof field.options === 'function' ? field.options(formData) : field.options;
        const freesoloCurrentValue = formData[field.name] || '';
        // If current value matches an option, use the option object; otherwise use the string value
        const freesoloSelectedOption = freesoloOptions.find(option => option.value === freesoloCurrentValue);

        const handleFreesoloAutocompleteChange = (event, newValue, reason) => {
          // Handle both string (user typed) and object (selected from options)
          const value = newValue 
            ? (typeof newValue === 'string' ? newValue : (newValue.value || ''))
            : '';

          console.log('Freesolo onChange for', field.name, ':', value, 'reason:', reason);

          // Special handling for create_new options - only if creation is allowed
          if (value === 'create_new' && field.name === 'contact_selection' && field.canCreate) {
            setFormData(prev => applyDerivedFormData({
              ...prev,
              [field.name]: value,
              new_contact_data: undefined
            }, field.name));
            setDialogKey(prev => prev + 1);
            setDialogState(prev => ({ ...prev, contactDialog: true }));
          } else {
            handleChange(field.name)({ target: { value } });
          }
        };

        // Handle input change for free text entry
        const handleFreesoloInputChange = (event, newInputValue, reason) => {
          // console.log('Freesolo onInputChange for', field.name, ':', newInputValue, 'reason:', reason);
          
          // Update form data when user types (not when selecting or clearing)
          if (reason === 'input') {
            handleChange(field.name)({ target: { value: newInputValue } });
          }
        };

        return (
          <Autocomplete
            fullWidth
            freeSolo
            value={freesoloSelectedOption || null}
            inputValue={freesoloCurrentValue}
            onChange={handleFreesoloAutocompleteChange}
            onInputChange={handleFreesoloInputChange}
            options={freesoloOptions}
            getOptionLabel={(option) => {
              // Handle both object options and string values (user-typed)
              if (typeof option === 'string') return option;
              return option.label || '';
            }}
            getOptionKey={(option) => typeof option === 'string' ? option : option.value}
            isOptionEqualToValue={(option, value) => {
              // Handle comparison for objects only
              return option.value === value?.value;
            }}
            disabled={loading || isFieldDisabled}
            renderInput={(params) => (
              <TextField
                {...params}
                fullWidth
                label={field.label}
                error={!!errors[field.name]}
                helperText={errors[field.name] || field.helperText}
                required={field.required}
                InputProps={{
                  ...params.InputProps,
                  startAdornment: field.icon ? (
                    <InputAdornment position="start">
                      {React.createElement(field.icon, { sx: { color: 'action.active', fontSize: 20 } })}
                    </InputAdornment>
                  ) : null,
                }}
                sx={{
                  minWidth: 120,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
            )}
            renderOption={(props, option) => (
              <li {...props} key={option.value}>
                {option.render ? option.render(option) : option.label}
              </li>
            )}
          />
        );

      case 'slider':
        const scoreColor = field.getColor ? field.getColor(formData[field.name] || 0) : '#667eea';
        const scoreLabel = field.getLabel ? field.getLabel(formData[field.name] || 0) : '';

        return (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {field.label}
                </Typography>
                {scoreLabel && (
                  <Chip
                    label={scoreLabel}
                    size="small"
                    sx={{
                      bgcolor: scoreColor,
                      color: 'white',
                      fontWeight: 600
                    }}
                  />
                )}
              </Box>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  color: scoreColor
                }}
              >
                {formData[field.name] || 0}
              </Typography>
            </Box>

            <Slider
              value={formData[field.name] || 0}
              onChange={handleSliderChange(field.name)}
              min={field.min || 0}
              max={field.max || 100}
              step={field.step || 5}
              marks={field.marks}
              valueLabelDisplay="auto"
              disabled={loading || isFieldDisabled}
              sx={{
                '& .MuiSlider-thumb': {
                  width: 12,
                  height: 12,
                  backgroundColor: scoreColor,
                },
                '& .MuiSlider-track': {
                  height: 6,
                  backgroundColor: scoreColor,
                },
                '& .MuiSlider-rail': {
                  height: 6,
                  opacity: 0.3,
                },
                '& .MuiSlider-mark': {
                  height: 6,
                  width: 2,
                }
              }}
            />

            {field.hint && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                {field.hint}
              </Typography>
            )}
          </Box>
        );

      case 'checkbox':
        return (
          <FormControlLabel
            control={
              <Checkbox
                checked={!!formData[field.name]}
                onChange={handleCheckboxChange(field.name)}
                disabled={loading || isFieldDisabled}
                name={field.name}
              />
            }
            label={field.label}
          />
        );

      case 'array':
        const arrayValue = formData[field.name] || [];
        const itemTemplate = (field.itemFields || []).reduce((acc, itemField) => {
          // Use defaultValue if provided, otherwise use type-based defaults
          if (itemField.defaultValue !== undefined) {
            acc[itemField.name] = itemField.defaultValue;
          } else {
            acc[itemField.name] = itemField.type === 'checkbox' ? false : '';
          }
          return acc;
        }, {});

        return (
          <Box sx={{ width: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {field.label}
              </Typography>
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={handleArrayAdd(field.name, itemTemplate)}
                disabled={loading}
                variant="outlined"
              >
                {field.addButtonLabel || 'Add Item'}
              </Button>
            </Box>

            <Stack spacing={2}>
              {arrayValue.map((item, index) => (
                <Paper
                  key={index}
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    position: 'relative',
                    bgcolor: 'grey.50'
                  }}
                >
                  <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                    <IconButton
                      size="small"
                      onClick={handleArrayRemove(field.name, index)}
                      disabled={loading}
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  <Grid container spacing={2}>
                    {(field.itemFields || []).map((itemField) => {
                      const itemFieldProps = {
                        fullWidth: true,
                        label: itemField.label,
                        name: `${field.name}[${index}].${itemField.name}`,
                        value: item[itemField.name] || '',
                        onChange: handleArrayItemChange(field.name, index, itemField.name),
                        required: itemField.required,
                        disabled: loading
                      };

                      return (
                        <Grid
                          key={itemField.name}
                          item
                          size={{ xs: itemField.grid?.xs || 12, sm: itemField.grid?.sm || 6, md: itemField.grid?.md || 4, lg: itemField.grid?.lg || 3 }}
                        >
                          {itemField.type === 'select' ? (
                            <FormControl fullWidth>
                              <InputLabel>{itemField.label}</InputLabel>
                              <Select
                                {...itemFieldProps}
                                label={itemField.label}
                              >
                                {(itemField.options || []).map((option) => (
                                  <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          ) : itemField.type === 'autocomplete' ? (
                            <Autocomplete
                              fullWidth
                              value={itemField.options?.find(opt => opt.value === item[itemField.name]) || null}
                              onChange={(e, newValue) => {
                                handleArrayItemChange(field.name, index, itemField.name)({
                                  target: { value: newValue?.value || '' }
                                });
                              }}
                              options={itemField.options || []}
                              getOptionLabel={(option) => option.label || ''}
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  label={itemField.label}
                                  required={itemField.required}
                                />
                              )}
                            />
                          ) : itemField.type === 'checkbox' ? (
                            <Box>
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={!!item[itemField.name]}
                                    onChange={(e) => handleArrayItemChange(field.name, index, itemField.name)(e)}
                                    disabled={loading}
                                    color={errors[`${field.name}[${index}].${itemField.name}`] ? 'error' : 'primary'}
                                  />
                                }
                                label={itemField.label}
                              />
                              {errors[`${field.name}[${index}].${itemField.name}`] && (
                                <FormHelperText error>
                                  {errors[`${field.name}[${index}].${itemField.name}`]}
                                </FormHelperText>
                              )}
                            </Box>
                          ) : (
                            <TextField
                              {...itemFieldProps}
                              type={itemField.type || 'text'}
                            />
                          )}
                        </Grid>
                      );
                    })}
                  </Grid>
                </Paper>
              ))}

              {arrayValue.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 3, color: 'text.secondary' }}>
                  <Typography variant="body2">
                    No items added yet. Click "{field.addButtonLabel || 'Add Item'}" to add one.
                  </Typography>
                </Box>
              )}
            </Stack>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} ref={formRef}>
      {submitError && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            borderRadius: 2,
            '& .MuiAlert-message': { width: '100%' }
          }}
        >
          {submitError}
        </Alert>
      )}

      {config.sections.map((section, sectionIndex) => {
        if (section.type === 'custom' && customRenderers && customRenderers[section.id]) {
          return (
            <React.Fragment key={section.id}>
              {customRenderers[section.id]}
            </React.Fragment>
          );
        }

        const hasSubSections = Array.isArray(section.subSections) && section.subSections.length > 0;

        return (
          <Paper
            key={section.id || sectionIndex}
            elevation={0}
            sx={{
              p: 0,
              mb: sectionIndex < config.sections.length - 1 ? 3 : 2,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              bgcolor: 'background.paper',
              overflow: 'hidden'
            }}
          >
            <Accordion
              defaultExpanded={section.defaultExpanded ?? true}
              disableGutters
              square
              sx={{
                boxShadow: 'none',
                '&:before': { display: 'none' }
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                {section.title && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {section.icon && (
                      <section.icon sx={{ mr: 1.5, color: 'primary.main', fontSize: 28 }} />
                    )}
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {section.title}
                    </Typography>
                  </Box>
                )}
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0, pb: 2.5, px: 3 }}>
                {!hasSubSections && (
                  <Grid container spacing={2.5}>
                    {section.fields && section.fields.map((field) => (
                      <Grid
                        key={field.name}
                        item
                        size={{ xs: field.grid?.xs || 12, sm: field.grid?.sm || 6, md: field.grid?.md || 4, lg: field.grid?.lg || 3 }}
                      >
                        {field.type === 'divider' ? (
                          <Divider sx={{ my: 1 }} />
                        ) : (
                          renderField(field)
                        )}
                      </Grid>
                    ))}
                  </Grid>
                )}

                {hasSubSections && (
                  <Box>
                    {section.subSections.map((subSection) => (
                      <Accordion
                        key={subSection.id}
                        defaultExpanded={subSection.defaultExpanded ?? false}
                        sx={{ mb: 1.5, boxShadow: 'none', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
                      >
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Typography sx={{ fontWeight: 600 }}>
                            {subSection.title}
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Grid container spacing={2.5}>
                            {(subSection.fields || []).map((field) => (
                              <Grid
                                key={field.name}
                                item
                                size={{ xs: field.grid?.xs || 12, sm: field.grid?.sm || 6, md: field.grid?.md || 4, lg: field.grid?.lg || 3 }}
                              >
                                {field.type === 'divider' ? (
                                  <Divider sx={{ my: 1 }} />
                                ) : (
                                  renderField(field)
                                )}
                              </Grid>
                            ))}
                          </Grid>
                        </AccordionDetails>
                      </Accordion>
                    ))}
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>
          </Paper>
        );
      })}

      {/* Actions */}
      {showActions && config.actions && !compact && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
          {config.actions.cancel && (
            <Button
              onClick={handleCancel}
              variant="outlined"
              size="large"
              disabled={loading}
              sx={{
                textTransform: 'none',
                px: 3,
                borderRadius: 2
              }}
            >
              {config.actions.cancel.label || 'Cancel'}
            </Button>
          )}

          {config.actions.submit && (
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                textTransform: 'none',
                px: 4,
                borderRadius: 2,
                background: config.actions.submit.gradient || 'linear-gradient(135deg, #586a68 0%, #4e605e 100%)',
                '&:hover': {
                  background: config.actions.submit.hoverGradient || 'linear-gradient(135deg, #4e605e 0%, #434f4e 100%)',
                }
              }}
            >
              {config.actions.submit.label || 'Submit'}
            </Button>
          )}
        </Box>
      )}

      {/* Contact Creation Dialog */}
      <Dialog
        key={`contact-${dialogKey}`}
        open={dialogState.contactDialog || false}
        onClose={() => handleCloseDialog('contactDialog')}
        maxWidth="md"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: 3,
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1
        }}>
          <Typography variant="subtitle1" component="div" sx={{ fontWeight: 600 }}>
            {ContactFormConfig.title}
          </Typography>
          <IconButton
            onClick={() => handleCloseDialog('contactDialog')}
            size="small"
            sx={{ color: 'grey.500' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          <BaseForm
            config={ContactFormConfig}
            initialData={formData.new_contact_data || ContactFormConfig.initialData}
            onSubmit={(contactData) => handleDialogSubmit('contactDialog', contactData)}
            onCancel={() => handleCloseDialog('contactDialog')}
            loading={loading}
          />
        </DialogContent>
      </Dialog>

      {/* Customer Creation Dialog */}
      <Dialog
        key={`customer-${dialogKey}`}
        open={dialogState.customerDialog || false}
        onClose={() => handleCloseDialog('customerDialog')}
        maxWidth="md"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: 3,
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1
        }}>
          <Typography variant="subtitle1" component="div" sx={{ fontWeight: 600 }}>
            {CustomerFormConfig.title}
          </Typography>
          <IconButton
            onClick={() => handleCloseDialog('customerDialog')}
            size="small"
            sx={{ color: 'grey.500' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          <BaseForm
            config={CustomerFormConfig}
            initialData={formData.new_customer_data || CustomerFormConfig.initialData}
            onSubmit={(customerData) => handleDialogSubmit('customerDialog', customerData)}
            onCancel={() => handleCloseDialog('customerDialog')}
            loading={loading}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};


export default forwardRef(BaseForm);
