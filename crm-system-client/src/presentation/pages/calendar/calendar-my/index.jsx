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
  CalendarMonth as CalendarIcon
} from '@mui/icons-material';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { activityTypes } from '../../../../utils/constants_calendar';
import activitiesApi from '../../../../infrastructure/api/activitiesApi';
import leadsApi from '../../../../infrastructure/api/leadsApi';
import dealsApi from '../../../../infrastructure/api/dealsApi';
import usersApi from '@src/infrastructure/api/usersApi';
import { tokenHelper } from '../../../../utils/tokenHelper';
import ActivityDetailPopup from '../../../components/activity/ActivityDetailPopup';

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
    fetchCalendarData();
  }, []);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch only meeting activities assigned to current user
      const activitiesResponse = await activitiesApi.getByUser(currentUser, {
        pageSize: 1000,
        activityType: 'meeting',
        sortColumn: 'startAt',
        sortOrder: 'asc'
      });

      const currentUserId = await usersApi.getByEmail(currentUser);

      // Fetch leads with follow-up dates
      const leadsResponse = await leadsApi.getAll({ownerId: currentUserId.data?.data.id});
      
      // Fetch deals with close dates
      const dealsResponse = await dealsApi.getAll({ownerId: currentUserId.data?.data.id});

      // Transform activities (only meetings)
      const activityEvents = activitiesResponse.data.data.items
        .filter(activity => activity.activityType === 'meeting')
        .map(activity => ({
          id: `activity-${activity.id}`,
          title: activity.subject || 'Meeting',
          start: activity.startAt || activity.dueAt || activity.createdOnActivity,
          end: activity.endAt || activity.startAt,
          backgroundColor: '#586a68', // Primary color for meetings
          borderColor: '#586a68',
          extendedProps: {
            entityType: 'activity',
            entityId: activity.id,
            description: activity.body,
            type: 'meeting',
            priority: activity.priority,
            assignedTo: activity.assignedTo,
            relationType: activity.relationType,
            relationId: activity.relationId,
            status: activity.status
          }
        }));

      // Transform leads with followUpDate
      const leadEvents = leadsResponse.data.data.items
        .filter(lead => lead.followUpDate)
        .map(lead => {
          const followUpDate = new Date(lead.followUpDate);
          followUpDate.setHours(8, 0, 0, 0); // Set to 8:00 AM
          
          return {
            id: `lead-${lead.id}`,
            title: `📋 ${lead.company || lead.fullName || 'Lead'}`,
            start: followUpDate.toISOString(),
            allDay: false,
            backgroundColor: '#ba7351', // Secondary color for leads
            borderColor: '#ba7351',
            extendedProps: {
              entityType: 'lead',
              entityId: lead.id,
              company: lead.company,
              fullName: lead.fullName,
              email: lead.email,
              status: lead.status,
              source: lead.source,
              followUpDate: lead.followUpDate
            }
          };
        });

      // Transform deals with closeDate
      const dealEvents = dealsResponse.data.data.items
        .filter(deal => deal.closeDate)
        .map(deal => {
          const closeDate = new Date(deal.closeDate);
          closeDate.setHours(8, 0, 0, 0); // Set to 8:00 AM
          
          return {
            id: `deal-${deal.id}`,
            title: `💼 ${deal.name || 'Deal'}`,
            start: closeDate.toISOString(),
            allDay: false,
            backgroundColor: '#CCC79F', // Warning color for deals
            borderColor: '#CCC79F',
            extendedProps: {
              entityType: 'deal',
              entityId: deal.id,
              name: deal.name,
              stage: deal.stage,
              expectedRevenue: deal.expectedRevenue,
              closeDate: deal.closeDate,
              description: deal.description
            }
          };
        });

      // Combine all events
      setEvents([...activityEvents, ...leadEvents, ...dealEvents]);
    } catch (err) {
      console.error('Error fetching calendar data:', err);
      setError('Failed to load calendar data. Please try again.');
      showSnackbar('Failed to load calendar data', 'error');
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

  // Handle event click - show dialog for all types
  const handleEventClick = (clickInfo) => {
    const event = clickInfo.event;
    
    // Show dialog for all entity types
    setSelectedEvent({
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end,
      backgroundColor: event.backgroundColor,
      borderColor: event.borderColor,
      extendedProps: event.extendedProps
    });
    setDialogOpen(true);
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
            <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Chip 
                label={`Total: ${events.length}`}
                sx={{ backgroundColor: '#f0f0f0', color: '#262626' }}
              />
              <Chip 
                label={`Meetings: ${events.filter(e => e.extendedProps?.entityType === 'activity').length}`}
                sx={{ backgroundColor: '#586a68', color: 'white', fontWeight: 'medium' }}
              />
              <Chip 
                label={`📋 Leads: ${events.filter(e => e.extendedProps?.entityType === 'lead').length}`}
                sx={{ backgroundColor: '#ba7351', color: 'white', fontWeight: 'medium' }}
              />
              <Chip 
                label={`💼 Deals: ${events.filter(e => e.extendedProps?.entityType === 'deal').length}`}
                sx={{ backgroundColor: '#CCC79F', color: '#262626', fontWeight: 'medium' }}
              />
            </Box>

            {/* Calendar */}
            <Box sx={{ 
              '& .fc': { 
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
                editable={false}
                selectable={false}
                selectMirror={true}
                dayMaxEvents={true}
                weekends={true}
                eventClick={handleEventClick}
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
        {/* Activity Detail Popup */}
        <ActivityDetailPopup
          open={dialogOpen}
          onClose={() => {
            setDialogOpen(false);
            setSelectedEvent(null);
          }}
          selectedEvent={selectedEvent}
        />

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


