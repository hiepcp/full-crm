import React, { useState } from 'react';
import { Button, IconButton, Tooltip, CircularProgress, Snackbar, Alert } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import goalsApi from '../../../infrastructure/api/goalsApi';

/**
 * RecalculateButton - Button to trigger manual recalculation for auto-calculated goals
 * @param {Object} props
 * @param {Object} props.goal - Goal object to recalculate
 * @param {Function} props.onSuccess - Success callback (receives updated goal)
 * @param {string} props.variant - 'button' | 'icon' (default: 'icon')
 * @param {string} props.size - Button size: 'small' | 'medium' | 'large'
 */
const RecalculateButton = ({ goal, onSuccess, variant = 'icon', size = 'small' }) => {
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleRecalculate = async () => {
    if (!goal || goal.calculationSource !== 'auto_calculated') {
      setSnackbar({
        open: true,
        message: 'Only auto-calculated goals can be recalculated',
        severity: 'warning',
      });
      return;
    }

    try {
      setLoading(true);
      const response = await goalsApi.recalculateProgress(goal.id);
      const updatedGoal = response.data?.data;

      setSnackbar({
        open: true,
        message: 'Goal recalculated successfully',
        severity: 'success',
      });

      if (onSuccess) {
        onSuccess(updatedGoal);
      }
    } catch (err) {
      console.error('Failed to recalculate goal:', err);
      const errorMessage = err.response?.data?.message || 'Failed to recalculate goal';
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (!goal || goal.calculationSource !== 'auto_calculated') {
    return null; // Only show for auto-calculated goals
  }

  const buttonContent = loading ? <CircularProgress size={20} /> : <RefreshIcon />;

  return (
    <>
      {variant === 'icon' ? (
        <Tooltip title="Recalculate progress from CRM data">
          <IconButton onClick={handleRecalculate} disabled={loading} size={size} color="primary">
            {buttonContent}
          </IconButton>
        </Tooltip>
      ) : (
        <Button
          onClick={handleRecalculate}
          disabled={loading}
          size={size}
          variant="outlined"
          startIcon={buttonContent}
        >
          Recalculate
        </Button>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default RecalculateButton;
