import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Toolbar,
  Typography,
  IconButton,
  Tooltip,
  Button,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  Chip,
  Stack
} from '@mui/material';
import {
  Close as CloseIcon,
  Delete as DeleteIcon,
  ChangeCircle as ChangeCircleIcon
} from '@mui/icons-material';
import goalsApi from '@infrastructure/api/goalsApi';

/**
 * BulkOperationsToolbar
 * Toolbar for bulk operations on selected goals
 *
 * Features:
 * - Display selected count
 * - Bulk delete with confirmation
 * - Bulk status change (active/cancelled)
 * - Clear selection
 * - Operation results display
 */
const BulkOperationsToolbar = ({ selectedGoals, onClearSelection, onOperationComplete }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusChangeDialogOpen, setStatusChangeDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [operating, setOperating] = useState(false);
  const [operationResult, setOperationResult] = useState(null);

  const selectedCount = selectedGoals.length;
  const maxAllowed = 50;

  const handleStatusMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleStatusMenuClose = () => {
    setAnchorEl(null);
  };

  const handleStatusSelect = (status) => {
    setSelectedStatus(status);
    setStatusChangeDialogOpen(true);
    handleStatusMenuClose();
  };

  const handleBulkDelete = async () => {
    try {
      setOperating(true);
      setOperationResult(null);

      const response = await goalsApi.bulkDelete({
        goalIds: selectedGoals,
        confirmation: true
      });

      const result = response.data.data;
      setOperationResult({
        type: 'delete',
        totalRequested: result.totalRequested || selectedCount,
        succeeded: result.succeeded || [],
        failed: result.failed || []
      });

      setDeleteDialogOpen(false);

      // Clear selection and refresh
      if (onOperationComplete) {
        onOperationComplete();
      }
    } catch (err) {
      console.error('Bulk delete failed:', err);
      setOperationResult({
        type: 'delete',
        error: err.response?.data?.message || 'Bulk delete failed'
      });
    } finally {
      setOperating(false);
    }
  };

  const handleBulkStatusChange = async () => {
    try {
      setOperating(true);
      setOperationResult(null);

      const response = await goalsApi.bulkStatusChange({
        goalIds: selectedGoals,
        newStatus: selectedStatus
      });

      const result = response.data.data;
      setOperationResult({
        type: 'status_change',
        status: selectedStatus,
        totalRequested: result.totalRequested || selectedCount,
        succeeded: result.succeeded || [],
        failed: result.failed || []
      });

      setStatusChangeDialogOpen(false);

      // Clear selection and refresh
      if (onOperationComplete) {
        onOperationComplete();
      }
    } catch (err) {
      console.error('Bulk status change failed:', err);
      setOperationResult({
        type: 'status_change',
        error: err.response?.data?.message || 'Bulk status change failed'
      });
    } finally {
      setOperating(false);
    }
  };

  const handleClearResult = () => {
    setOperationResult(null);
  };

  if (selectedCount === 0 && !operationResult) {
    return null;
  }

  return (
    <Box>
      {/* Toolbar */}
      {selectedCount > 0 && (
        <Toolbar
          sx={{
            pl: { sm: 2 },
            pr: { xs: 1, sm: 1 },
            bgcolor: 'primary.main',
            color: 'primary.contrastText'
          }}
        >
          <Typography sx={{ flex: '1 1 100%' }} variant="subtitle1" component="div">
            {selectedCount} goal{selectedCount > 1 ? 's' : ''} selected
            {selectedCount > maxAllowed && (
              <Chip
                label={`Max ${maxAllowed} allowed`}
                color="error"
                size="small"
                sx={{ ml: 2 }}
              />
            )}
          </Typography>

          <Tooltip title="Delete selected">
            <span>
              <IconButton
                color="inherit"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={selectedCount > maxAllowed}
              >
                <DeleteIcon />
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title="Change status">
            <span>
              <IconButton
                color="inherit"
                onClick={handleStatusMenuOpen}
                disabled={selectedCount > maxAllowed}
              >
                <ChangeCircleIcon />
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title="Clear selection">
            <IconButton color="inherit" onClick={onClearSelection}>
              <CloseIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      )}

      {/* Status Change Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleStatusMenuClose}>
        <MenuItem onClick={() => handleStatusSelect('active')}>Mark as Active</MenuItem>
        <MenuItem onClick={() => handleStatusSelect('cancelled')}>Mark as Cancelled</MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Bulk Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete <strong>{selectedCount}</strong> goal
            {selectedCount > 1 ? 's' : ''}? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={operating}>
            Cancel
          </Button>
          <Button onClick={handleBulkDelete} color="error" variant="contained" disabled={operating}>
            {operating ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status Change Confirmation Dialog */}
      <Dialog open={statusChangeDialogOpen} onClose={() => setStatusChangeDialogOpen(false)}>
        <DialogTitle>Confirm Status Change</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to change the status of <strong>{selectedCount}</strong> goal
            {selectedCount > 1 ? 's' : ''} to <strong>{selectedStatus}</strong>?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusChangeDialogOpen(false)} disabled={operating}>
            Cancel
          </Button>
          <Button
            onClick={handleBulkStatusChange}
            color="primary"
            variant="contained"
            disabled={operating}
          >
            {operating ? 'Changing...' : 'Change Status'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Operation Result Alert */}
      {operationResult && (
        <Alert
          severity={operationResult.error ? 'error' : 'success'}
          onClose={handleClearResult}
          sx={{ mb: 2 }}
        >
          {operationResult.error ? (
            <Typography variant="body2">{operationResult.error}</Typography>
          ) : (
            <Box>
              <Typography variant="body2" fontWeight={600}>
                {operationResult.type === 'delete' ? 'Bulk Delete' : 'Bulk Status Change'} Results
              </Typography>
              <Stack direction="row" spacing={2} mt={1}>
                <Chip
                  label={`${operationResult.succeeded.length} succeeded`}
                  color="success"
                  size="small"
                />
                {operationResult.failed.length > 0 && (
                  <Chip
                    label={`${operationResult.failed.length} failed`}
                    color="error"
                    size="small"
                  />
                )}
              </Stack>
              {operationResult.failed.length > 0 && (
                <Box mt={1}>
                  <Typography variant="caption" color="text.secondary">
                    Failed goals: {operationResult.failed.map((f) => f.goalId || f.id).join(', ')}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </Alert>
      )}
    </Box>
  );
};

BulkOperationsToolbar.propTypes = {
  selectedGoals: PropTypes.arrayOf(PropTypes.number).isRequired,
  onClearSelection: PropTypes.func.isRequired,
  onOperationComplete: PropTypes.func
};

export default BulkOperationsToolbar;
