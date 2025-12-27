import { useState, useEffect } from 'react';
import { tokenHelper } from '@utils/tokenHelper';
import { getActivityParticipantsByActivityId } from '@presentation/data';
import { ACTIVITY_SOURCE_TYPES, ACTIVITY_CATEGORIES } from '../../../../../utils/constants';

/**
 * Custom hook to manage activity form state
 */
export const useActivityForm = (initialData, defaultAssignee, contacts, users) => {
  const [formData, setFormData] = useState({
    activityCategory: 'email',
    subject: '',
    person: [],
    appointmentDate: '',
    appointmentTime: '',
    appointmentEndDate: '',
    appointmentEndTime: '',
    appointmentDuration: '',
    appointmentLocation: '',
    appointmentPlatform: '',
    emailFrom: '',
    emailRecipient: [],
    conversationId: '',
    priority: 'normal',
    status: 'open',
    assignedTo: defaultAssignee || '',
    dueDate: '',
    dueTime: '',
  });

  const [description, setDescription] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const deriveActivityCategory = (data = {}) => {
    if (data.activityCategory) return data.activityCategory;

    const src = (data.sourceFrom || '').toLowerCase();
    const typ = (data.type || '').toLowerCase();

    if (src.includes('email') || typ === ACTIVITY_CATEGORIES.EMAIL) return 'email';
    if (src.includes('phone-call') || typ === ACTIVITY_CATEGORIES.CALL) return 'call';
    if (src.includes('meeting-online') || typ === 'meeting-online') return 'meeting-online';
    if (src.includes('meeting-offline') || typ === 'meeting-offline') return 'meeting-offline';
    if (src.includes('meeting') || typ === 'meeting') {
      return data.appointmentPlatform ? 'meeting-online' : 'meeting-offline';
    }
    if (src.includes('note') || typ === ACTIVITY_CATEGORIES.NOTE) return 'note';
    return 'email';
  };

  const getConversationId = (data = {}) =>
    data.conversationId || data.ConversationId || data.conversationID || '';

  const extractDateTimeParts = (value) => {
    if (!value) return { date: '', time: '' };
    try {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return { date: '', time: '' };
      return {
        date: d.toISOString().split('T')[0],
        time: d.toTimeString().split(' ')[0].substring(0, 5)
      };
    } catch {
      return { date: '', time: '' };
    }
  };

  // Load initial data when editing
  useEffect(() => {
    const loadInitialData = async () => {
      if (initialData) {
        const participants = await getActivityParticipantsByActivityId(initialData.id || 0);
        const personIds = participants.map(p => 
          p.contactId ? `contact-${p.contactId}` : `user-${p.userId}`
        );

        // Build email recipients from participants (role 'to') for email activities
        const emailRecipients = participants
          .filter(p => p.role === 'to')
          .map(p => {
            if (p.contactId) {
              const contact = contacts.find(c => c.id === p.contactId);
              return contact?.email || '';
            }
            if (p.userId) {
              const user = users.find(u => u.id === p.userId);
              return user?.email || '';
            }
            return '';
          })
          .filter(email => email);

        let emailFrom = '';
        const senderParticipant = participants.find(p => p.role === 'from');
        if (senderParticipant) {
          if (senderParticipant.contactId) {
            const contact = contacts.find(c => c.id === senderParticipant.contactId);
            emailFrom = contact?.email || '';
          } else if (senderParticipant.userId) {
            const user = users.find(u => u.id === senderParticipant.userId);
            emailFrom = user?.email || '';
          }
        }

        const derivedCategory = deriveActivityCategory(initialData);

        const { date: startDate, time: startTime } = extractDateTimeParts(initialData.appointmentDate || initialData.startAt);
        const { date: endDate, time: endTime } = extractDateTimeParts(initialData.appointmentEndDate || initialData.endAt);

        setFormData({
          activityCategory: derivedCategory,
          subject: initialData.subject || '',
          person: personIds,
          emailRecipient: emailRecipients,
          emailFrom: emailFrom,
          appointmentDate: startDate,
          appointmentTime: startTime,
          appointmentEndDate: endDate,
          appointmentEndTime: endTime,
          appointmentDuration: initialData.appointmentDuration || '',
          appointmentLocation: initialData.appointmentLocation || '',
          appointmentPlatform: initialData.appointmentPlatform || '',
          priority: initialData.priority || 'normal',
          status: initialData.status || 'open',
          assignedTo: initialData.assignedTo || defaultAssignee || '',
          dueDate: '',
          dueTime: '',
          conversationId: getConversationId(initialData),
        });

        if (initialData.dueAt) {
          try {
            const due = new Date(initialData.dueAt);
            setFormData(prev => ({
              ...prev,
              dueDate: due.toISOString().split('T')[0],
              dueTime: due.toTimeString().split(' ')[0].substring(0, 5)
            }));
          } catch (e) {
            setFormData(prev => ({
              ...prev,
              dueDate: '',
              dueTime: ''
            }));
          }
        } else {
          setFormData(prev => ({
            ...prev,
            dueDate: initialData.dueDate || '',
            dueTime: initialData.dueTime || ''
          }));
        }

        if (initialData.body) {
          setDescription(initialData.body);
        } else {
          setDescription('');
        }
      }
    };

    loadInitialData();
  }, [initialData, defaultAssignee, contacts, users]);

  // Set default sender email for email activities
  useEffect(() => {
    if (formData.activityCategory === 'email' && !formData.emailFrom) {
      try {
        const userEmail = tokenHelper.getEmailFromToken();
        if (userEmail) {
          setFormData(prev => ({ ...prev, emailFrom: userEmail }));
        } else {
          setFormData(prev => ({ ...prev, emailFrom: 'sales@crm.com' }));
        }
      } catch (error) {
        console.warn('Could not get user email, using default:', error);
        setFormData(prev => ({ ...prev, emailFrom: 'sales@crm.com' }));
      }
    }
  }, [formData.activityCategory, formData.emailFrom]);

  const updateFormData = (updates) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const resetForm = () => {
    setFormData({
      activityCategory: formData.activityCategory,
      subject: '',
      person: [],
      appointmentDate: '',
      appointmentTime: '',
      appointmentEndDate: '',
      appointmentEndTime: '',
      appointmentDuration: '',
      appointmentLocation: '',
      appointmentPlatform: '',
      emailFrom: '',
      emailRecipient: [],
      conversationId: '',
      priority: 'normal',
      status: 'open',
      assignedTo: defaultAssignee || '',
      dueDate: '',
      dueTime: '',
    });
    setDescription('');
    setUploadedFiles([]);
  };

  const validate = () => {
    const errors = [];
    const category = formData.activityCategory;
    const subject = (formData.subject || '').trim();
    const defaultSubject = `${category.charAt(0).toUpperCase() + category.slice(1)} Activity`;

    // Skip subject validation for note activities
    if (category !== 'note' && (!subject || subject === defaultSubject)) {
      errors.push('Please enter an activity subject.');
    }

    if (category === 'meeting-online' || category === 'meeting-offline') {
      if (!formData.appointmentDate || !formData.appointmentTime) {
        errors.push('Appointment date and time are required.');
      }
    }

    if (category === 'email') {
      const recipients = Array.isArray(formData.emailRecipient)
        ? formData.emailRecipient
        : (formData.emailRecipient ? [formData.emailRecipient] : []);
      if (recipients.length === 0) {
        errors.push('Please select at least one email recipient.');
      }
    }

    return { valid: errors.length === 0, errors };
  };

  return {
    formData,
    description,
    uploadedFiles,
    setFormData,
    setDescription,
    setUploadedFiles,
    updateFormData,
    resetForm,
    validate,
  };
};

