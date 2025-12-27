import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  Box,
  Typography,
  IconButton
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { activityTypes, priorityLevels } from '../../../../utils/constants_calendar';

const ActivityFormDialog = ({ open, onClose, onSave, activity, selectedDate }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'meeting',
    priority: 'normal',
    start: '',
    end: '',
    location: '',
    assignedTo: 'sales@crm.com',
    relationType: 'lead',
    relationId: '',
    attendees: '',
    phoneNumber: ''
  });

  useEffect(() => {
    if (activity) {
      // Edit mode - populate form with activity data
      setFormData({
        title: activity.title || '',
        description: activity.extendedProps?.description || '',
        type: activity.extendedProps?.type || 'meeting',
        priority: activity.extendedProps?.priority || 'normal',
        start: activity.start ? formatDateTimeLocal(activity.start) : '',
        end: activity.end ? formatDateTimeLocal(activity.end) : '',
        location: activity.extendedProps?.location || '',
        assignedTo: activity.extendedProps?.assignedTo || 'sales@crm.com',
        relationType: activity.extendedProps?.relationType || 'lead',
        relationId: activity.extendedProps?.relationId || '',
        attendees: activity.extendedProps?.attendees?.join(', ') || '',
        phoneNumber: activity.extendedProps?.phoneNumber || ''
      });
    } else if (selectedDate) {
      // Create mode with selected date
      const startTime = formatDateTimeLocal(selectedDate);
      const endDate = new Date(selectedDate);
      endDate.setHours(endDate.getHours() + 1);
      const endTime = formatDateTimeLocal(endDate);
      
      setFormData({
        ...formData,
        start: startTime,
        end: endTime
      });
    }
  }, [activity, selectedDate, open]);

  const formatDateTimeLocal = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-set end time to 1 hour after start time if not set
    if (field === 'start' && !formData.end) {
      const startDate = new Date(value);
      startDate.setHours(startDate.getHours() + 1);
      setFormData(prev => ({
        ...prev,
        end: formatDateTimeLocal(startDate)
      }));
    }
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.start) {
      alert('Please fill in required fields');
      return;
    }

    const activityData = {
      id: activity?.id,
      title: formData.title,
      start: formData.start,
      end: formData.end || formData.start,
      backgroundColor: activityTypes[formData.type]?.color || '#1976d2',
      borderColor: activityTypes[formData.type]?.color || '#1976d2',
      extendedProps: {
        description: formData.description,
        type: formData.type,
        priority: formData.priority,
        assignedTo: formData.assignedTo,
        relationType: formData.relationType,
        relationId: formData.relationId,
        location: formData.location,
        attendees: formData.attendees ? formData.attendees.split(',').map(a => a.trim()) : [],
        phoneNumber: formData.phoneNumber
      }
    };

    onSave(activityData);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      type: 'meeting',
      priority: 'normal',
      start: '',
      end: '',
      location: '',
      assignedTo: 'sales@crm.com',
      relationType: 'lead',
      relationId: '',
      attendees: '',
      phoneNumber: ''
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {activity ? 'Edit Activity' : 'Create New Activity'}
          </Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              required
              label="Title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="e.g., Meeting with Client"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              select
              required
              label="Activity Type"
              value={formData.type}
              onChange={(e) => handleChange('type', e.target.value)}
            >
              {Object.entries(activityTypes).map(([key, value]) => (
                <MenuItem key={key} value={key}>
                  <Box display="flex" alignItems="center">
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        backgroundColor: value.color,
                        mr: 1
                      }}
                    />
                    {value.label}
                  </Box>
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              select
              required
              label="Priority"
              value={formData.priority}
              onChange={(e) => handleChange('priority', e.target.value)}
            >
              {Object.entries(priorityLevels).map(([key, value]) => (
                <MenuItem key={key} value={key}>
                  {value.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              type="datetime-local"
              label="Start Date & Time"
              value={formData.start}
              onChange={(e) => handleChange('start', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="datetime-local"
              label="End Date & Time"
              value={formData.end}
              onChange={(e) => handleChange('end', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Add activity details..."
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Location"
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              placeholder="e.g., Conference Room A"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Assigned To"
              value={formData.assignedTo}
              onChange={(e) => handleChange('assignedTo', e.target.value)}
              placeholder="e.g., sales@crm.com"
            />
          </Grid>

          {formData.type === 'call' && (
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone Number"
                value={formData.phoneNumber}
                onChange={(e) => handleChange('phoneNumber', e.target.value)}
                placeholder="e.g., +84-123-456-789"
              />
            </Grid>
          )}

          {(formData.type === 'meeting' || formData.type === 'training') && (
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Attendees"
                value={formData.attendees}
                onChange={(e) => handleChange('attendees', e.target.value)}
                placeholder="Comma-separated emails: john@example.com, jane@example.com"
                helperText="Enter email addresses separated by commas"
              />
            </Grid>
          )}

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              select
              label="Relation Type"
              value={formData.relationType}
              onChange={(e) => handleChange('relationType', e.target.value)}
            >
              <MenuItem value="lead">Lead</MenuItem>
              <MenuItem value="customer">Customer</MenuItem>
              <MenuItem value="contact">Contact</MenuItem>
              <MenuItem value="deal">Deal</MenuItem>
              <MenuItem value="internal">Internal</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Relation ID"
              type="number"
              value={formData.relationId}
              onChange={(e) => handleChange('relationId', e.target.value)}
              placeholder="Related record ID"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} variant="outlined">
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          {activity ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ActivityFormDialog;
