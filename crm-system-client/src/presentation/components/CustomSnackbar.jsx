import React from 'react';
import { Snackbar, Alert } from '@mui/material';

/**
 * CustomSnackbar - A reusable snackbar component for notifications
 * @param {object} props
 * @param {boolean} props.open - Whether the snackbar is open
 * @param {string} props.message - The message to display
 * @param {string} [props.severity='success'] - The severity ('success', 'error', 'warning', 'info')
 * @param {function} props.onClose - Function to call when snackbar closes
 * @param {number} [props.autoHideDuration=6000] - Duration in ms before auto-hide
 * @param {object} [props.alertProps] - Additional props for the Alert component
 * @param {object} [props.snackbarProps] - Additional props for the Snackbar component
 */
const CustomSnackbar = ({
  open,
  message,
  severity = 'success',
  onClose,
  autoHideDuration = 5000,
  alertProps = {},
  snackbarProps = {},
}) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      {...snackbarProps}
    >
      <Alert
        onClose={onClose}
        severity={severity}
        variant="filled"
        sx={{ width: '100%', color: '#fff' }}       
        {...alertProps}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default CustomSnackbar;
