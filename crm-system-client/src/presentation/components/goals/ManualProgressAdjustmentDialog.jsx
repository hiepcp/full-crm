import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Alert,
  Typography,
  CircularProgress,
} from '@mui/material';
import goalsApi from '../../../infrastructure/api/goalsApi';

/**
 * ManualProgressAdjustmentDialog - Dialog for manual goal progress override with justification
 * @param {Object} props
 * @param {boolean} props.open - Dialog open state
 * @param {Function} props.onClose - Close handler
 * @param {Object} props.goal - Goal object to adjust
 * @param {Function} props.onSuccess - Success callback (receives updated goal)
 */
const ManualProgressAdjustmentDialog = ({ open, onClose, goal, onSuccess }) => {
  const [newProgress, setNewProgress] = useState(goal?.progress || 0);
  const [justification, setJustification] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    // Validation
    if (!justification || justification.trim().length < 10) {
      setError('Justification must be at least 10 characters');
      return;
    }

    if (newProgress < 0) {
      setError('Progress cannot be negative');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await goalsApi.manualAdjustProgress(goal.id, {
        newProgress: parseFloat(newProgress),
        justification: justification.trim(),
      });

      const updatedGoal = response.data?.data;

      // Notify parent component
      if (onSuccess) {
        onSuccess(updatedGoal);
      }

      // Close dialog
      handleClose();
    } catch (err) {
      console.error('Failed to adjust progress:', err);
      setError(err.response?.data?.message || 'Failed to adjust progress. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setNewProgress(goal?.progress || 0);
    setJustification('');
    setError(null);
    onClose();
  };

  if (!goal) {
    return null;
  }

  const currentProgressPercentage = goal.progressPercentage || 0;
  const newProgressPercentage = goal.targetValue
    ? (newProgress / goal.targetValue) * 100
    : 0;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Manual Progress Adjustment</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Goal: <strong>{goal.name}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Current Progress: <strong>{goal.progress?.toFixed(2)}</strong> / {goal.targetValue}{' '}
            ({currentProgressPercentage.toFixed(1)}%)
          </Typography>

          {goal.calculationSource === 'auto_calculated' && (
            <Alert severity="warning" sx={{ mt: 2, mb: 2 }}>
              This goal is auto-calculated. Manual adjustment will override automatic calculations.
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            label="New Progress Value"
            type="number"
            value={newProgress}
            onChange={(e) => setNewProgress(e.target.value)}
            margin="normal"
            inputProps={{ min: 0, step: 'any' }}
            helperText={`New percentage: ${newProgressPercentage.toFixed(1)}%`}
          />

          <TextField
            fullWidth
            label="Justification (minimum 10 characters)"
            multiline
            rows={4}
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            margin="normal"
            required
            helperText={`${justification.length} / 10 characters minimum`}
            error={justification.length > 0 && justification.length < 10}
          />

          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Note: This action will create an audit log entry and progress snapshot.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || justification.length < 10}
          startIcon={loading && <CircularProgress size={16} />}
        >
          Adjust Progress
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ManualProgressAdjustmentDialog;
