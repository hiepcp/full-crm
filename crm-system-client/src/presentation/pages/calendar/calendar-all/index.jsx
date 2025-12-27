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
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  CalendarMonth as CalendarIcon
} from '@mui/icons-material';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { mockCalendarActivities, getNextActivityId, activityTypes } from '../../../../utils/constants_calendar';
import ActivityFormDialog from './ActivityFormDialog';

const CalendarAllPage = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const calendarRef = useRef(null);

  useEffect(() => {
    // Initialize events from mock data
    setEvents(mockCalendarActivities);
  }, []);

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
  const handleEventDrop = (dropInfo) => {
    const updatedEvent = {
      id: dropInfo.event.id,
      title: dropInfo.event.title,
      start: dropInfo.event.start,
      end: dropInfo.event.end,
      backgroundColor: dropInfo.event.backgroundColor,
      borderColor: dropInfo.event.borderColor,
      extendedProps: dropInfo.event.extendedProps
    };

    setEvents(prevEvents =>
      prevEvents.map(evt => (evt.id === updatedEvent.id ? updatedEvent : evt))
    );

    showSnackbar('Activity rescheduled successfully', 'success');
  };

  // Handle event resize
  const handleEventResize = (resizeInfo) => {
    const updatedEvent = {
      id: resizeInfo.event.id,
      title: resizeInfo.event.title,
      start: resizeInfo.event.start,
      end: resizeInfo.event.end,
      backgroundColor: resizeInfo.event.backgroundColor,
      borderColor: resizeInfo.event.borderColor,
      extendedProps: resizeInfo.event.extendedProps
    };

    setEvents(prevEvents =>
      prevEvents.map(evt => (evt.id === updatedEvent.id ? updatedEvent : evt))
    );

    showSnackbar('Activity duration updated', 'success');
  };

  // Save activity (create or update)
  const handleSaveActivity = (activityData) => {
    if (activityData.id) {
      // Update existing
      setEvents(prevEvents =>
        prevEvents.map(evt => (evt.id === activityData.id ? activityData : evt))
      );
      showSnackbar('Activity updated successfully', 'success');
    } else {
      // Create new
      const newActivity = {
        ...activityData,
        id: getNextActivityId()
      };
      setEvents(prevEvents => [...prevEvents, newActivity]);
      showSnackbar('Activity created successfully', 'success');
    }
  };

  // Delete activity
  const handleDeleteActivity = () => {
    if (selectedEvent && window.confirm('Are you sure you want to delete this activity?')) {
      setEvents(prevEvents => prevEvents.filter(evt => evt.id !== selectedEvent.id));
      setDialogOpen(false);
      setSelectedEvent(null);
      showSnackbar('Activity deleted successfully', 'info');
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
              Calendar & Activities
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage your meetings, calls, tasks and events
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setSelectedEvent(null);
              setSelectedDate(new Date());
              setDialogOpen(true);
            }}
            sx={{ height: 'fit-content' }}
          >
            New Activity
          </Button>
        </Box>

        {/* Activity Type Legend */}
        <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {Object.entries(activityTypes).map(([key, value]) => (
            <Chip
              key={key}
              label={value.label}
              size="small"
              sx={{
                backgroundColor: value.color,
                color: 'white',
                fontWeight: 'medium'
              }}
            />
          ))}
        </Box>

        {/* Calendar */}
        <Box sx={{ 
          '& .fc': { 
            height: 'calc(100vh - 350px)',
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

export default CalendarAllPage;


