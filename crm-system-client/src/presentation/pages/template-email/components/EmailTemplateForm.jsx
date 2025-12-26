import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Divider,
  Typography,
  Alert,
  Grid
} from '@mui/material';
import { Save as SaveIcon, Close as CloseIcon } from '@mui/icons-material';
import TemplateEditor from './TemplateEditor';
import VariableSelector from './VariableSelector';
import { EmailTemplateCategory, EmailTemplateCategoryLabels } from '../../../../utils/constants_template_mail';

const EmailTemplateForm = ({ open, onClose, template, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    body: '',
    description: '',
    category: EmailTemplateCategory.General,
    isShared: false
  });

  const [errors, setErrors] = useState({});
  const [subjectCursorPos, setSubjectCursorPos] = useState(0);

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name || '',
        subject: template.subject || '',
        body: template.body || '',
        description: template.description || '',
        category: template.category || EmailTemplateCategory.General,
        isShared: template.isShared || false
      });
    } else {
      setFormData({
        name: '',
        subject: '',
        body: '',
        description: '',
        category: EmailTemplateCategory.General,
        isShared: false
      });
    }
    setErrors({});
  }, [template, open]);

  const handleChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user types
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleBodyChange = (content) => {
    setFormData((prev) => ({
      ...prev,
      body: content
    }));
  };

  const insertVariableIntoSubject = (variableKey) => {
    const input = document.getElementById('template-subject');
    if (input) {
      const start = input.selectionStart;
      const end = input.selectionEnd;
      const newValue = formData.subject.substring(0, start) + variableKey + formData.subject.substring(end);
      setFormData((prev) => ({
        ...prev,
        subject: newValue
      }));
      // Set cursor position after inserted variable
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + variableKey.length, start + variableKey.length);
      }, 0);
    } else {
      setFormData((prev) => ({
        ...prev,
        subject: prev.subject + ' ' + variableKey
      }));
    }
  };

  const insertVariableIntoBody = (variableKey) => {
    // CKEditor will handle this through its API
    // For now, append to the end
    setFormData((prev) => ({
      ...prev,
      body: prev.body + ' ' + variableKey
    }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Template name is required';
    if (!formData.subject.trim()) newErrors.subject = 'Subject is required';
    if (!formData.body.trim()) newErrors.body = 'Email body is required';
    if (!formData.category) newErrors.category = 'Category is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const templateData = {
      ...formData,
      id: template?.id
    };

    onSave(templateData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Typography variant="h5">{template ? 'Edit Template' : 'Create New Template'}</Typography>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={2}>
          {/* Template Name */}
          <Grid item size={{xs: 12, md: 8}}>
            <TextField
              fullWidth
              label="Template Name"
              value={formData.name}
              onChange={handleChange('name')}
              error={!!errors.name}
              helperText={errors.name}
              required
              placeholder="e.g., Lead Follow-up Email"
            />
          </Grid>

          {/* Category */}
          <Grid item size={{xs: 12, md: 4}} >
            <FormControl fullWidth required error={!!errors.category}>
              <InputLabel>Category</InputLabel>
              <Select value={formData.category} onChange={handleChange('category')} label="Category">
                {Object.entries(EmailTemplateCategory).map(([key, value]) => (
                  <MenuItem key={value} value={value}>
                    {EmailTemplateCategoryLabels[value]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Description */}
          <Grid item size={{xs: 12}}>
            <TextField
              fullWidth
              label="Description (optional)"
              value={formData.description}
              onChange={handleChange('description')}
              multiline
              rows={2}
              placeholder="Brief description of when to use this template"
            />
          </Grid>

          {/* Subject */}
          <Grid item size={{xs: 12}}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2">Email Subject *</Typography>
              <VariableSelector onInsert={insertVariableIntoSubject} variant="chip" />
            </Box>
            <TextField
              id="template-subject"
              fullWidth
              value={formData.subject}
              onChange={handleChange('subject')}
              onSelect={(e) => setSubjectCursorPos(e.target.selectionStart)}
              error={!!errors.subject}
              helperText={errors.subject}
              required
              placeholder="e.g., Following up - {{lead_company}}"
            />
          </Grid>

          {/* Body */}
          <Grid item size={{xs: 12}}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2">Email Body *</Typography>
              <VariableSelector onInsert={insertVariableIntoBody} variant="chip" />
            </Box>
            <TemplateEditor value={formData.body} onChange={handleBodyChange} />
            {errors.body && (
              <Alert severity="error" sx={{ mt: 1 }}>
                {errors.body}
              </Alert>
            )}
          </Grid>

          {/* Sharing Option */}
          <Grid item size={{xs: 12}}>
            <Divider sx={{ my: 2 }} />
            <FormControlLabel
              control={<Switch checked={formData.isShared} onChange={handleChange('isShared')} />}
              label="Share this template with all users"
            />
            <Typography variant="caption" color="text.secondary" display="block" sx={{ ml: 4 }}>
              When shared, all users can view and edit this template
            </Typography>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} startIcon={<CloseIcon />}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} startIcon={<SaveIcon />}>
          {template ? 'Save Changes' : 'Create Template'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EmailTemplateForm;
