import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Close as CloseIcon } from '@mui/icons-material';

const StyledDialog = styled(Dialog)(({ theme, size }) => ({
  '& .MuiDialog-paper': {
    borderRadius: '16px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    ...(size === 'small' && {
      maxWidth: '400px',
      width: '90%',
    }),
    ...(size === 'medium' && {
      maxWidth: '600px',
      width: '90%',
    }),
    ...(size === 'large' && {
      maxWidth: '900px',
      width: '95%',
    }),
    ...(size === 'xlarge' && {
      maxWidth: '1200px',
      width: '95%',
    }),
  },
  '& .MuiDialogTitle-root': {
    padding: '24px 24px 16px 24px',
    borderBottom: '1px solid #f1f5f9',
  },
  '& .MuiDialogContent-root': {
    padding: '24px',
  },
  '& .MuiDialogActions-root': {
    padding: '16px 24px 24px 24px',
    borderTop: '1px solid #f1f5f9',
  },
}));

const Modal = ({
  open,
  onClose,
  title,
  children,
  actions,
  size = 'medium',
  fullWidth = true,
  showCloseButton = true,
  closeOnBackdropClick = true,
  className = '',
  titleClassName = '',
  contentClassName = '',
  actionsClassName = '',
  ...props
}) => {
  const handleClose = (event, reason) => {
    if (!closeOnBackdropClick && reason === 'backdropClick') {
      return;
    }
    onClose?.();
  };

  return (
    <StyledDialog
      open={open}
      onClose={handleClose}
      maxWidth={size}
      fullWidth={fullWidth}
      className={className}
      size={size}
      {...props}
    >
      {title && (
        <DialogTitle sx={{ position: 'relative' }} className={titleClassName}>
          <Typography
            variant="h6"
            component="div"
            sx={{ fontWeight: 'bold', color: 'grey.800' }}
          >
            {title}
          </Typography>
          {showCloseButton && (
            <IconButton
              aria-label="close"
              onClick={onClose}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
                color: 'grey.400',
                '&:hover': {
                  color: 'grey.600',
                },
              }}
            >
              <CloseIcon />
            </IconButton>
          )}
        </DialogTitle>
      )}

      <DialogContent className={contentClassName}>
        {children}
      </DialogContent>

      {actions && (
        <DialogActions
          sx={{
            justifyContent: 'flex-end',
            gap: 1,
          }}
          className={actionsClassName}
        >
          {actions}
        </DialogActions>
      )}
    </StyledDialog>
  );
};

export default Modal;

