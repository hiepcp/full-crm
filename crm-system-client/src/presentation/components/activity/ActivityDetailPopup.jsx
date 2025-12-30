import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Chip,
  IconButton,
  Button
} from '@mui/material';
import {
  Close as CloseIcon,
  OpenInNew as OpenIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { activityTypes } from '../../../utils/constants_calendar';

// Get activity type color
const getActivityColor = (type) => {
  const colorMap = {
    meeting: '#586a68',
    call: '#ba7351',
    email: '#878C84',
    task: '#CCC79F',
    note: '#BFC2BE'
  };
  return colorMap[type] || '#586a68';
};

export default function ActivityDetailPopup({ open, onClose, selectedEvent }) {
  const navigate = useNavigate();

  if (!selectedEvent) return null;

  const handleNavigateToEntity = () => {
    const entityType = selectedEvent?.extendedProps?.entityType;
    const entityId = selectedEvent?.extendedProps?.entityId;

    if (entityType === 'activity') {
      navigate(`/activities/${entityId}`);
    } else if (entityType === 'lead') {
      navigate(`/leads/${entityId}`);
    } else if (entityType === 'deal') {
      navigate(`/deals/${entityId}`);
    }
    
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5">{selectedEvent.title}</Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Lead Information */}
          {selectedEvent.extendedProps?.entityType === 'lead' && (
            <>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Type</Typography>
                <Chip 
                  label="📋 Lead"
                  sx={{ 
                    backgroundColor: '#ba7351',
                    color: 'white',
                    mt: 0.5
                  }}
                />
              </Box>
              {selectedEvent.extendedProps.company && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Company</Typography>
                  <Typography variant="body1" fontWeight="medium">{selectedEvent.extendedProps.company}</Typography>
                </Box>
              )}
              {selectedEvent.extendedProps.fullName && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Contact Name</Typography>
                  <Typography variant="body1">{selectedEvent.extendedProps.fullName}</Typography>
                </Box>
              )}
              {selectedEvent.extendedProps.email && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                  <Typography variant="body1">{selectedEvent.extendedProps.email}</Typography>
                </Box>
              )}
              {selectedEvent.extendedProps.status && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                  <Chip 
                    label={selectedEvent.extendedProps.status}
                    size="small"
                    sx={{ mt: 0.5, textTransform: 'capitalize' }}
                  />
                </Box>
              )}
              {selectedEvent.extendedProps.source && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Source</Typography>
                  <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>{selectedEvent.extendedProps.source}</Typography>
                </Box>
              )}
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Follow-up Date</Typography>
                <Typography variant="body1">
                  {selectedEvent.start ? new Date(selectedEvent.start).toLocaleString() : 'N/A'}
                </Typography>
              </Box>
            </>
          )}

          {/* Deal Information */}
          {selectedEvent.extendedProps?.entityType === 'deal' && (
            <>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Type</Typography>
                <Chip 
                  label="💼 Deal"
                  sx={{ 
                    backgroundColor: '#CCC79F',
                    color: '#262626',
                    mt: 0.5
                  }}
                />
              </Box>
              {selectedEvent.extendedProps.name && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Deal Name</Typography>
                  <Typography variant="body1" fontWeight="medium">{selectedEvent.extendedProps.name}</Typography>
                </Box>
              )}
              {selectedEvent.extendedProps.stage && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Stage</Typography>
                  <Chip 
                    label={selectedEvent.extendedProps.stage}
                    size="small"
                    color="primary"
                    sx={{ mt: 0.5 }}
                  />
                </Box>
              )}
              {selectedEvent.extendedProps.expectedRevenue && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Expected Revenue</Typography>
                  <Typography variant="body1" fontWeight="medium" color="success.main">
                    ${selectedEvent.extendedProps.expectedRevenue.toLocaleString()}
                  </Typography>
                </Box>
              )}
              {selectedEvent.extendedProps.description && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                  <Typography variant="body1">{selectedEvent.extendedProps.description}</Typography>
                </Box>
              )}
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Close Date</Typography>
                <Typography variant="body1">
                  {selectedEvent.start ? new Date(selectedEvent.start).toLocaleString() : 'N/A'}
                </Typography>
              </Box>
            </>
          )}

          {/* Activity Information */}
          {selectedEvent.extendedProps?.entityType === 'activity' && (
            <>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Activity Type</Typography>
                <Chip 
                  label={activityTypes[selectedEvent.extendedProps?.type]?.label || selectedEvent.extendedProps?.type}
                  sx={{ 
                    backgroundColor: getActivityColor(selectedEvent.extendedProps?.type),
                    color: 'white',
                    mt: 0.5
                  }}
                />
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Priority</Typography>
                <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>{selectedEvent.extendedProps?.priority || 'normal'}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>{selectedEvent.extendedProps?.status || 'N/A'}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Start Time</Typography>
                <Typography variant="body1">
                  {selectedEvent.start ? new Date(selectedEvent.start).toLocaleString() : 'N/A'}
                </Typography>
              </Box>
              {selectedEvent.end && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">End Time</Typography>
                  <Typography variant="body1">
                    {new Date(selectedEvent.end).toLocaleString()}
                  </Typography>
                </Box>
              )}
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Assigned To</Typography>
                <Typography variant="body1">{selectedEvent.extendedProps?.assignedTo || 'N/A'}</Typography>
              </Box>
              {selectedEvent.extendedProps?.description && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                  <Typography variant="body1">{selectedEvent.extendedProps.description}</Typography>
                </Box>
              )}
              {selectedEvent.extendedProps?.relationType && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Related To</Typography>
                  <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                    {selectedEvent.extendedProps.relationType} (ID: {selectedEvent.extendedProps.relationId})
                  </Typography>
                </Box>
              )}
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          Close
        </Button>
        <Button 
          variant="contained"
          startIcon={<OpenIcon />}
          onClick={handleNavigateToEntity}
          sx={{ 
            backgroundColor: selectedEvent.extendedProps?.entityType === 'activity' 
              ? '#586a68' 
              : selectedEvent.extendedProps?.entityType === 'lead' 
                ? '#ba7351' 
                : '#CCC79F',
            color: selectedEvent.extendedProps?.entityType === 'deal' ? '#262626' : 'white',
            '&:hover': {
              backgroundColor: selectedEvent.extendedProps?.entityType === 'activity' 
                ? '#4e605e' 
                : selectedEvent.extendedProps?.entityType === 'lead' 
                  ? '#a86446' 
                  : '#bfbc8f'
            }
          }}
        >
          Open {selectedEvent.extendedProps?.entityType === 'activity' 
            ? 'Activity' 
            : selectedEvent.extendedProps?.entityType === 'lead' 
              ? 'Lead' 
              : 'Deal'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
