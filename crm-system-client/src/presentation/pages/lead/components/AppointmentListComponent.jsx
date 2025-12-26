import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  CircularProgress,
  Divider,
  Tooltip,
  IconButton,
  Button
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Visibility as VisibilityIcon,
  Cloud as CloudIcon
} from '@mui/icons-material';
import { formatDateTime } from '../../../../utils/formatDateTime';

const AppointmentListComponent = ({
  appointments,
  selectedAppointment,
  onAppointmentSelect,
  loading,
  loadingMore = false,
  hasMore = false,
  onLoadMore,
  onConnectEmail,
  tokenExpired = false,
  notConnected = false,
  error = null,
  totalCount = 0
}) => {
  const [previewAppointment, setPreviewAppointment] = useState(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const listRef = useRef(null);

  const handlePreviewClick = (appointment, event) => {
    event.stopPropagation(); // Prevent appointment selection
    setPreviewAppointment(appointment);
    setPreviewDialogOpen(true);
  };

  const handleClosePreview = () => {
    setPreviewDialogOpen(false);
    setPreviewAppointment(null);
  };

  // Handle scroll to load more appointments
  useEffect(() => {
    const handleScroll = () => {
      if (!listRef.current || loadingMore || !hasMore || !onLoadMore) return;

      const { scrollTop, scrollHeight, clientHeight } = listRef.current;
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 50; // Reduced threshold to 50px

      if (isNearBottom) {
        onLoadMore();
      }
    };

    const listElement = listRef.current;
    if (listElement) {
      listElement.addEventListener('scroll', handleScroll);
      return () => listElement.removeEventListener('scroll', handleScroll);
    }
  }, [loadingMore, hasMore, onLoadMore]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (appointments.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
        {notConnected ? (
          <>
            <CloudIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
            <Typography variant="body2" sx={{ mb: 2 }}>
              Connect your email account to create activities from calendar appointments
            </Typography>
            <Button
              variant="contained"
              startIcon={<CloudIcon />}
              onClick={onConnectEmail}
              size="small"
            >
              Connect Microsoft Email
            </Button>
          </>
        ) : tokenExpired ? (
          <>
            <CloudIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
            <Typography variant="body2" sx={{ mb: 2 }}>
              Your email connection has expired. Please reconnect to continue.
            </Typography>
            <Button
              variant="contained"
              startIcon={<CloudIcon />}
              onClick={onConnectEmail}
              size="small"
            >
              Connect Microsoft Email
            </Button>
          </>
        ) : (
          <>
            <ScheduleIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
            <Typography variant="body2">
              No appointments available for activity creation
            </Typography>
          </>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" sx={{ p: 2, pb: 1 }}>
        Total Appointments ({totalCount > 0 ? totalCount : appointments.length}) / Selected ({selectedAppointment ? 1 : 0})
      </Typography>
      <Divider />

      <List ref={listRef} sx={{ flex: 1, overflow: 'auto', p: 0 }}>
        {appointments.map((appointment) => {
          const isSelected = selectedAppointment?.id === appointment.id;
          const startDate = new Date(appointment.start.dateTime);
          const endDate = new Date(appointment.end.dateTime);
          const duration = Math.round((endDate - startDate) / (1000 * 60)); // duration in minutes

          return (
            <ListItem
              key={appointment.id}
              onClick={() => onAppointmentSelect(appointment)}
              sx={{
                cursor: 'pointer',
                bgcolor: isSelected ? 'action.selected' : 'transparent',
                '&:hover': {
                  bgcolor: 'action.hover'
                },
                borderLeft: isSelected ? 4 : 0,
                borderColor: 'primary.main',
                flexDirection: 'column',
                alignItems: 'stretch',
                py: 2
              }}
            >
              {/* Appointment Header */}
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 1 }}>
                <ListItemAvatar sx={{ minWidth: 40 }}>
                  <Avatar sx={{ width: 32, height: 32, bgcolor: isSelected ? 'primary.main' : 'grey.300' }}>
                    <ScheduleIcon fontSize="small" />
                  </Avatar>
                </ListItemAvatar>

                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: 8 }}>
                      <Typography variant="subtitle2" noWrap sx={{ flex: 1 }}>
                        {appointment.subject || 'No Subject'}
                      </Typography>
                      <Chip
                        label={`${duration}min`}
                        size="small"
                        sx={{
                          height: 16,
                          fontSize: '0.65rem',
                          bgcolor: 'info.main',
                          color: 'white'
                        }}
                      />
                    </Box>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      {formatDateTime(appointment.start.dateTime)}
                    </Typography>
                  }
                />

                {/* Preview Button */}
                <Box sx={{ ml: 'auto' }}>
                  <Tooltip title="Preview Appointment">
                    <IconButton
                      size="small"
                      onClick={(e) => handlePreviewClick(appointment, e)}
                      sx={{ color: 'action.active' }}
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              {/* Appointment Details */}
              <Box sx={{ pl: 5 }}>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  {appointment.subject || 'No Subject'}
                </Typography>

                {/* Location */}
                {appointment.location?.displayName && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                    <LocationIcon sx={{ fontSize: 14, color: 'action.disabled' }} />
                    <Typography variant="caption" color="text.secondary">
                      {appointment.location.displayName}
                    </Typography>
                  </Box>
                )}

                {/* Attendees */}
                {appointment.attendees && appointment.attendees.length > 0 && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                    <PersonIcon sx={{ fontSize: 14, color: 'action.disabled' }} />
                    <Typography variant="caption" color="text.secondary">
                      {appointment.attendees.length} attendee{appointment.attendees.length !== 1 ? 's' : ''}
                    </Typography>
                  </Box>
                )}

                {/* Description Preview */}
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    lineHeight: 1.4
                  }}
                >
                  {appointment.bodyPreview || appointment.body?.content?.substring(0, 150) || 'No description available'}
                </Typography>
              </Box>
            </ListItem>
          );
        })}

        {/* Loading more indicator */}
        {loadingMore && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}

        {/* Load more prompt */}
        {!loadingMore && hasMore && appointments.length > 0 && (
          <Box sx={{ textAlign: 'center', p: 2, color: 'text.secondary' }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Scroll down to load more appointments
            </Typography>
            {/* Debug button - remove in production */}
            <Button
              size="small"
              variant="outlined"
              onClick={() => onLoadMore && onLoadMore()}
              sx={{ fontSize: '0.7rem' }}
            >
              Load More (Debug)
            </Button>
          </Box>
        )}
      </List>

      {/* Appointment Preview Dialog - placeholder for now */}
      {previewDialogOpen && previewAppointment && (
        <Box sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          bgcolor: 'rgba(0,0,0,0.5)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2
        }}>
          <Box sx={{
            bgcolor: 'background.paper',
            borderRadius: 2,
            p: 3,
            maxWidth: 600,
            maxHeight: '80vh',
            overflow: 'auto',
            width: '100%'
          }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {previewAppointment.subject || 'Appointment Details'}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Start:</strong> {formatDateTime(previewAppointment.start.dateTime)}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>End:</strong> {formatDateTime(previewAppointment.end.dateTime)}
            </Typography>
            {previewAppointment.location?.displayName && (
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Location:</strong> {previewAppointment.location.displayName}
              </Typography>
            )}
            {previewAppointment.body?.content && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Description:</strong>
                </Typography>
                <Typography variant="body2" dangerouslySetInnerHTML={{ __html: previewAppointment.body.content }} />
              </Box>
            )}
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={handleClosePreview}>Close</Button>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default AppointmentListComponent;
