import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  IconButton,
  Chip,
  Stack,
  Tooltip,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  CalendarMonth as CalendarIcon
} from '@mui/icons-material';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { activityTypes } from '../../../../utils/constants_calendar';
import ActivityFormDialog from '../calendar-all/ActivityFormDialog';
import activitiesApi from '../../../../infrastructure/api/activitiesApi';
import { tokenHelper } from '../../../../utils/tokenHelper';
import { create } from 'lodash';

const CalendarMyPage = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const calendarRef = useRef(null);

  // Get current user email from token
  const currentUser = tokenHelper.getEmailFromToken();

  // Fetch activities from API
  useEffect(() => {
    fetchUserActivities();
  }, []);

  const fetchUserActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch activities assigned to current user
      const response = await activitiesApi.getByUser(currentUser, {
        pageSize: 1000, // Get all activities for calendar view
        sortColumn: 'startAt',
        sortOrder: 'asc'
      });

      // Transform API response to FullCalendar format
      const transformedEvents = response.data.data.items.map(activity => ({
        id: activity.id.toString(),
        title: activity.subject || `${activity.activityType} Activity`,
        start: activity.startAt || activity.dueAt || activity.createdOnActivity,
        end: activity.endAt || activity.startAt,
        backgroundColor: getActivityColor(activity.activityType),
        borderColor: getActivityColor(activity.activityType),
        extendedProps: {
          description: activity.body,
          type: activity.activityType,
          priority: activity.priority,
          assignedTo: activity.assignedTo,
          relationType: activity.relationType,
          relationId: activity.relationId,
          status: activity.status,
          activityData: activity // Store full activity data for updates
        }
      }));

      setEvents(transformedEvents);
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError('Failed to load activities. Please try again.');
      showSnackbar('Failed to load activities', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Get color based on activity type
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

  // Handle date/time slot click - create new event
  const handleDateSelect = (selectInfo) => {
    setSelectedDate(selectInfo.start);
    setSelectedEvent(null);
    setDialogOpen(true);
  };

  // Handle event click - edit existing event
  const handleEventClick = (clickInfo) => {
    const event = clickInfo.event;
    setSelectedEvent({
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end,
      backgroundColor: event.backgroundColor,
      borderColor: event.borderColor,
      extendedProps: event.extendedProps
    });
    setSelectedDate(null);
    setDialogOpen(true);
  };

  // Handle event drop (drag and drop)
  const handleEventDrop = async (dropInfo) => {
    const updatedEvent = {
      id: dropInfo.event.id,
      title: dropInfo.event.title,
      start: dropInfo.event.start,
      end: dropInfo.event.end,
      backgroundColor: dropInfo.event.backgroundColor,
      borderColor: dropInfo.event.borderColor,
      extendedProps: dropInfo.event.extendedProps
    };

    try {
      // Update in backend
      await activitiesApi.update(parseInt(updatedEvent.id), {
        subject: updatedEvent.title,
        startAt: updatedEvent.start?.toISOString(),
        endAt: updatedEvent.end?.toISOString(),
        activityType: updatedEvent.extendedProps.type,
        priority: updatedEvent.extendedProps.priority,
        status: updatedEvent.extendedProps.status,
        body: updatedEvent.extendedProps.description
      });

      setEvents(prevEvents =>
        prevEvents.map(evt => (evt.id === updatedEvent.id ? updatedEvent : evt))
      );

      showSnackbar('Activity rescheduled successfully', 'success');
    } catch (err) {
      console.error('Error updating activity:', err);
      showSnackbar('Failed to reschedule activity', 'error');
      dropInfo.revert(); // Revert the drag if update failed
    }
  };

  // Handle event resize
  const handleEventResize = async (resizeInfo) => {
    const updatedEvent = {
      id: resizeInfo.event.id,
      title: resizeInfo.event.title,
      start: resizeInfo.event.start,
      end: resizeInfo.event.end,
      backgroundColor: resizeInfo.event.backgroundColor,
      borderColor: resizeInfo.event.borderColor,
      extendedProps: resizeInfo.event.extendedProps
    };

    try {
      // Update in backend
      await activitiesApi.update(parseInt(updatedEvent.id), {
        subject: updatedEvent.title,
        startAt: updatedEvent.start?.toISOString(),
        endAt: updatedEvent.end?.toISOString(),
        activityType: updatedEvent.extendedProps.type,
        priority: updatedEvent.extendedProps.priority,
        status: updatedEvent.extendedProps.status,
        body: updatedEvent.extendedProps.description
      });

      setEvents(prevEvents =>
        prevEvents.map(evt => (evt.id === updatedEvent.id ? updatedEvent : evt))
      );

      showSnackbar('Activity duration updated', 'success');
    } catch (err) {
      console.error('Error updating activity:', err);
      showSnackbar('Failed to update activity duration', 'error');
      resizeInfo.revert(); // Revert the resize if update failed
    }
  };

  // Save activity (create or update)
  const handleSaveActivity = async (activityData) => {
    try {
      // Ensure the activity is assigned to current user
      const activityPayload = {
        subject: activityData.title,
        body: activityData.extendedProps?.description || '',
        activityType: activityData.extendedProps?.type || 'meeting',
        priority: activityData.extendedProps?.priority || 'normal',
        status: activityData.extendedProps?.status || 'open',
        assignedTo: currentUser,
        startAt: activityData.start?.toISOString ? activityData.start.toISOString() : activityData.start,
        endAt: activityData.end?.toISOString ? activityData.end.toISOString() : activityData.end,
        relationType: activityData.extendedProps?.relationType,
        relationId: activityData.extendedProps?.relationId,
        createdBy: currentUser,
      };

      if (activityData.id) {
        // Update existing
        await activitiesApi.update(parseInt(activityData.id), activityPayload);
        setEvents(prevEvents =>
          prevEvents.map(evt => (evt.id === activityData.id ? activityData : evt))
        );
        showSnackbar('Activity updated successfully', 'success');
      } else {
        // Create new
        const response = await activitiesApi.create(activityPayload);
        const newId = response.data.data; // The API returns the new ID
        
        const newActivity = {
          ...activityData,
          id: newId.toString()
        };
        setEvents(prevEvents => [...prevEvents, newActivity]);
        showSnackbar('Activity created successfully', 'success');
      }
      
      // Refresh activities to get latest data
      await fetchUserActivities();
    } catch (err) {
      console.error('Error saving activity:', err);
      showSnackbar('Failed to save activity', 'error');
    }
  };

  // Delete activity
  const handleDeleteActivity = async () => {
    if (selectedEvent && window.confirm('Are you sure you want to delete this activity?')) {
      try {
        await activitiesApi.delete(parseInt(selectedEvent.id));
        setEvents(prevEvents => prevEvents.filter(evt => evt.id !== selectedEvent.id));
        setDialogOpen(false);
        setSelectedEvent(null);
        showSnackbar('Activity deleted successfully', 'info');
      } catch (err) {
        console.error('Error deleting activity:', err);
        showSnackbar('Failed to delete activity', 'error');
      }
    }
  };

  // Show snackbar notification
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // Handle close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Render event content
  const renderEventContent = (eventInfo) => {
    const { event } = eventInfo;
    return (
      <Box sx={{ p: 0.5, overflow: 'hidden' }}>
        <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block' }}>
          {eventInfo.timeText}
        </Typography>
        <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
          {event.title}
        </Typography>
        {event.extendedProps?.priority === 'high' && (
          <Chip
            label="High"
            size="small"
            sx={{ 
              height: 16, 
              fontSize: '0.7rem', 
              mt: 0.5,
              backgroundColor: '#CCC79F',
              color: '#fff'
            }}
          />
        )}
      </Box>
    );
  };

  return (
    <Card>
      <CardContent>
        {/* Page Header */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
              <CalendarIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              My Calendar
            </Typography>
           
          </Box>
        </Box>

        {/* Loading State */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
            <CircularProgress />
          </Box>
        ) : (
          <>

            {/* Statistics */}
            <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
              <Chip 
                label={`Total Activities: ${events.length}`}
                sx={{ backgroundColor: '#f0f0f0', color: '#262626' }}
              />
              <Chip 
                label={`Meetings: ${events.filter(e => e.extendedProps?.type === 'meeting').length}`}
                sx={{ backgroundColor: '#eef1f0', color: '#586a68', fontWeight: 'medium' }}
              />
              <Chip 
                label={`Calls: ${events.filter(e => e.extendedProps?.type === 'call').length}`}
                sx={{ backgroundColor: '#fbe9e3', color: '#ba7351', fontWeight: 'medium' }}
              />
              <Chip 
                label={`Emails: ${events.filter(e => e.extendedProps?.type === 'email').length}`}
                sx={{ backgroundColor: '#e6f3e7', color: '#4caf50', fontWeight: 'medium' }}
              />
            </Box>

            {/* Calendar */}
            <Box sx={{ 
              '& .fc': { 
                height: 'calc(100vh - 420px)',
                minHeight: '600px'
              },
              '& .fc-button': {
                textTransform: 'capitalize',
                padding: '6px 12px'
              },
              '& .fc-button-primary': {
                backgroundColor: '#586a68',
                borderColor: '#586a68',
                '&:hover': {
                  backgroundColor: '#4e605e',
                  borderColor: '#4e605e'
                },
                '&:not(:disabled):active, &:not(:disabled).fc-button-active': {
                  backgroundColor: '#434f4e',
                  borderColor: '#434f4e'
                }
              },
              '& .fc-toolbar-title': {
                fontSize: '1.5rem',
                fontWeight: 'bold'
              },
              '& .fc-event': {
                cursor: 'pointer',
                borderRadius: '4px'
              },
              '& .fc-daygrid-event': {
                padding: '2px 4px'
              }
            }}>
              <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                initialView="timeGridWeek"
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
                }}
                events={events}
                editable={true}
                selectable={true}
                selectMirror={true}
                dayMaxEvents={true}
                weekends={true}
                select={handleDateSelect}
                eventClick={handleEventClick}
                eventDrop={handleEventDrop}
                eventResize={handleEventResize}
                eventContent={renderEventContent}
                slotMinTime="06:00:00"
                slotMaxTime="22:00:00"
                allDaySlot={false}
                height="auto"
                buttonText={{
                  today: 'Today',
                  month: 'Month',
                  week: 'Week',
                  day: 'Day',
                  list: 'List'
                }}
              />
            </Box>
          </>
        )}
        {/* Activity Form Dialog */}
        <ActivityFormDialog
          open={dialogOpen}
          onClose={() => {
            setDialogOpen(false);
            setSelectedEvent(null);
            setSelectedDate(null);
          }}
          onSave={handleSaveActivity}
          activity={selectedEvent}
          selectedDate={selectedDate}
        />

        {/* Delete Button in Dialog */}
        {dialogOpen && selectedEvent && (
          <Box sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 1400 }}>
            <Tooltip title="Delete Activity">
              <IconButton
                color="error"
                onClick={handleDeleteActivity}
                sx={{
                  backgroundColor: '#C18C75',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: '#A66B54'
                  }
                }}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Box>
        )}

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </CardContent>
    </Card>
  );
};

export default CalendarMyPage;


