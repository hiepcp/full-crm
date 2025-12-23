import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FilePreviewer from './FilePreviewer';

const DialogFilePreviewer = ({ open, onClose, idFile, fileName }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 0.5 }}>
        <Typography sx={{ fontSize: '1rem !important', fontWeight: 'bold' }}>
            {fileName || 'File Preview'}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers sx={{ 
          p: 0,
          overflow: 'hidden' // Bỏ scroll của DialogContent
        }}>
        <FilePreviewer idFile={idFile} />
      </DialogContent>
      
      {/* <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions> */}
    </Dialog>
  );
};

export default DialogFilePreviewer;