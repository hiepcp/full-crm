import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box } from '@mui/material';
import { useState, useEffect } from 'react';

import PropTypes from 'prop-types';

export default function DocumentTypeModal({ open, onClose, onSubmit, initialData, loading }) {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');

  useEffect(() => {
    setName(initialData?.name || '');
    setLocation(initialData?.location || '');
  }, [initialData, open]);

  const handleSubmit = (e) => {
    e?.preventDefault?.();
    if (loading) return;
    onSubmit({
      ...initialData,
      name: name.trim(),
      location: location.trim(),
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{initialData ? 'Edit Document Type' : 'Add Document Type'}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Name"
              value={name}
              onChange={e => setName(e.target.value)}
              fullWidth
              autoFocus
              disabled={loading}
            />
            <TextField
              label="Location"
              value={location}
              onChange={e => setLocation(e.target.value)}
              fullWidth
              disabled={loading}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={loading}>{initialData ? 'Save' : 'Add'}</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

DocumentTypeModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  onSubmit: PropTypes.func,
  initialData: PropTypes.object,
  loading: PropTypes.bool,
};
