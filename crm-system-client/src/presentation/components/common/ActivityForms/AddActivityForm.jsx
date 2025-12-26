import React, { useState, forwardRef, useImperativeHandle, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import {
  Box,
  Grid,
  Select,
  FormControl,
  InputLabel,
  MenuItem,
  Button,
  Typography,
  Stack,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Email as EmailIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';

// Data functions
import { 
  getContacts, 
  getUsers, 
  getAssignees, 
  createActivity, 
  updateActivity, 
  checkEmailsByConversation, 
  getActivitiesByRelation,
  createEmail, 
  findEmailByConversationAndActivity, 
  findEmailByMailId,
  createAppointment,
  updateAppointment,
  findAppointmentByMailId
} from '@presentation/data';
import { ACTIVITY_TYPES } from '../../../../utils/constants';

// Email components and context
import EmailListComponent from '../../../pages/lead/components/EmailListComponent';
import AppointmentListComponent from '../../../pages/lead/components/AppointmentListComponent';
import { useEmailConnection } from '@app/contexts/EmailConnectionContext';

// Custom hooks
import { useEmailDialog } from './hooks/useEmailDialog';
import { useAppointmentDialog } from './hooks/useAppointmentDialog';
import { useActivityForm } from './hooks/useActivityForm';

// Components
import ActivityCategoryFields from './components/ActivityCategoryFields';
import DescriptionEditor from './components/DescriptionEditor';
import FileUploadSection from './components/FileUploadSection';

// Utils
import { mapEmailToCreateEmailRequest } from './utils/emailHelpers';
import { mapAppointmentToCreateAppointmentRequest } from './utils/appointmentEmailHelpers';
import { constructActivityData } from './utils/activityHelpers';

const AddActivityForm = forwardRef((
  {
    onCancel,
    onSubmit,
    relationType = 'deal',
    relationId,
    dealName,
    defaultAssignee,
    initialData,
    showActions = true,
    onEmailData,
  },
  ref
) => {
  const theme = useTheme();
  const { isConnected, connect } = useEmailConnection();
  const isEditMode = Boolean(initialData?.id);

  // Data loading states
  const [contacts, setContacts] = useState([]);
  const [users, setUsers] = useState([]);
  const [assignees, setAssignees] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmedAppointment, setConfirmedAppointment] = useState(null);
  const [downloadingAttachments, setDownloadingAttachments] = useState(false);

  // Custom hooks
  const emailDialog = useEmailDialog();
  const appointmentDialog = useAppointmentDialog();
  const activityForm = useActivityForm(initialData, defaultAssignee, contacts, users);

  // Load contacts, users, and assignees data
  const loadDataIfNeeded = async () => {
    if (dataLoading || (contacts.length > 0 && users.length > 0 && assignees.length > 0)) {
      return;
    }

    try {
      setDataLoading(true);
      const [contactsResponse, usersResponse, assigneesResponse] = await Promise.all([
        getContacts(),
        getUsers(),
        getAssignees()
      ]);
      setContacts(contactsResponse || []);
      setUsers(usersResponse || []);
      setAssignees(assigneesResponse || []);
    } catch (error) {
      console.error('Error loading data:', error);
      setContacts([]);
      setUsers([]);
      setAssignees([]);
    } finally {
      setDataLoading(false);
    }
  };

  // Email options for autocomplete
  const emailOptions = [
    ...contacts.map(c => ({ id: `contact-${c.id}`, email: c.email, name: `${c.firstName} ${c.lastName}`, type: 'contact' })),
    ...users.map(u => ({ id: `user-${u.id}`, email: u.email, name: `${u.firstName} ${u.lastName}`, type: 'user' })),
  ];

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    getActivityData() {
      return constructActivityData(
        activityForm.formData,
        activityForm.description,
        activityForm.uploadedFiles,
        relationType,
        relationId
      );
    },
    validate() {
      return activityForm.validate();
    }
  }));

  // Handle email connection
  const handleConnectEmail = async () => {
    emailDialog.setTokenExpired(false);
    emailDialog.setEmails([]);
    emailDialog.setEmailLoading(true);

    try {
      const result = await connect();
      if (result.success) {
        await emailDialog.loadMailFolders();
        await emailDialog.loadEmailsForActivityCreation();
      } else {
        emailDialog.setEmailLoading(false);
      }
    } catch (error) {
      console.error('Error connecting email:', error);
      emailDialog.setEmailLoading(false);
    }
  };

  // Handle email selection confirmation
  const handleConfirmEmail = async () => {
    setDownloadingAttachments(true);

    try {
      const result = await emailDialog.handleConfirmEmailSelection((emailData) => {
        // Update form with email data
        activityForm.updateFormData({
          activityCategory: 'email',
          subject: ` ${emailData.subject}`,
          emailFrom: emailData.sender?.address || emailData.sender?.emailAddress?.address || '',
          emailRecipient: emailData.recipients.map(r => r.emailAddress?.address || r.address || ''),
          conversationId: emailData.conversationId,
          person: [],
        });

        activityForm.setDescription(emailData.body);

        // Handle attachments from email
        if (emailData.attachments && emailData.attachments.length > 0) {
          const successfulAttachments = emailData.attachments.filter(att => att.success && att.file);

          if (successfulAttachments.length > 0) {
            console.log(`Adding ${successfulAttachments.length} downloaded attachments to activity form`);

            // Merge downloaded attachments with existing uploaded files
            const newFiles = successfulAttachments.map(att => att.file);
            const currentFiles = activityForm.uploadedFiles || [];
            activityForm.setUploadedFiles([...currentFiles, ...newFiles]);
          }

          // Log failed attachments for debugging
          const failedAttachments = emailData.attachments.filter(att => !att.success);
          if (failedAttachments.length > 0) {
            console.warn(`Failed to download ${failedAttachments.length} attachments:`,
              failedAttachments.map(att => `${att.originalAttachment.name}: ${att.error}`));
          }
        }

        // Call parent callback if provided
        if (onEmailData) {
          onEmailData(emailData);
        }
      });
    } finally {
      setDownloadingAttachments(false);
    }
  };

  // Handle appointment selection confirmation
  const handleConfirmAppointment = () => {
    appointmentDialog.handleConfirmAppointmentSelection((appointmentData) => {
      console.log('appointmentData', JSON.stringify(appointmentData));
      const conversationId =
        appointmentData?.appointment?.conversationId ||
        appointmentData?.appointment?.id ||
        '';

      // Update form with appointment data
      activityForm.updateFormData({
        activityCategory: 'meeting-offline',
        subject: appointmentData.subject,
        appointmentDate: appointmentData.startDateTime.toISOString().split('T')[0],
        appointmentTime: appointmentData.startDateTime.toTimeString().split(' ')[0].substring(0, 5),
        appointmentEndDate: appointmentData.endDateTime.toISOString().split('T')[0],
        appointmentEndTime: appointmentData.endDateTime.toTimeString().split(' ')[0].substring(0, 5),
        appointmentDuration: appointmentData.duration.toString(),
        appointmentLocation: appointmentData.location,
        conversationId,
        person: [],
      });

      // Preserve selected appointment for logging to crm_email
      setConfirmedAppointment(appointmentData);

      activityForm.setDescription(appointmentData.description);
    });
  };

  // Handle save activity
  const handleSave = async () => {
    if (saving) return;

    const activityData = constructActivityData(
      activityForm.formData,
      activityForm.description,
      activityForm.uploadedFiles,
      relationType,
      relationId
    );

    try {
      setSaving(true);
      const participants = activityForm.formData.person || [];
      const emailRecipients = activityForm.formData.emailRecipient || [];

      let savedActivity;
      let isEmailUpdate = false;

    if (isEditMode) {
      savedActivity = await updateActivity(initialData.id, activityData, participants, emailRecipients);
    } else if (activityForm.formData.activityCategory === 'email' && activityForm.formData.conversationId) {
      const emailCheck = await checkEmailsByConversation(activityForm.formData.conversationId);
      const { emails, hasEmails, emailCount } = emailCheck;

      console.log(`Conversation ${activityForm.formData.conversationId} has ${emailCount} emails from mail server`);

      // Find if there's already an activity linked to any of these emails
      let existingActivity = null;
      if (hasEmails && relationType && relationId) {
        const activities = await getActivitiesByRelation(relationType, relationId);
        existingActivity = activities.find(activity =>
          activity.conversationId === activityForm.formData.conversationId
        );
      }

      if (existingActivity) {
        // Update existing activity
        savedActivity = await updateActivity(existingActivity.id, activityData, participants, emailRecipients);
        isEmailUpdate = true;

        // Update or create email record in crm_email table
        if (emailDialog.confirmedEmail) {
          try {
            const existingEmail = await findEmailByConversationAndActivity(
              activityForm.formData.conversationId,
              existingActivity.id
            );

            const emailData = mapEmailToCreateEmailRequest(emailDialog.confirmedEmail, existingActivity.id);

            if (emailData && (!existingEmail || !existingEmail.id)) {
              await createEmail(emailData);
            }
          } catch (emailError) {
            console.error("Error saving email to crm_email table:", emailError);
          }
        }
      } else {
        // Create new activity
        savedActivity = await createActivity(activityData, participants, emailRecipients, activityForm.uploadedFiles);

        // Create email records for all emails in the conversation
        if (hasEmails && savedActivity?.id) {
          const sortedEmails = [...emails].sort((a, b) =>
            new Date(a.receivedDateTime || a.createdDateTime || 0) - new Date(b.receivedDateTime || b.createdDateTime || 0)
          );

          for (const email of sortedEmails) {
            try {
              const existingEmail = await findEmailByMailId(email.id);

              if (!existingEmail) {
                const emailData = mapEmailToCreateEmailRequest(email, savedActivity.id);
                if (emailData) {
                  await createEmail(emailData);
                  console.log(`Created email record for email ${email.id} in activity ${savedActivity.id}`);
                }
              } else {
                console.log(`Email ${email.id} already exists, skipping`);
              }
            } catch (emailError) {
              console.error("Error saving email to crm_email table:", emailError);
            }
          }
        }

        // Fallback: ensure the selected/confirmed email is saved even when no emails were returned
        if (activityForm.formData.activityCategory === 'email' && savedActivity?.id && emailDialog.confirmedEmail) {
          try {
            const emailData = mapEmailToCreateEmailRequest(emailDialog.confirmedEmail, savedActivity.id);

            if (emailData) {
              const existingEmailByMailId = emailData.mailId ? await findEmailByMailId(emailData.mailId) : null;

              if (!existingEmailByMailId) {
                await createEmail(emailData);
                console.log(`Created fallback email record for mailId ${emailData.mailId} in activity ${savedActivity.id}`);
              }
            }
          } catch (emailError) {
            console.error("Error saving fallback email to crm_email table:", emailError);
          }
        }
      }

      if (hasEmails) {
        console.log("Email details from server:", emails.map(email => ({
          id: email.id,
          subject: email.subject,
          from: email.fromAddress,
          receivedDate: email.receivedDateTime
        })));
      }
    } else {
      // Not an email activity or missing required fields
      savedActivity = await createActivity(activityData, participants, emailRecipients, activityForm.uploadedFiles);

      // Create or link appointment record
      if (
        !isEditMode &&
        (activityForm.formData.activityCategory === 'meeting-online' || activityForm.formData.activityCategory === 'meeting-offline') &&
        confirmedAppointment &&
        savedActivity?.id
      ) {
        try {
          const appointmentPayload = mapAppointmentToCreateAppointmentRequest(confirmedAppointment, savedActivity.id);

          if (appointmentPayload) {
            const existingAppointment = appointmentPayload.mailId
              ? await findAppointmentByMailId(appointmentPayload.mailId)
              : null;

            if (existingAppointment && savedActivity?.id && existingAppointment.activityId !== savedActivity.id) {
              await updateAppointment(existingAppointment.id, { ...appointmentPayload, activityId: savedActivity.id });
            } else if (!existingAppointment) {
              await createAppointment(appointmentPayload);
            }
          }
        } catch (appointmentError) {
          console.error("Error saving appointment to crm_appointment table:", appointmentError);
        }
      }

      // If it's an email activity but missing conversationId, still try to save email
      if (activityForm.formData.activityCategory === 'email' && emailDialog.confirmedEmail && savedActivity?.id) {
        try {
          const emailData = mapEmailToCreateEmailRequest(emailDialog.confirmedEmail, savedActivity.id);
          await createEmail(emailData);
        } catch (emailError) {
          console.error("Error saving email to crm_email table:", emailError);
        }
      }
    }

      // Call onSubmit with additional context for email updates
    if (isEditMode) {
      onSubmit(savedActivity, { isUpdate: true });
    } else if (isEmailUpdate) {
        onSubmit(savedActivity, { isEmailUpdate: true });
      } else {
        onSubmit(savedActivity);
      }

      // Reset form after successful save
      activityForm.resetForm();
      emailDialog.resetEmailDialog();
      appointmentDialog.resetAppointmentDialog();
      setConfirmedAppointment(null);
    } catch (error) {
      console.error("Failed to save activity:", error);
      onSubmit(activityData, { error: true, isUpdate: isEditMode });
    } finally {
      setSaving(false);
    }
  };

  // Handle category change
  const handleCategoryChange = (e) => {
    const newCategory = e.target.value;
    const updates = { activityCategory: newCategory };

    // Reset category-specific fields when switching category
    updates.subject = '';
    updates.person = [];
    updates.conversationId = '';

    // Reset email-specific fields
    updates.emailRecipient = [];
    updates.emailFrom = '';

    // Reset appointment-specific fields
    updates.appointmentDate = '';
    updates.appointmentTime = '';
    updates.appointmentEndDate = '';
    updates.appointmentEndTime = '';
    updates.appointmentDuration = '';
    updates.appointmentLocation = '';
    updates.appointmentPlatform = '';

    // Reset location/platform when switching away from appointment types
    if (newCategory !== 'meeting-online' && newCategory !== 'meeting-offline') {
      updates.appointmentLocation = '';
      updates.appointmentPlatform = '';
    }

    // Reset location when switching between appointment types
    if ((activityForm.formData.activityCategory === 'meeting-online' || activityForm.formData.activityCategory === 'meeting-offline') &&
      (newCategory === 'meeting-online' || newCategory === 'meeting-offline') &&
      activityForm.formData.activityCategory !== newCategory) {
      updates.appointmentLocation = '';
    }

    activityForm.updateFormData(updates);
  };

  return (
    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2, position: 'relative' }}>
      {/* Loading overlay for email confirmation */}
      {emailDialog.confirmingEmail && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            borderRadius: 2,
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body1" sx={{ mb: 1 }}>
              Loading Email...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Please wait while we fetch the email details
            </Typography>
          </Box>
        </Box>
      )}

      {/* Loading overlay for saving activity */}
      {saving && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            borderRadius: 2,
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={40} sx={{ mb: 2 }} />
            <Typography variant="body1" sx={{ mb: 1 }}>
              Saving Activity...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Please wait while we save your activity
            </Typography>
          </Box>
        </Box>
      )}

      {/* Loading overlay for downloading attachments */}
      {downloadingAttachments && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            borderRadius: 2,
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={40} sx={{ mb: 2 }} />
            <Typography variant="body1" sx={{ mb: 1 }}>
              Downloading Attachments...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Please wait while we download email attachments
            </Typography>
          </Box>
        </Box>
      )}

      <Stack spacing={2}>
        {/* Header */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: dealName ? 0.5 : 0 }}>
            <AddIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Activity
            </Typography>
          </Box>
          {dealName && (
            <Typography variant="body2" color="text.secondary">
              for {dealName}
            </Typography>
          )}
        </Box>
        {/* Activity Category Selection */}
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Activity Category</InputLabel>
              <Select
                value={activityForm.formData.activityCategory}
                disabled={emailDialog.confirmingEmail || downloadingAttachments}
                onChange={handleCategoryChange}
                label="Activity Category"
                sx={{ minWidth: 200 }}
              >
                {ACTIVITY_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Sync button for email */}
          {activityForm.formData.activityCategory === 'email' && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <Button
                variant="outlined"
                startIcon={<EmailIcon />}
                onClick={() => emailDialog.handleOpenEmailDialog(isConnected)}
                disabled={emailDialog.confirmingEmail || downloadingAttachments}
                sx={{ minWidth: 200, textTransform: 'none' }}
              >
                Synchronize from your Email Inbox
              </Button>
            </Grid>
          )}

          {/* Sync button for appointment */}
          {(activityForm.formData.activityCategory === 'meeting-online' || activityForm.formData.activityCategory === 'meeting-offline') && (
            <Grid size={{ xs: 12, sm: 12, md: 6, lg: 6 }}>
              <Button
                variant="outlined"
                startIcon={<ScheduleIcon />}
                onClick={() => appointmentDialog.handleOpenAppointmentDialog(isConnected)}
                disabled={emailDialog.confirmingEmail || downloadingAttachments}
                sx={{ minWidth: 200, textTransform: 'none' }}
              >
                Synchronize from your calendar
              </Button>
            </Grid>
          )}
        </Grid>

        {/* Subject Field */}
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 12 }} sx={{ width: '100%' }}>
            <TextField
              fullWidth
              label="Subject"
              value={activityForm.formData.subject}
              onChange={(e) => activityForm.updateFormData({ subject: e.target.value })}
              placeholder="e.g. Follow up call"
              disabled={emailDialog.confirmingEmail}
              sx={{ minWidth: 200 }}
            />
          </Grid>
        </Grid>

        {/* Category-specific fields */}
        <ActivityCategoryFields
          formData={activityForm.formData}
          updateFormData={activityForm.updateFormData}
          emailOptions={emailOptions}
          disabled={emailDialog.confirmingEmail}
        />

        {/* Description Editor */}
        <DescriptionEditor
          description={activityForm.description}
          setDescription={activityForm.setDescription}
          disabled={emailDialog.confirmingEmail}
        />

        {/* File Upload Section */}
        <FileUploadSection
          uploadedFiles={activityForm.uploadedFiles}
          setUploadedFiles={activityForm.setUploadedFiles}
          disabled={emailDialog.confirmingEmail}
        />

        {/* Action Buttons */}
        {showActions && (
          <Box
            sx={{
              pt: 2,
              mt: 1,
              borderTop: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 1.5
            }}
          >
            <Button variant="outlined" onClick={onCancel} disabled={emailDialog.confirmingEmail}>
              Cancel
            </Button>
            <Button variant="contained" onClick={handleSave} disabled={saving || emailDialog.confirmingEmail}>
              {saving ? 'Saving...' : 'Save Activity'}
            </Button>
          </Box>
        )}
      </Stack>

      {/* Email Selection Dialog */}
      <Dialog
        open={emailDialog.emailDialogOpen}
        onClose={emailDialog.handleCloseEmailDialog}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Select Email for Activity
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Choose an email to create an activity from
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 0, flex: 1, position: 'relative' }}>
          <EmailListComponent
            emails={emailDialog.emails}
            selectedEmail={emailDialog.selectedEmail}
            onEmailSelect={emailDialog.handleEmailSelect}
            loading={emailDialog.emailLoading}
            loadingMore={emailDialog.loadingMoreEmails}
            hasMore={emailDialog.hasMoreEmails}
            onLoadMore={emailDialog.loadMoreEmails}
            onConnectEmail={handleConnectEmail}
            tokenExpired={emailDialog.tokenExpired}
            notConnected={!isConnected}
            totalCount={emailDialog.totalEmails}
            folders={emailDialog.mailFolders}
            selectedFolderId={emailDialog.selectedFolderId}
            onFolderSelect={emailDialog.handleFolderSelect}
            foldersLoading={emailDialog.foldersLoading}
          />

          {/* Dialog loading overlay */}
          {(emailDialog.emailLoading || emailDialog.confirmingEmail) && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
                borderRadius: 1,
              }}
            >
              <CircularProgress size={40} sx={{ mb: 2 }} />
              <Typography variant="body1" sx={{ textAlign: 'center' }}>
                {emailDialog.confirmingEmail ? 'Loading Email Details...' : 'Loading Emails...'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 1 }}>
                {emailDialog.confirmingEmail ? 'Please wait while we fetch the email details' : 'Please wait while we load your emails'}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider' }}>
          <Button onClick={emailDialog.handleCloseEmailDialog} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmEmail}
            variant="contained"
            disabled={!emailDialog.selectedEmail || emailDialog.confirmingEmail}
          >
            {emailDialog.confirmingEmail ? 'Loading Email...' : 'Use Selected Email'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Appointment Selection Dialog */}
      <Dialog
        open={appointmentDialog.appointmentDialogOpen}
        onClose={appointmentDialog.handleCloseAppointmentDialog}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Select Appointment for Activity
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Choose an appointment to create an activity from
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 0, flex: 1 }}>
          <AppointmentListComponent
            appointments={appointmentDialog.appointments}
            selectedAppointment={appointmentDialog.selectedAppointment}
            onAppointmentSelect={appointmentDialog.handleAppointmentSelect}
            loading={appointmentDialog.appointmentLoading}
            loadingMore={appointmentDialog.loadingMoreAppointments}
            hasMore={appointmentDialog.hasMoreAppointments}
            onLoadMore={appointmentDialog.loadMoreAppointments}
            onConnectEmail={handleConnectEmail}
            tokenExpired={appointmentDialog.tokenExpired}
            notConnected={!isConnected}
            totalCount={appointmentDialog.totalAppointments}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider' }}>
          <Button onClick={appointmentDialog.handleCloseAppointmentDialog} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmAppointment}
            variant="contained"
            disabled={!appointmentDialog.selectedAppointment}
          >
            Use Selected Appointment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
});

export default AddActivityForm;
