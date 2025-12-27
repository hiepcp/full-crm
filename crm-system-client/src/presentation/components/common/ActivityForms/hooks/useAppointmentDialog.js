import { useState } from 'react';
import { LocalAuthRepository } from '@infrastructure/repositories/LocalAuthRepository';
import { EmailAuthRepository } from '@infrastructure/repositories/EmailAuthRepository';

/**
 * Custom hook to manage appointment dialog state and operations
 */
export const useAppointmentDialog = () => {
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [appointmentLoading, setAppointmentLoading] = useState(false);
  const [appointmentPage, setAppointmentPage] = useState(1);
  const [appointmentPageSize] = useState(50);
  const [hasMoreAppointments, setHasMoreAppointments] = useState(true);
  const [loadingMoreAppointments, setLoadingMoreAppointments] = useState(false);
  const [totalAppointments, setTotalAppointments] = useState(0);
  const [tokenExpired, setTokenExpired] = useState(false);

  const loadAppointmentsForActivityCreation = async (page = 1, append = false) => {
    if (append) {
      setLoadingMoreAppointments(true);
    } else {
      setAppointmentLoading(true);
      setAppointmentPage(1);
      setHasMoreAppointments(true);
    }

    try {
      const localRepo = new LocalAuthRepository();
      const emailRepo = new EmailAuthRepository(localRepo);

      // Get total appointment count from server
      let serverTotalCount = 0;
      try {
        const totalResponse = await emailRepo.getAppointments(appointmentPageSize, 1);
        serverTotalCount = totalResponse.totalCount || 0;
      } catch (countError) {
        console.warn('Failed to get total appointment count:', countError);
      }
      setTotalAppointments(serverTotalCount);

      // Get paginated appointments
      const appointmentResponse = await emailRepo.getAppointments(appointmentPageSize, page);
      const appointmentData = appointmentResponse.appointments || [];

      // Filter appointments suitable for activity creation
      let filteredAppointments = appointmentData.filter(appointment => {
        const startDate = new Date(appointment.start.dateTime);
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
        return startDate >= thirtyDaysAgo && startDate <= ninetyDaysFromNow;
      });

      // Sort by start date (most recent first)
      filteredAppointments.sort((a, b) => new Date(b.start.dateTime) - new Date(a.start.dateTime));

      if (append) {
        setAppointments(prev => [...prev, ...filteredAppointments]);
        setAppointmentPage(page);
      } else {
        setAppointments(filteredAppointments);
        setAppointmentPage(1);
      }

      const hasMore = filteredAppointments.length === appointmentPageSize;
      setHasMoreAppointments(hasMore);

    } catch (error) {
      console.error('Error loading appointments:', error);

      if (error.message === 'TOKEN_EXPIRED' || error.message.includes('InvalidAuthenticationToken')) {
        setTokenExpired(true);
        setAppointments([]);
      } else {
        setTokenExpired(false);
      }
    } finally {
      setAppointmentLoading(false);
      setLoadingMoreAppointments(false);
    }
  };

  const loadMoreAppointments = async () => {
    if (!loadingMoreAppointments && hasMoreAppointments) {
      const nextPage = appointmentPage + 1;
      await loadAppointmentsForActivityCreation(nextPage, true);
    }
  };

  const handleOpenAppointmentDialog = (isConnected) => {
    setAppointmentDialogOpen(true);
    setTokenExpired(false);
    if (isConnected) {
      loadAppointmentsForActivityCreation();
    } else {
      setAppointments([]);
    }
  };

  const handleCloseAppointmentDialog = () => {
    setAppointmentDialogOpen(false);
    setSelectedAppointment(null);
  };

  const handleAppointmentSelect = (appointment) => {
    setSelectedAppointment(appointment);
  };

  const handleConfirmAppointmentSelection = (onAppointmentData) => {
    if (selectedAppointment) {
      const subject = selectedAppointment.subject || '';
      const startDateTime = new Date(selectedAppointment.start.dateTime);
      const endDateTime = new Date(selectedAppointment.end.dateTime);
      const duration = Math.round((endDateTime - startDateTime) / (1000 * 60));
      const location = selectedAppointment.location?.displayName || '';
      const description = selectedAppointment.body?.content || '';

      if (onAppointmentData) {
        onAppointmentData({
          subject,
          startDateTime,
          endDateTime,
          duration,
          location,
          description,
          appointment: selectedAppointment
        });
      }

      handleCloseAppointmentDialog();

      return {
        success: true,
        subject,
        startDateTime,
        endDateTime,
        duration,
        location,
        description
      };
    }
    return { success: false };
  };

  const resetAppointmentDialog = () => {
    setSelectedAppointment(null);
  };

  return {
    // State
    appointmentDialogOpen,
    appointments,
    selectedAppointment,
    appointmentLoading,
    appointmentPage,
    hasMoreAppointments,
    loadingMoreAppointments,
    totalAppointments,
    tokenExpired,
    
    // State setters (for direct manipulation when needed)
    setAppointmentDialogOpen,
    setAppointments,
    setSelectedAppointment,
    setAppointmentLoading,
    setAppointmentPage,
    setHasMoreAppointments,
    setLoadingMoreAppointments,
    setTotalAppointments,
    setTokenExpired,
    
    // Actions
    loadAppointmentsForActivityCreation,
    loadMoreAppointments,
    handleOpenAppointmentDialog,
    handleCloseAppointmentDialog,
    handleAppointmentSelect,
    handleConfirmAppointmentSelection,
    resetAppointmentDialog,
  };
};

