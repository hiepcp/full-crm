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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Divider,
  Alert,
  IconButton,
  InputAdornment,
  Paper
} from '@mui/material';
import {
  Close as CloseIcon,
  Email as EmailIcon,
  Security as SecurityIcon,
  CheckCircle as CheckCircleIcon,
  PersonAdd as PersonAddIcon
} from '@mui/icons-material';
import { TEAM_ROLES } from '../../../utils/constants';
import { getRoleDescription } from './utils/roleUtils';

const TeamMemberForm = ({ open, onClose, onSave, member }) => {
  const [formData, setFormData] = useState({
    userEmail: '',
    role: 'Member'
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (member) {
      setFormData({
        userEmail: member.user?.email || member.userEmail || '',
        role: member.role || 'Member'
      });
    } else {
      setFormData({ userEmail: '', role: 'Member' });
    }
    setErrors({});
  }, [member, open]);

  const validate = () => {
    const newErrors = {};
    if (!formData.userEmail.trim()) {
      newErrors.userEmail = 'User email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.userEmail)) {
      newErrors.userEmail = 'Please enter a valid email address';
    } else if (formData.userEmail.length > 320) {
      newErrors.userEmail = 'Email must be 320 characters or less';
    }
    if (!formData.role) {
      newErrors.role = 'Role is required';
    } else if (!TEAM_ROLES.find((r) => r.value === formData.role)) {
      newErrors.role = 'Invalid role value';
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
        userEmail: formData.userEmail.trim(),
        role: formData.role
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({ userEmail: '', role: 'Member' });
    setErrors({});
    onClose();
  };


  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
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
          <PersonAddIcon sx={{ fontSize: 28 }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {member ? 'Edit Team Member' : 'Add Team Member'}
          </Typography>
        </Stack>
        <IconButton onClick={handleCancel} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 4 }}>
          {/* Info Alert */}
          <Alert severity="info" icon={<CheckCircleIcon />} sx={{ mb: 3, borderRadius: 1.5 }}>
            {member
              ? 'Update the member role below. Changes will be applied immediately.'
              : 'Add a new member to this team by entering their email address and assigning a role.'}
          </Alert>

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* User Email */}
              <Grid size={12}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}>
                  User Email <span style={{ color: 'red' }}>*</span>
                </Typography>
                <TextField
                  required
                  fullWidth
                  placeholder="Enter user email (e.g., user@example.com)"
                  name="userEmail"
                  value={formData.userEmail}
                  onChange={handleChange}
                  error={!!errors.userEmail}
                  helperText={errors.userEmail || 'Enter the email address of the user you want to add'}
                  disabled={isSubmitting || !!member}
                  type="email"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon sx={{ color: 'action.active' }} />
                      </InputAdornment>
                    )
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5
                    }
                  }}
                />
                {member && (
                  <Alert severity="warning" sx={{ mt: 1.5, borderRadius: 1.5 }}>
                    <Typography variant="caption">
                      Email cannot be changed when editing a member. To change the email, remove this member and
                      add them again.
                    </Typography>
                  </Alert>
                )}
              </Grid>

              {/* Role */}
              <Grid size={12}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}>
                  Role <span style={{ color: 'red' }}>*</span>
                </Typography>
                <FormControl
                  fullWidth
                  error={!!errors.role}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5
                    }
                  }}
                >
                  <Select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    startAdornment={
                      <InputAdornment position="start">
                        <SecurityIcon sx={{ color: 'action.active', ml: 1 }} />
                      </InputAdornment>
                    }
                  >
                    {TEAM_ROLES.map((role) => (
                      <MenuItem key={role.value} value={role.value}>
                        <Stack>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {role.label}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {getRoleDescription(role.value)}
                          </Typography>
                        </Stack>
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.role && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                      {errors.role}
                    </Typography>
                  )}
                </FormControl>
                {formData.role && (
                  <Alert severity="info" sx={{ mt: 1.5, borderRadius: 1.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                      {TEAM_ROLES.find((r) => r.value === formData.role)?.label} Permissions:
                    </Typography>
                    <Typography variant="caption">{getRoleDescription(formData.role)}</Typography>
                  </Alert>
                )}
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
              {member ? 'Tips for updating roles:' : 'Tips for adding members:'}
            </Typography>
            <Stack spacing={1}>
              {!member && (
                <Typography variant="body2" color="text.secondary">
                  • Make sure the email address is correct and belongs to an existing user
                </Typography>
              )}
              <Typography variant="body2" color="text.secondary">
                • Choose the appropriate role based on the member's responsibilities
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Team Leads have full management access to the team
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Members can contribute and view all team data
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Observers have read-only access
              </Typography>
            </Stack>
          </Paper>
        </Box>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 4, py: 2.5, bgcolor: 'grey.50' }}>
        <Button onClick={handleCancel} disabled={isSubmitting} variant="outlined" sx={{ minWidth: 100 }}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={isSubmitting || !formData.userEmail.trim() || !formData.role}
          startIcon={isSubmitting ? null : <CheckCircleIcon />}
          sx={{ minWidth: 120 }}
        >
          {isSubmitting ? 'Saving...' : member ? 'Update Role' : 'Add Member'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

TeamMemberForm.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  member: PropTypes.object
};

TeamMemberForm.defaultProps = {
  member: null
};

export default TeamMemberForm;
