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
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  CalendarMonth as CalendarIcon,
  Close as CloseIcon,
  OpenInNew as OpenIcon
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
import { useNavigate } from 'react-router-dom';

const CalendarMyPage = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const calendarRef = useRef(null);
  const navigate = useNavigate();

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

  // Handle navigate to entity detail page
  const handleNavigateToEntity = () => {
    const entityType = selectedEvent?.extendedProps?.entityType;
    const entityId = selectedEvent?.extendedProps?.entityId;

    if (entityType === 'lead') {
      navigate(`/leads/${entityId}`);
    } else if (entityType === 'deal') {
      navigate(`/deals/${entityId}`);
    }
    
    setDialogOpen(false);
    setSelectedEvent(null);
  };



  // // Handle event resize
  // const handleEventResize = async (resizeInfo) => {
  //   const updatedEvent = {
  //     id: resizeInfo.event.id,
  //     title: resizeInfo.event.title,
  //     start: resizeInfo.event.start,
  //     end: resizeInfo.event.end,
  //     backgroundColor: resizeInfo.event.backgroundColor,
  //     borderColor: resizeInfo.event.borderColor,
  //     extendedProps: resizeInfo.event.extendedProps
  //   };

  //   try {
  //     // Update in backend
  //     await activitiesApi.update(parseInt(updatedEvent.id), {
  //       subject: updatedEvent.title,
  //       startAt: updatedEvent.start?.toISOString(),
  //       endAt: updatedEvent.end?.toISOString(),
  //       activityType: updatedEvent.extendedProps.type,
  //       priority: updatedEvent.extendedProps.priority,
  //       status: updatedEvent.extendedProps.status,
  //       body: updatedEvent.extendedProps.description
  //     });

  //     setEvents(prevEvents =>
  //       prevEvents.map(evt => (evt.id === updatedEvent.id ? updatedEvent : evt))
  //     );

  //     showSnackbar('Activity duration updated', 'success');
  //   } catch (err) {
  //     console.error('Error updating activity:', err);
  //     showSnackbar('Failed to update activity duration', 'error');
  //     resizeInfo.revert(); // Revert the resize if update failed
  //   }
  // };

  // // Save activity (create or update)
  // const handleSaveActivity = async (activityData) => {
  //   try {
  //     // Ensure the activity is assigned to current user
  //     const activityPayload = {
  //       subject: activityData.title,
  //       body: activityData.extendedProps?.description || '',
  //       activityType: activityData.extendedProps?.type || 'meeting',
  //       priority: activityData.extendedProps?.priority || 'normal',
  //       status: activityData.extendedProps?.status || 'open',
  //       assignedTo: currentUser,
  //       startAt: activityData.start?.toISOString ? activityData.start.toISOString() : activityData.start,
  //       endAt: activityData.end?.toISOString ? activityData.end.toISOString() : activityData.end,
  //       relationType: activityData.extendedProps?.relationType,
  //       relationId: activityData.extendedProps?.relationId,
  //       createdBy: currentUser,
  //     };

  //     if (activityData.id) {
  //       // Update existing
  //       await activitiesApi.update(parseInt(activityData.id), activityPayload);
  //       setEvents(prevEvents =>
  //         prevEvents.map(evt => (evt.id === activityData.id ? activityData : evt))
  //       );
  //       showSnackbar('Activity updated successfully', 'success');
  //     } else {
  //       // Create new
  //       const response = await activitiesApi.create(activityPayload);
  //       const newId = response.data.data; // The API returns the new ID
        
  //       const newActivity = {
  //         ...activityData,
  //         id: newId.toString()
  //       };
  //       setEvents(prevEvents => [...prevEvents, newActivity]);
  //       showSnackbar('Activity created successfully', 'success');
  //     }
      
  //     // Refresh activities to get latest data
  //     await fetchUserActivities();
  //   } catch (err) {
  //     console.error('Error saving activity:', err);
  //     showSnackbar('Failed to save activity', 'error');
  //   }
  // };



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
        {/* Activity View Dialog */}
        {dialogOpen && selectedEvent && (
          <Dialog
            open={dialogOpen}
            onClose={() => {
              setDialogOpen(false);
              setSelectedEvent(null);
            }}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h5">{selectedEvent.title}</Typography>
              <IconButton onClick={() => {
                setDialogOpen(false);
                setSelectedEvent(null);
              }}>
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
              <Button 
                onClick={() => {
                  setDialogOpen(false);
                  setSelectedEvent(null);
                }}
              >
                Close
              </Button>
              {(selectedEvent.extendedProps?.entityType === 'lead' || 
                selectedEvent.extendedProps?.entityType === 'deal') && (
                <Button 
                  variant="contained"
                  startIcon={<OpenIcon />}
                  onClick={handleNavigateToEntity}
                  sx={{ 
                    backgroundColor: selectedEvent.extendedProps?.entityType === 'lead' ? '#ba7351' : '#CCC79F',
                    color: selectedEvent.extendedProps?.entityType === 'lead' ? 'white' : '#262626',
                    '&:hover': {
                      backgroundColor: selectedEvent.extendedProps?.entityType === 'lead' ? '#a86446' : '#bfbc8f'
                    }
                  }}
                >
                  Open {selectedEvent.extendedProps?.entityType === 'lead' ? 'Lead' : 'Deal'}
                </Button>
              )}
            </DialogActions>
          </Dialog>
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


