import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Avatar,
  Button,
  IconButton,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  Select,
  MenuItem,
  TextField,
  Autocomplete,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  People as PeopleIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { getUsers, createAssignee, updateAssignee, deleteAssignee } from '@presentation/data';
import { ASSIGNEE_ROLES } from '@utils/constants';
import CustomSnackbar from '../CustomSnackbar';

const AssigneeSection = ({
  relationType, // 'lead' or 'deal'
  relationId,
  assignees = [],
  onRefresh,
  title = 'Assignees',
  emptyText = 'No assignees assigned yet',
  emptyButtonText = 'Assign team members'
}) => {
  const [assigneesExpanded, setAssigneesExpanded] = useState(true);
  const [assigneeDialogOpen, setAssigneeDialogOpen] = useState(false);
  const [editingAssignee, setEditingAssignee] = useState(null);
  const [assigneeUsers, setAssigneeUsers] = useState([]);
  const [assigneeUsersLoading, setAssigneeUsersLoading] = useState(false);
  const [assigneeFormData, setAssigneeFormData] = useState({
    userIds: [],
    role: 'collaborator',
    notes: '',
    userEmails: [],
  });
  const [assigneeSubmitting, setAssigneeSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Get available users (excluding already assigned users except when editing)
  const getAvailableUsers = () => {
    const existingUserIds = new Set(assignees.map(assignee => assignee.userEmail));
    // If editing, allow the editing assignee to be included
    if (editingAssignee) {
      existingUserIds.delete(editingAssignee.userEmail);
    }
    return assigneeUsers.filter(user => !existingUserIds.has(user.email));
  };

  // Load assignee users
  const loadAssigneeUsers = async () => {
    if (assigneeUsers.length > 0) return; // Already loaded
    try {
      setAssigneeUsersLoading(true);
      const users = await getUsers();
      setAssigneeUsers(users);
    } catch (error) {
      console.error('Error loading users for assignee selection:', error);
      setSnackbar({ open: true, message: 'Failed to load users', severity: 'error' });
    } finally {
      setAssigneeUsersLoading(false);
    }
  };

  // Open assignee dialog
  const handleOpenAssigneeDialog = (assignee = null) => {
    if (assignee) {
      // Editing existing assignee
      setEditingAssignee(assignee);
      setAssigneeFormData({
        role: assignee.role,
        notes: assignee.notes || '',
        userEmails: [assignee.userEmail],
      });
    } else {
      // Creating new assignees
      setEditingAssignee(null);
      setAssigneeFormData({
        userIds: [],
        role: 'collaborator',
        notes: '',
        userEmails: [],
      });
    }
    setAssigneeDialogOpen(true);
    loadAssigneeUsers(); // Load users if not already loaded
  };

  // Close assignee dialog
  const handleCloseAssigneeDialog = () => {
    setAssigneeDialogOpen(false);
    setEditingAssignee(null);
    setAssigneeFormData({
      userIds: [],
      role: 'collaborator',
      notes: '',
      userEmails: [],
    });
  };

  // Submit assignee form
  const handleAssigneeSubmit = async () => {
    // if (!assigneeFormData.userIds || assigneeFormData.userIds.length === 0) {
    //   setSnackbar({ open: true, message: 'Please select at least one user to assign', severity: 'error' });
    //   return;
    // }

    if (!assigneeFormData.userEmails || assigneeFormData.userEmails.length === 0) {
      setSnackbar({ open: true, message: 'Please select at least one user to assign', severity: 'error' });
      return;
    }

    try {
      setAssigneeSubmitting(true);

      if (editingAssignee) {
        // Update existing assignee
        const assigneeData = {
          relationType,
          relationId,
          //userId: parseInt(assigneeFormData.userIds[0], 10),
          userEmail: assigneeFormData.userEmails[0],
          role: assigneeFormData.role,
          notes: assigneeFormData.notes || null
        };
        await updateAssignee(editingAssignee.id, assigneeData);
        setSnackbar({ open: true, message: 'Assignee updated successfully', severity: 'success' });
      } else {
        // Create multiple assignees
        const createPromises = assigneeFormData.userEmails.map(userEmail =>
          createAssignee({
            relationType,
            relationId,
            // userId: parseInt(userId, 10),
            userEmail: userEmail,
            role: assigneeFormData.role,
            notes: assigneeFormData.notes || null
          })
        );

        await Promise.all(createPromises);
        setSnackbar({
          open: true,
          message: assigneeFormData.userIds.length === 1
            ? 'Assignee added successfully'
            : `${assigneeFormData.userIds.length} assignees added successfully`,
          severity: 'success'
        });
      }

      // Refresh data
      if (onRefresh) {
        await onRefresh();
      }

      handleCloseAssigneeDialog();
    } catch (error) {
      console.error('Error saving assignee:', error);
      setSnackbar({
        open: true,
        message: editingAssignee ? 'Failed to update assignee' : 'Failed to add assignee(s)',
        severity: 'error'
      });
    } finally {
      setAssigneeSubmitting(false);
    }
  };

  // Delete assignee
  const handleDeleteAssignee = async (assigneeId) => {
    if (!window.confirm('Are you sure you want to remove this assignee?')) {
      return;
    }

    try {
      await deleteAssignee(assigneeId);
      setSnackbar({ open: true, message: 'Assignee removed successfully', severity: 'success' });

      // Refresh data
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      console.error('Error deleting assignee:', error);
      setSnackbar({ open: true, message: 'Failed to remove assignee', severity: 'error' });
    }
  };

  return (
    <>
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: assigneesExpanded ? 3 : 0 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                cursor: 'pointer',
                flex: 1,
                '&:hover': { opacity: 0.7 }
              }}
              onClick={() => setAssigneesExpanded(!assigneesExpanded)}
            >
              <IconButton
                size="small"
                sx={{ p: 0.5, pointerEvents: 'none' }}
              >
                {assigneesExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
              </IconButton>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                {title} ({assignees ? assignees.length : 0})
              </Typography>
            </Box>
            <IconButton
              size="small"
              sx={{ border: `1px solid #e0e0e0`, borderRadius: '4px' }}
              onClick={() => handleOpenAssigneeDialog()}
            >
              <AddIcon fontSize="small" />
            </IconButton>
          </Box>

          <Collapse in={assigneesExpanded} timeout="auto" unmountOnExit>
            {assignees && assignees.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {assignees.map(assignee => (
                  <Box key={assignee.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                      {assignee.user ? assignee.user.firstName.charAt(0) : 'U'}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {assignee.user ? `${assignee.user.firstName} ${assignee.user.lastName}` : 'Unknown User'}
                      </Typography>
                      <Chip
                        label={ASSIGNEE_ROLES.find(role => role.value === assignee.role)?.label || assignee.role.replace('_', ' ')}
                        size="small"
                        variant="outlined"
                        sx={{
                          fontSize: '0.7rem',
                          height: '18px',
                          textTransform: 'capitalize',
                          mt: 0.5
                        }}
                      />
                      {assignee.notes && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                          {assignee.notes}
                        </Typography>
                      )}
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenAssigneeDialog(assignee)}
                      sx={{ color: 'text.secondary' }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteAssignee(assignee.id)}
                      sx={{ color: 'text.secondary' }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <PeopleIcon sx={{ fontSize: 40, color: 'grey.500', mb: 1 }} />
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  {emptyText}
                </Typography>
                <Button size="small" startIcon={<AddIcon />} onClick={() => handleOpenAssigneeDialog()}>
                  {emptyButtonText}
                </Button>
              </Box>
            )}
          </Collapse>
        </CardContent>
      </Card>

      {/* Assignee Dialog */}
      <Dialog
        open={assigneeDialogOpen}
        onClose={handleCloseAssigneeDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingAssignee ? 'Edit Assignee' : 'Add Assignees'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Autocomplete
              multiple
              options={getAvailableUsers()}
              getOptionLabel={(option) => `${option.firstName} ${option.lastName} (${option.email})`}
              value={getAvailableUsers().filter(user => assigneeFormData.userEmails.includes(user.email))}
              onChange={(event, newValue) => {
                setAssigneeFormData(prev => ({
                  ...prev,
                  userIds: newValue.map(user => user.id.toString()),
                  userEmails: newValue.map(user => user.email.toString())
                }));
              }}
              filterSelectedOptions
              loading={assigneeUsersLoading}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Users"
                  required
                  fullWidth
                />
              )}
              renderTags={(tagValue, getTagProps) =>
                tagValue.map((option, index) => (
                  <Chip
                    label={`${option.firstName} ${option.lastName}`}
                    {...getTagProps({ index })}
                    size="small"
                  />
                ))
              }
            />

            <FormControl fullWidth>
              <Select
                value={assigneeFormData.role}
                onChange={(e) => setAssigneeFormData(prev => ({ ...prev, role: e.target.value }))}
                displayEmpty
              >
                {ASSIGNEE_ROLES.map((role) => (
                  <MenuItem key={role.value} value={role.value}>
                    {role.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Notes (optional)"
              multiline
              rows={3}
              value={assigneeFormData.notes}
              onChange={(e) => setAssigneeFormData(prev => ({ ...prev, notes: e.target.value }))}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAssigneeDialog} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleAssigneeSubmit}
            variant="contained"
            disabled={assigneeSubmitting}
          >
            {assigneeSubmitting ? 'Saving...' : (editingAssignee ? 'Update' : 'Add Assignees')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      />
    </>
  );
};

export default AssigneeSection;