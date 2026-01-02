import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Grid,
  Paper,
  Stack,
  Divider,
  Alert,
  IconButton,
  InputAdornment
} from '@mui/material';
import {
  Close as CloseIcon,
  People as PeopleIcon,
  Description as DescriptionIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';

const TeamForm = ({ open = false, onClose, onSave, team }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (team) {
      setFormData({
        name: team.name || '',
        description: team.description || ''
      });
    } else {
      setFormData({ name: '', description: '' });
    }
    setErrors({});
  }, [team, open]);

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Team name is required';
    } else if (formData.name.length > 255) {
      newErrors.name = 'Team name must be 255 characters or less';
    } else if (formData.description && formData.description.length > 2000) {
      newErrors.description = 'Description must be 2000 characters or less';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear error for this field when user types
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        name: formData.name.trim(),
        description: formData.description.trim() || null
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', description: '' });
    setErrors({});
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: 24
        }
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          p: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <PeopleIcon sx={{ fontSize: 28 }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {team ? 'Edit Team' : 'Create New Team'}
          </Typography>
        </Stack>
        <IconButton onClick={handleCancel} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 4 }}>
          {/* Info Alert */}
          <Alert
            severity="info"
            icon={<CheckCircleIcon />}
            sx={{ mb: 3, borderRadius: 1.5 }}
          >
            {team
              ? 'Update team information below. Changes will be saved immediately.'
              : 'Create a new sales team to organize your team members and assign roles.'}
          </Alert>

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Team Name */}
              <Grid size={12}>
                <Typography
                  variant="subtitle2"
                  sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}
                >
                  Team Name <span style={{ color: 'error.main' }}>*</span>
                </Typography>
                <TextField
                  required
                  fullWidth
                  placeholder="Enter team name (e.g., Sales Team North)"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  error={!!errors.name}
                  helperText={errors.name || `${formData.name.length}/255 characters`}
                  disabled={isSubmitting}
                  inputProps={{ maxLength: 255 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PeopleIcon sx={{ color: 'action.active' }} />
                      </InputAdornment>
                    )
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5
                    }
                  }}
                />
              </Grid>

              {/* Description */}
              <Grid size={12}>
                <Typography
                  variant="subtitle2"
                  sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}
                >
                  Description <span style={{ color: 'text.secondary' }}>(Optional)</span>
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  placeholder="Describe the team's purpose, responsibilities, or focus area..."
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  error={!!errors.description}
                  helperText={
                    errors.description || `${formData.description.length}/2000 characters`
                  }
                  disabled={isSubmitting}
                  inputProps={{ maxLength: 2000 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.5 }}>
                        <DescriptionIcon sx={{ color: 'action.active' }} />
                      </InputAdornment>
                    )
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5
                    }
                  }}
                />
              </Grid>
            </Grid>
          </form>

          <Divider sx={{ my: 3 }} />

          {/* Tips Section */}
          <Paper
            variant="outlined"
            sx={{
              p: 2.5,
              bgcolor: 'grey.50',
              borderRadius: 1.5,
              borderColor: 'divider'
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
              Tips for creating effective teams:
            </Typography>
            <Stack spacing={1}>
              <Typography variant="body2" color="text.secondary">
                • Choose a clear, descriptive name that reflects the team's purpose
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Add a description to help members understand their role and goals
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • You can add team members after creating the team
              </Typography>
            </Stack>
          </Paper>
        </Box>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 4, py: 2.5, bgcolor: 'grey.50' }}>
        <Button
          onClick={handleCancel}
          disabled={isSubmitting}
          variant="outlined"
          sx={{ minWidth: 100 }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={isSubmitting || !formData.name.trim()}
          startIcon={isSubmitting ? null : <CheckCircleIcon />}
          sx={{ minWidth: 120 }}
        >
          {isSubmitting ? 'Saving...' : team ? 'Update Team' : 'Create Team'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

TeamForm.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  team: PropTypes.object
};

TeamForm.defaultProps = {
  open: false,
  team: null
};

export default TeamForm;
