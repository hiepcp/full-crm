import { useState, useEffect } from 'react';
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
  MenuItem
} from '@mui/material';
import { TEAM_ROLES } from '../../../utils/teamRoles';

const TeamMemberForm = ({ open, onClose, onSave, member }) => {
  const [formData, setFormData] = useState({
    user_email: '',
    role: 'Member'
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (member) {
      setFormData({
        user_email: member.user_email || '',
        role: member.role || 'Member'
      });
    }
  }, [member, open]);

  const validate = () => {
    const newErrors = {};
    if (!formData.user_email.trim()) {
      newErrors.user_email = 'User email is required';
    } else if (formData.user_email.length > 320) {
      newErrors.user_email = 'Email must be 320 characters or less';
    } else if (!formData.role) {
      newErrors.role = 'Role is required';
    } else if (!TEAM_ROLES.find(r => r.value === formData.role)) {
      newErrors.role = 'Invalid role value';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        user_email: formData.user_email.trim(),
        role: formData.role
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({ user_email: '', role: 'Member' });
    setErrors({});
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{member ? 'Edit Team Member' : 'Add Team Member'}</DialogTitle>
      <DialogContent>
        <Box component="form" sx={{ p: 3 }} onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="User Email"
                name="user_email"
                value={formData.user_email}
                onChange={handleChange}
                error={!!errors.user_email}
                helperText={errors.user_email}
                disabled={isSubmitting}
                type="email"
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth error={!!errors.role}>
                <InputLabel>Role *</InputLabel>
                <Select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  disabled={isSubmitting}
                >
                  {TEAM_ROLES.map(role => (
                    <MenuItem key={role.value} value={role.value}>
                      {role.label}
                    </MenuItem>
                  ))}
                </Select>
                {errors.role && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                    {errors.role}
                  </Typography>
                )}
              </FormControl>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          type="submit"
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TeamMemberForm;