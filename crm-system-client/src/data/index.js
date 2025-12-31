import leadsApi from '../infrastructure/api/leadsApi';
import customersApi from '../infrastructure/api/customersApi';
import contactsApi from '../infrastructure/api/contactsApi';
import dealsApi from '../infrastructure/api/dealsApi';
import activitiesApi from '../infrastructure/api/activitiesApi';
import emailsApi from '../infrastructure/api/emailsApi';
import appointmentsApi from '../infrastructure/api/appointmentsApi';
import usersApi from '../infrastructure/api/usersApi';
import quotationsApi from '../infrastructure/api/quotationsApi';
import salesQuotationsApi from '../infrastructure/api/salesQuotationsApi';
import activityParticipantsApi from '../infrastructure/api/activityParticipantsApi';
import activityAttachmentsApi from '../infrastructure/api/activityAttachmentsApi';
import assigneesApi from '../infrastructure/api/assigneesApi';
import dealQuotationsApi from '../infrastructure/api/dealQuotationsApi';
import pipelineLogsApi from '../infrastructure/api/pipelineLogsApi';
import addressesApi from '../infrastructure/api/addressesApi';
import sharepointApi from '../infrastructure/api/sharepointApi';
import { LocalAuthRepository } from '../infrastructure/repositories/LocalAuthRepository';
import { EmailAuthRepository } from '../infrastructure/repositories/EmailAuthRepository';

// Helper functions to get leads data from database
export const getLeads = async (params = {}) => {
  try {
    const response = await leadsApi.getAll(params);
    return response.data.data?.items || []; // API returns { success, message, data: { items, totalCount } }
  } catch (error) {
    console.error('Error fetching leads from API:', error);
    throw error; // No fallback to mock data
  }
};

export const getLeadById = async (id) => {
  try {
    const response = await leadsApi.getById(id);
    return response.data.data; // API returns { success, message, data: LeadResponse }
  } catch (error) {
    console.error('Error fetching lead by ID from API:', error);
    throw error; // No fallback to mock data
  }
};

// Update lead (basic fields only; no activity orchestration)
export const updateLead = async (id, lead) => {
  try {
    const payload = {
      email: lead.email ?? null,
      telephoneNo: lead.telephoneNo ?? null,
      company: lead.company,
      website: lead.website ?? null,
      country: lead.country ?? null,
      vatNumber: lead.vatNumber ?? null,
      paymentTerms: lead.paymentTerms ?? null,
      source: lead.source,
      status: lead.status,
      score: typeof lead.score === 'number' ? lead.score : parseInt(lead.score || '0', 10),
      note: lead.note ?? null,
      type: lead.type ?? 0,
      ownerId: lead.ownerId ? parseInt(lead.ownerId, 10) : null,
      followUpDate: lead.followUpDate ?? null,
      customerId: lead.customerId ?? null,
      userId: lead.contactId ?? null,
      addresses: lead.addresses ?? [],
    };

    const response = await leadsApi.update(id, payload);
    return response.data.data; // Updated lead response
  } catch (error) {
    console.error('Error updating lead via API:', error);
    throw error;
  }
};

// Convert lead to deal
export const convertLeadToDeal = async (leadId, conversionData) => {
  try {
    const response = await leadsApi.convertToDeal(leadId, conversionData);
    return response.data.data; // Created deal ID
  } catch (error) {
    console.error('Error converting lead to deal via API:', error);
    throw error;
  }
};

// Create lead (and optionally related customer, contact, and initial activity)
export const createLead = async ({
  lead,
  contact,
  customer,
  activity,
  selectedContactId,
  selectedCustomerId,
}) => {
  try {
    // 1) Ensure customer exists (create if provided)
    let customerId = selectedCustomerId || null;
    if (!customerId && customer) {
      const customerPayload = {
        name: customer.name,
        domain: customer.domain || null,
        email: customer.email || null,
        phone: customer.phone || null,
        address: customer.address || null,
        city: customer.city || null,
        country: customer.country || null,
        notes: customer.notes || null,
        salesTeamId: customer.salesTeamId || null,
      };
      const createdCustomerResp = await customersApi.create(customerPayload);
      customerId = createdCustomerResp?.data?.data?.id || createdCustomerResp?.data?.data?.customerId || null;
    }

    // 2) Ensure contact exists (create if provided)
    let contactId = selectedContactId || null;
    if (!contactId && contact) {
      const contactPayload = {
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email || null,
        phone: contact.phone || null,
        company: contact.company || null,
        notes: contact.notes || null,
        customerId: customerId || null,
      };
      const createdContactResp = await contactsApi.create(contactPayload);
      contactId = createdContactResp?.data?.data?.id || createdContactResp?.data?.data?.userId || null;
    }

    // 3) Create lead
    const leadPayload = {
      email: lead.email || null,
      telephoneNo: lead.telephoneNo || null,
      company: lead.company,
      website: lead.website || null,
      vatNumber: lead.vatNumber || null,
      paymentTerms: lead.paymentTerms || null,
      source: lead.source,
      status: lead.status,
      score: typeof lead.score === 'number' ? lead.score : parseInt(lead.score || '0', 10),
      note: lead.note || null,
      ownerId: lead.ownerId ? parseInt(lead.ownerId, 10) : null,
      followUpDate: lead.followUpDate || null,
      customerId: customerId,
      contactId: contactId,
      // Pass addresses so backend can persist them with the lead
      addresses: Array.isArray(lead.addresses) ? lead.addresses : [],
    };

    // If activity provided, use server orchestration endpoint for atomic create
    if (activity) {
      const mapCategoryToType = (category, fallback) => {
        if (!category && fallback) return fallback;
        switch ((category || '').toLowerCase()) {
          case 'email': return 'email';
          case 'call': return 'call';
          case 'meeting-online':
          case 'meeting-offline':
          case 'meeting': return 'meeting';
          case 'task': return 'task';
          case 'note': return 'note';
          case 'reminder': return 'reminder';
          default: return 'note';
        }
      };

      const activityPayload = {
        subject: activity.subject,
        body: activity.body,
        status: activity.status || 'open',
        priority: activity.priority || 'normal',
        assignedTo: activity.assignedTo || null,
        sourceFrom: activity.sourceFrom || null,
        activityType: mapCategoryToType(activity.activityCategory, activity.activityType),
        relationId: null, // server fills after lead insert
        dueAt: activity.dueAt || null,
        callDuration: activity.callDuration || null,
        callOutcome: activity.callOutcome || null,
        externalId: activity.externalId || null,
        conversationId: activity.conversationId || null,
      };

      const orchestrationResp = await leadsApi.createWithActivity({
        lead: leadPayload,
        activity: activityPayload,
      });

      const ids = orchestrationResp?.data?.data || {};
      // Support multiple casing styles from API: camelCase, PascalCase, snake_case
      const newLeadId = ids.leadId;
      const newActivityId = ids.activityId || ids.ActivityId;

      // Fetch full lead when id is available
      let createdLead = null;
      if (newLeadId != null) {
        const createdLeadResp = await leadsApi.getById(newLeadId);
        createdLead = createdLeadResp?.data?.data;
      }

      return {
        lead: createdLead,
        contactId,
        customerId,
        activity: newActivityId ? { id: newActivityId } : null,
      };
    }

    // No activity: create lead only (legacy path)
    const createdLeadResp = await leadsApi.create(leadPayload);
    const createdLead = createdLeadResp?.data?.data;

    return {
      lead: createdLead,
      contactId,
      customerId,
      activity: null,
    };
  } catch (error) {
    console.error('Error creating lead via API:', error);
    throw error;
  }
};

export const getLeadsByStatus = async (status) => {
  try {
    const response = await leadsApi.getAll({ status });
    return response.data.data?.items || []; // API returns { success, message, data: { items, totalCount } }
  } catch (error) {
    console.error('Error fetching leads by status from API:', error);
    throw error; // No fallback to mock data
  }
};

export const getLeadsBySource = async (source) => {
  try {
    const response = await leadsApi.getAll({ source });
    return response.data.data?.items || []; // API returns { success, message, data: { items, totalCount } }
  } catch (error) {
    console.error('Error fetching leads by source from API:', error);
    throw error; // No fallback to mock data
  }
};

export const getActivities = async (params = {}) => {
  try {
    const response = await activitiesApi.getAll(params);
    return response.data.data?.items || [];
  } catch (error) {
    console.error('Error fetching activities from API:', error);
    throw error;
  }
};

export const getActivitiesByRelation = async (relationType, relationId) => {
  try {
    const response = await activitiesApi.getByRelation(relationType, relationId);
    return response.data.data?.items || [];
  } catch (error) {
    console.error('Error fetching activities by relation from API:', error);
    throw error;
  }
};

export const getActivitiesByStatus = async (status) => {
  try {
    const response = await activitiesApi.getByStatus(status);
    return response.data.data?.items || [];
  } catch (error) {
    console.error('Error fetching activities by status from API:', error);
    throw error;
  }
};

export const getActivityById = async (id) => {
  try {
    const response = await activitiesApi.getById(id);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching activity by ID from API:', error);
    throw error;
  }
};

// Activity Participants functions from database
export const getActivityParticipants = async (params = {}) => {
  try {
    const response = await activityParticipantsApi.getAll(params);
    return response.data.data?.items || [];
  } catch (error) {
    console.error('Error fetching activity participants from API:', error);
    throw error;
  }
};

export const getActivityParticipantsByActivityId = async (activityId) => {
  try {
    const response = await activityParticipantsApi.getByActivityId(activityId);
    return response.data.data?.items || [];
  } catch (error) {
    console.error('Error fetching activity participants by activity ID from API:', error);
    throw error;
  }
};

export const getActivityParticipantsByContactId = async (contactId) => {
  try {
    const response = await activityParticipantsApi.getByContactId(contactId);
    return response.data.data?.items || [];
  } catch (error) {
    console.error('Error fetching activity participants by contact ID from API:', error);
    throw error;
  }
};

export const getActivityParticipantsByUserId = async (userId) => {
  try {
    const response = await activityParticipantsApi.getByUserId(userId);
    return response.data.data?.items || [];
  } catch (error) {
    console.error('Error fetching activity participants by user ID from API:', error);
    throw error;
  }
};

export const getActivityParticipantsByRole = async (role) => {
  try {
    const response = await activityParticipantsApi.getByRole(role);
    return response.data.data?.items || [];
  } catch (error) {
    console.error('Error fetching activity participants by role from API:', error);
    throw error;
  }
};

// Function to update existing activity via API
export const updateActivity = async (activityId, activityData, participants = [], emailRecipients = []) => {
  try {
    // Normalize/transform activity payload for API (PascalCase and expected fields)
    const mapCategoryToType = (category, fallback) => {
      if (!category && fallback) return fallback;
      switch ((category || '').toLowerCase()) {
        case 'email': return 'email';
        case 'call': return 'call';
        case 'meeting-online':
        case 'meeting-offline':
        case 'meeting': return 'meeting';
        case 'task': return 'task';
        case 'note': return 'note';
        case 'reminder': return 'reminder';
        default: return 'note';
      }
    };

    // Send payload with camelCase field names for API consistency
    const payload = {
      subject: activityData.subject,
      body: activityData.body,
      status: activityData.status || 'open',
      priority: activityData.priority || 'normal',
      assignedTo: activityData.assignedTo || null,
      sourceFrom: activityData.sourceFrom || null,
      activityType: mapCategoryToType(activityData.activityCategory, activityData.activityType),
      relationType: activityData.relationType || null,
      relationId: activityData.relationId ? parseInt(activityData.relationId) : null,
      dueAt: activityData.dueAt || null,
      startAt: activityData.startAt || null,
      endAt: activityData.endAt || null,
      callDuration: activityData.callDuration || null,
      callOutcome: activityData.callOutcome || null,
      externalId: activityData.externalId || null,
      conversationId: activityData.conversationId || null,
      appointmentDate: activityData.appointmentDate || null,
      appointmentTime: activityData.appointmentTime || null,
      appointmentEndDate: activityData.appointmentEndDate || null,
      appointmentEndTime: activityData.appointmentEndTime || null,
      appointmentDuration: activityData.appointmentDuration || null,
      appointmentLocation: activityData.appointmentLocation || null,
      appointmentPlatform: activityData.appointmentPlatform || null,
    };

    // Update the activity
    const response = await activitiesApi.update(activityId, payload);
    const updatedActivity = response.data.data;

    return updatedActivity;
  } catch (error) {
    console.error('Error updating activity via API:', error);
    throw error;
  }
};

// Function to check emails by ConversationId from mail server
export const checkEmailsByConversation = async (conversationId) => {
  try {
    if (!conversationId) {
      console.log('checkEmailsByConversation: No conversationId provided');
      return { emails: [], hasEmails: false, emailCount: 0 };
    }

    console.log('checkEmailsByConversation: Checking emails for conversationId:', conversationId);

    // Check if email is connected to Outlook
    const localRepo = new LocalAuthRepository();
    const emailAuthRepo = new EmailAuthRepository(localRepo);

    if (!emailAuthRepo.isConnected()) {
      console.log('checkEmailsByConversation: Email not connected to Outlook server');
      return { emails: [], hasEmails: false, emailCount: 0 };
    }

    console.log('checkEmailsByConversation: Email connected, fetching from Outlook...');

    // Get emails by conversation from mail server
    const result = await emailAuthRepo.getEmailsByConversation(conversationId);
    const emails = result.emails || result || [];

    console.log('checkEmailsByConversation: Found', emails.length, 'emails for conversationId:', conversationId);

    return {
      emails: emails,
      hasEmails: emails.length > 0,
      emailCount: emails.length
    };
  } catch (error) {
    console.error('checkEmailsByConversation: Error checking emails by conversation:', error);
    return { emails: [], hasEmails: false, emailCount: 0 };
  }
};

// Function to create new activity via API
export const createActivity = async (activityData, participants = [], emailRecipients = [], files = []) => {
  try {
    // Normalize/transform activity payload for API (PascalCase and expected fields)
    const mapCategoryToType = (category, fallback) => {
      if (!category && fallback) return fallback;
      switch ((category || '').toLowerCase()) {
        case 'email': return 'email';
        case 'call': return 'call';
        case 'meeting-online':
        case 'meeting-offline':
        case 'meeting': return 'meeting';
        case 'task': return 'task';
        case 'note': return 'note';
        case 'reminder': return 'reminder';
        default: return 'note';
      }
    };

    // Prepare activity payload with camelCase field names for API consistency
    const activityPayload = {
      subject: activityData.subject,
      body: activityData.body,
      status: activityData.status || 'open',
      priority: activityData.priority || 'normal',
      assignedTo: activityData.assignedTo || null,
      sourceFrom: activityData.sourceFrom || null,
      activityType: mapCategoryToType(activityData.activityCategory, activityData.activityType),
      relationType: activityData.relationType || null,
      relationId: activityData.relationId ? parseInt(activityData.relationId) : null,
      dueAt: activityData.dueAt || null,
      startAt: activityData.startAt || null,
      endAt: activityData.endAt || null,
      callDuration: activityData.callDuration || null,
      callOutcome: activityData.callOutcome || null,
      externalId: activityData.externalId || null,
      conversationId: activityData.conversationId || null,
      appointmentDate: activityData.appointmentDate || null,
      appointmentTime: activityData.appointmentTime || null,
      appointmentEndDate: activityData.appointmentEndDate || null,
      appointmentEndTime: activityData.appointmentEndTime || null,
      appointmentDuration: activityData.appointmentDuration || null,
      appointmentLocation: activityData.appointmentLocation || null,
      appointmentPlatform: activityData.appointmentPlatform || null,
      contractDate: activityData.contractDate || null,
      contractValue: activityData.contractValue || null,
    };

    // Transform participants from personId strings to ParticipantInput objects
    const participantInputs = [];
    if (participants && participants.length > 0) {
      participants.forEach(personId => {
        const participantInput = { role: 'attendee' }; // Default role

        if (personId.startsWith('contact-')) {
          participantInput.contactId = parseInt(personId.replace('contact-', ''));
        } else if (personId.startsWith('user-')) {
          participantInput.userId = parseInt(personId.replace('user-', ''));
        }

        if (participantInput.contactId || participantInput.userId) {
          participantInputs.push(participantInput);
        }
      });
    }

    // Use the new unified API endpoint that handles everything in one transaction
    const response = await activitiesApi.createWithParticipantsAndAttachments(
      activityPayload,
      participantInputs,
      emailRecipients || [],
      files || []
    );

    const apiData = response.data.data;

    // Check if API returns ID or full object
    if (typeof apiData === 'number') {
      // API returns ID, fetch full activity details
      const activity = await getActivityById(apiData);

      // Enrich with participants and attachments like in getEnrichedLead
      const [activityParticipants, activityAttachments] = await Promise.all([
        getActivityParticipantsByActivityId(activity.id),
        getActivityAttachmentsByActivity(activity.id)
      ]);

      const enrichedParticipants = await Promise.all(activityParticipants.map(async (participant) => ({
        ...participant,
        contact: participant.contactId ? await getContactById(participant.contactId) : null,
        user: participant.userId ? await getUserById(participant.userId) : null
      })));

      const enrichedActivity = {
        ...activity,
        participants: enrichedParticipants,
        attachments: activityAttachments
      };

      return enrichedActivity;
    } else {
      // API returns full object, enrich it
      const [activityParticipants, activityAttachments] = await Promise.all([
        getActivityParticipantsByActivityId(apiData.id),
        getActivityAttachmentsByActivity(apiData.id)
      ]);

      const enrichedParticipants = await Promise.all(activityParticipants.map(async (participant) => ({
        ...participant,
        contact: participant.contactId ? await getContactById(participant.contactId) : null,
        user: participant.userId ? await getUserById(participant.userId) : null
      })));

      const enrichedActivity = {
        ...apiData,
        participants: enrichedParticipants,
        attachments: activityAttachments
      };

      return enrichedActivity;
    }
  } catch (error) {
    console.error('Error creating activity via API:', error);
    throw error;
  }
};

// Assignees functions from database
export const getAssignees = async (params = {}) => {
  try {
    const response = await assigneesApi.getAll(params);
    return response.data.data?.items || [];
  } catch (error) {
    console.error('Error fetching assignees from API:', error);
    throw error;
  }
};

export const getAssigneesByRelation = async (relationType, relationId) => {
  try {
    const response = await assigneesApi.getByRelation(relationType, relationId);
    return response.data.data?.items || [];
  } catch (error) {
    console.error('Error fetching assignees by relation from API:', error);
    throw error;
  }
};

export const createAssignee = async (assigneeData) => {
  try {
    const response = await assigneesApi.create(assigneeData);
    return response.data.data;
  } catch (error) {
    console.error('Error creating assignee via API:', error);
    throw error;
  }
};

export const updateAssignee = async (id, assigneeData) => {
  try {
    const response = await assigneesApi.update(id, assigneeData);
    return response.data.data;
  } catch (error) {
    console.error('Error updating assignee via API:', error);
    throw error;
  }
};

export const deleteAssignee = async (id) => {
  try {
    await assigneesApi.delete(id);
    return true;
  } catch (error) {
    console.error('Error deleting assignee via API:', error);
    throw error;
  }
};


export const getActivityAttachments = async (params = {}) => {
  try {
    const response = await activityAttachmentsApi.getAll(params);
    return response.data.data?.items || [];
  } catch (error) {
    console.error('Error fetching activity attachments from API:', error);
    throw error;
  }
};

export const getActivityAttachmentsByActivity = async (activityId) => {
  try {
    const response = await activityAttachmentsApi.getByActivity(activityId);
    return response.data.data?.items || [];
  } catch (error) {
    console.error('Error fetching activity attachments by activity from API:', error);
    throw error;
  }
};

export const getUsers = async (params = {}) => {
  try {
    const response = await usersApi.getAll(params);
    return response.data.data?.items || [];
  } catch (error) {
    console.error('Error fetching users from API:', error);
    throw error;
  }
};

export const getUserById = async (id) => {
  try {
    const response = await usersApi.getById(id);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching user by ID from API:', error);
    throw error;
  }
};

export const getUserByEmail = async (email) => {
  try {
    const response = await usersApi.getByEmail(email);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching user by ID from API:', error);
    throw error;
  }
};

export const getCustomers = async (params = {}) => {
  try {
    const response = await customersApi.getAll(params);
    return response.data.data?.items || [];
  } catch (error) {
    console.error('Error fetching customers from API:', error);
    throw error;
  }
};

export const getCustomerById = async (id) => {
  try {
    const response = await customersApi.getById(id);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching customer by ID from API:', error);
    throw error;
  }
};

export const getCustomersByType = async (type) => {
  try {
    const response = await customersApi.getByType(type);
    return response.data.data?.items || [];
  } catch (error) {
    console.error('Error fetching customers by type from API:', error);
    throw error;
  }
};

export const getContacts = async (params = {}) => {
  try {
    const response = await contactsApi.getAll(params);
    return response.data.data?.items || [];
  } catch (error) {
    console.error('Error fetching contacts from API:', error);
    throw error;
  }
};

export const getContactById = async (id) => {
  try {
    const response = await contactsApi.getById(id);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching contact by ID from API:', error);
    throw error;
  }
};

export const getContactsByCustomer = async (customerId) => {
  try {
    const response = await contactsApi.getByCustomer(customerId);
    return response.data.data?.items || [];
  } catch (error) {
    console.error('Error fetching contacts by customer from API:', error);
    throw error;
  }
};

export const getPrimaryContacts = async () => {
  try {
    const response = await contactsApi.getPrimaryContacts();
    return response.data.data?.items || [];
  } catch (error) {
    console.error('Error fetching primary contacts from API:', error);
    throw error;
  }
};

export const getDeals = async (params = {}) => {
  try {
    const response = await dealsApi.getAll(params);
    return response.data.data?.items || [];
  } catch (error) {
    console.error('Error fetching deals from API:', error);
    throw error;
  }
};

export const getDealById = async (id) => {
  try {
    const response = await dealsApi.getById(id);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching deal by ID from API:', error);
    throw error;
  }
};

export const getDealsByStage = async (stage) => {
  try {
    const response = await dealsApi.getByStage(stage);
    return response.data.data?.items || [];
  } catch (error) {
    console.error('Error fetching deals by stage from API:', error);
    throw error;
  }
};

export const getDealsByCustomer = async (customerId) => {
  try {
    const response = await dealsApi.getByCustomer(customerId);
    return response.data.data?.items || [];
  } catch (error) {
    console.error('Error fetching deals by customer from API:', error);
    throw error;
  }
};

// Create deal (and optionally related customer, contact)
export const createDeal = async ({
  deal,
  contact,
  customer,
  selectedContactId,
  selectedCustomerId,
}) => {
  try {
    let customerId = selectedCustomerId || null;
    if (!customerId && customer) {
      const customerPayload = {
        name: customer.name,
        domain: customer.domain || null,
        email: customer.email || null,
        phone: customer.phone || null,
        address: customer.address || null,
        city: customer.city || null,
        country: customer.country || null,
        notes: customer.notes || null,
      };
      const createdCustomerResp = await customersApi.create(customerPayload);
      customerId = createdCustomerResp?.data?.data?.id || createdCustomerResp?.data?.data?.customerId || null;
    }

    let contactId = selectedContactId || null;
    if (!contactId && contact) {
      const contactPayload = {
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email || null,
        phone: contact.phone || null,
        company: contact.company || null,
        notes: contact.notes || null,
        customerId: customerId || null,
      };
      const createdContactResp = await contactsApi.create(contactPayload);
      contactId = createdContactResp?.data?.data?.id || createdContactResp?.data?.data?.userId || null;
    }

    const dealPayload = {
      name: deal.name,
      description: deal.description || null,
      expectedRevenue: deal.expectedRevenue !== undefined && deal.expectedRevenue !== null
        ? parseFloat(deal.expectedRevenue)
        : null,
      actualRevenue: deal.actualRevenue !== undefined && deal.actualRevenue !== null
        ? parseFloat(deal.actualRevenue)
        : null,
      closeDate: deal.closeDate || null,
      source: deal.source || null,
      stage: deal.stage || null,
      note: deal.note || null,
      customerId: customerId || null,
      contactId: contactId || null,
      ownerId: deal.ownerId ? parseInt(deal.ownerId, 10) : null,
      salesTeamId: deal.salesTeamId ?? deal.teamId ?? null,
    };

    const response = await dealsApi.create(dealPayload);

    // Normalize and return created deal
    return response?.data?.data || response?.data || { id: null, ...dealPayload };
  } catch (error) {
    console.error('Error creating deal via API:', error);
    throw error;
  }
};

export const updateDeal = async ({
  dealId,
  deal,
  contact,
  customer,
  selectedContactId,
  selectedCustomerId,
}) => {
  try {
    let customerId = selectedCustomerId || null;
    if (!customerId && customer) {
      const customerPayload = {
        name: customer.name,
        domain: customer.domain || null,
        email: customer.email || null,
        phone: customer.phone || null,
        address: customer.address || null,
        city: customer.city || null,
        country: customer.country || null,
        notes: customer.notes || null,
        salesTeamId: customer.salesTeamId || null,
      };
      const createdCustomerResp = await customersApi.create(customerPayload);
      customerId = createdCustomerResp?.data?.data?.id || createdCustomerResp?.data?.data?.customerId || null;
    }

    let contactId = selectedContactId || null;
    if (!contactId && contact) {
      const contactPayload = {
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email || null,
        phone: contact.phone || null,
        company: contact.company || null,
        notes: contact.notes || null,
        customerId: customerId || null,
      };
      const createdContactResp = await contactsApi.create(contactPayload);
      contactId = createdContactResp?.data?.data?.id || createdContactResp?.data?.data?.userId || null;
    }

    const dealPayload = {
      name: deal.name,
      description: deal.description || null,
      expectedRevenue: deal.expectedRevenue !== undefined && deal.expectedRevenue !== null
        ? parseFloat(deal.expectedRevenue)
        : null,
      actualRevenue: deal.actualRevenue !== undefined && deal.actualRevenue !== null
        ? parseFloat(deal.actualRevenue)
        : null,
      closeDate: deal.closeDate || null,
      source: deal.source || null,
      stage: deal.stage || null,
      note: deal.note || null,
      customerId: customerId || null,
      contactId: contactId || null,
      ownerId: deal.ownerId ? parseInt(deal.ownerId, 10) : null,
      salesTeamId: deal.salesTeamId ?? deal.teamId ?? null,
    };

    const response = await dealsApi.update(dealId, dealPayload);

    // Normalize and return updated deal
    return response?.data?.data || response?.data || { id: dealId, ...dealPayload };
  } catch (error) {
    console.error('Error updating deal via API:', error);
    throw error;
  }
};

export const getQuotations = async (params = {}) => {
  try {
    const response = await quotationsApi.getAll(params);
    return response.data.data?.items || [];
  } catch (error) {
    console.error('Error fetching quotations from API:', error);
    throw error;
  }
};

export const getQuotationById = async (id) => {
  try {
    const response = await quotationsApi.getById(id);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching quotation by ID from API:', error);
    throw error;
  }
};

export const getQuotationsByStatus = async (status) => {
  try {
    const response = await quotationsApi.getByStatus(status);
    return response.data.data?.items || [];
  } catch (error) {
    console.error('Error fetching quotations by status from API:', error);
    throw error;
  }
};

export const getQuotationsByCustomer = async (customerId) => {
  try {
    // use Dynamics SalesQuotationHeadersV2 with filter on RSVNCustCode
    const custCode = customerId.toString();

    const response = await salesQuotationsApi.getAllPaging(
      1,
      50,
      null,
      "asc",
      [
        {
          column: "RequestingCustomerAccountNumber",
          operator: "eq",
          value: `${custCode}`
        }
      ]
    );

    const data = response.data?.data;
    if (!data) return [];

    // Dynamics OData payload
    if (data.value) return data.value;

    // CRM API fallback shape
    if (data.items) return data.items;

    return [];
  } catch (error) {
    console.error('Error fetching quotations by deal from API:', error);
    throw error;
  }
};
export const getQuotationsByDeal = async (dealId) => {
  try {
    const response = await dealQuotationsApi.getQuotationsWithDynamicsByDeal(dealId);
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching quotations by deal from API:', error);
    throw error;
  }
};

// Deal quotations helper functions from database
export const getDealQuotations = async (params = {}) => {
  try {
    const response = await dealQuotationsApi.getAll(params);
    return response.data.data?.items || [];
  } catch (error) {
    console.error('Error fetching deal quotations from API:', error);
    throw error;
  }
};

export const getDealQuotationById = async (id) => {
  try {
    const response = await dealQuotationsApi.getById(id);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching deal quotation by ID from API:', error);
    throw error;
  }
};

export const getDealQuotationsByDeal = async (dealId) => {
  try {
    const response = await dealQuotationsApi.getByDeal(dealId);
    return response.data.data?.items || [];
  } catch (error) {
    console.error('Error fetching deal quotations by deal from API:', error);
    throw error;
  }
};

export const getDealQuotationsByQuotation = async (quotationNumber) => {
  try {
    const response = await dealQuotationsApi.getByQuotation(quotationNumber);
    return response.data.data?.items || [];
  } catch (error) {
    console.error('Error fetching deal quotations by quotation from API:', error);
    throw error;
  }
};

export const createDealQuotation = async (data) => {
  try {
    const response = await dealQuotationsApi.create(data);
    return response.data.data;
  } catch (error) {
    console.error('Error creating deal quotation:', error);
    throw error;
  }
};

export const bulkCreateDealQuotations = async (dataArray) => {
  try {
    const response = await dealQuotationsApi.bulkCreate(dataArray);
    return response.data.data;
  } catch (error) {
    console.error('Error bulk creating deal quotations:', error);
    throw error;
  }
};

export const updateDealQuotation = async (id, data) => {
  try {
    const response = await dealQuotationsApi.update(id, data);
    return response.data.data;
  } catch (error) {
    console.error('Error updating deal quotation:', error);
    throw error;
  }
};

export const deleteDealQuotation = async (id) => {
  try {
    await dealQuotationsApi.delete(id);
    return true;
  } catch (error) {
    console.error('Error deleting deal quotation:', error);
    throw error;
  }
};

// Pipeline logs helper functions from database
export const getPipelineLogs = async (params = {}) => {
  try {
    const response = await pipelineLogsApi.getAll(params);
    return response.data.data?.items || [];
  } catch (error) {
    console.error('Error fetching pipeline logs from API:', error);
    throw error;
  }
};

export const getPipelineLogById = async (id) => {
  try {
    const response = await pipelineLogsApi.getById(id);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching pipeline log by ID from API:', error);
    throw error;
  }
};

export const getPipelineLogsByDeal = async (dealId) => {
  try {
    const response = await pipelineLogsApi.getByDeal(dealId);
    return response.data.data?.items || [];
  } catch (error) {
    console.error('Error fetching pipeline logs by deal from API:', error);
    throw error;
  }
};

export const getPipelineLogsByStage = async (stage) => {
  try {
    const response = await pipelineLogsApi.getByStage(stage);
    return response.data.data?.items || [];
  } catch (error) {
    console.error('Error fetching pipeline logs by stage from API:', error);
    throw error;
  }
};

export const createPipelineLog = async (data) => {
  try {
    const response = await pipelineLogsApi.create(data);
    return response.data.data;
  } catch (error) {
    console.error('Error creating pipeline log:', error);
    throw error;
  }
};

// Address helper functions from database
export const getAddressesByRelation = async (relationType, relationId) => {
  try {
    const response = await addressesApi.getByRelation(relationType, relationId);
    return response.data.data?.items || [];
  } catch (error) {
    console.error('Error fetching addresses by relation from API:', error);
    throw error;
  }
};

export const createAddress = async (address) => {
  try {
    const payload = {
      relationType: address.relationType,
      relationId: address.relationId ? parseInt(address.relationId, 10) : null,
      addressType: address.addressType || null,
      companyName: address.companyName || null,
      addressLine: address.addressLine || null,
      postcode: address.postcode || null,
      city: address.city || null,
      country: address.country || null,
      contactPerson: address.contactPerson || null,
      email: address.email || null,
      telephoneNo: address.telephoneNo || null,
      portOfDestination: address.portOfDestination || null,
      isPrimary: Boolean(address.isPrimary),
    };

    const response = await addressesApi.create(payload);
    return response.data.data;
  } catch (error) {
    console.error('Error creating address:', error);
    throw error;
  }
};

export const updateAddress = async (addressId, address) => {
  try {
    const payload = {
      relationType: address.relationType,
      relationId: address.relationId ? parseInt(address.relationId, 10) : null,
      addressType: address.addressType || null,
      companyName: address.companyName || null,
      addressLine: address.addressLine || null,
      postcode: address.postcode || null,
      city: address.city || null,
      country: address.country || null,
      contactPerson: address.contactPerson || null,
      email: address.email || null,
      telephoneNo: address.telephoneNo || null,
      portOfDestination: address.portOfDestination || null,
      isPrimary: Boolean(address.isPrimary),
    };

    const response = await addressesApi.update(addressId, payload);
    return response.data.data;
  } catch (error) {
    console.error('Error updating address:', error);
    throw error;
  }
};

export const deleteAddress = async (addressId) => {
  try {
    const response = await addressesApi.delete(addressId);
    return response.data.data;
  } catch (error) {
    console.error('Error deleting address:', error);
    throw error;
  }
};

// Email helper functions from database
export const getEmails = async (params = {}) => {
  try {
    const response = await emailsApi.getAll(params);
    return response.data.data?.items || [];
  } catch (error) {
    console.error('Error fetching emails from API:', error);
    throw error;
  }
};

export const getEmailById = async (id) => {
  try {
    const response = await emailsApi.getById(id);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching email by ID from API:', error);
    throw error;
  }
};

export const getEmailsByImportance = async (importance) => {
  try {
    const response = await emailsApi.getByImportance(importance);
    return response.data.data?.items || [];
  } catch (error) {
    console.error('Error fetching emails by importance from API:', error);
    throw error;
  }
};

export const getUnreadEmails = async () => {
  try {
    const response = await emailsApi.getUnread();
    return response.data.data?.items || [];
  } catch (error) {
    console.error('Error fetching unread emails from API:', error);
    throw error;
  }
};

export const getFlaggedEmails = async () => {
  try {
    const response = await emailsApi.getFlagged();
    return response.data.data?.items || [];
  } catch (error) {
    console.error('Error fetching flagged emails from API:', error);
    throw error;
  }
};

export const getEmailsWithAttachments = async () => {
  try {
    const response = await emailsApi.getWithAttachments();
    return response.data.data?.items || [];
  } catch (error) {
    console.error('Error fetching emails with attachments from API:', error);
    throw error;
  }
};

export const getPendingSyncEmails = async () => {
  try {
    const response = await emailsApi.getPendingSync();
    return response.data.data?.items || [];
  } catch (error) {
    console.error('Error fetching pending sync emails from API:', error);
    throw error;
  }
};

export const getSyncedEmails = async () => {
  try {
    const response = await emailsApi.getSynced();
    return response.data.data?.items || [];
  } catch (error) {
    console.error('Error fetching synced emails from API:', error);
    throw error;
  }
};

export const getEmailsByRelation = async (relationType, relationId) => {
  try {
    const response = await emailsApi.getByRelation(relationType, relationId);
    return response.data.data?.items || [];
  } catch (error) {
    console.error('Error fetching emails by relation from API:', error);
    throw error;
  }
};

export const getEmailsByContact = async (contactId) => {
  try {
    const response = await emailsApi.getByContact(contactId);
    return response.data.data?.items || [];
  } catch (error) {
    console.error('Error fetching emails by contact from API:', error);
    throw error;
  }
};

export const getEmailsBySender = async (senderEmail) => {
  try {
    const response = await emailsApi.getBySender(senderEmail);
    return response.data.data?.items || [];
  } catch (error) {
    console.error('Error fetching emails by sender from API:', error);
    throw error;
  }
};

export const getEmailsByConversation = async (conversationId) => {
  try {
    const response = await emailsApi.getByConversation(conversationId);
    return response.data.data?.items || [];
  } catch (error) {
    console.error('Error fetching emails by conversation from API:', error);
    throw error;
  }
};

export const getEmailsByActivityId = async (activityId) => {
  try {
    const response = await emailsApi.getAll({ activityId });
    return response.data.data?.items || response.data.data || [];
  } catch (error) {
    console.error('Error fetching emails by activity from API:', error);
    throw error;
  }
};

// Get enriched data with relationships from database
export const getEnrichedLead = async (leadId) => {
  try {
    const lead = await getLeadById(leadId);
    if (!lead) return null;

    const [assigneesResponse, activitiesResponse] = await Promise.all([
      getAssigneesByRelation('lead', leadId),
      getActivitiesByRelation('lead', leadId)
    ]);

    const assignees = await Promise.all(assigneesResponse.map(async (assignee) => ({
      ...assignee,
      user: await getUserByEmail(assignee.userEmail)
    })));

  const activities = await Promise.all(activitiesResponse.map(async (activity) => {
      const [participants, attachments, emails] = await Promise.all([
        getActivityParticipantsByActivityId(activity.id),
        getActivityAttachmentsByActivity(activity.id),
        getEmailsByActivityId(activity.id)
      ]);

      const enrichedParticipants = await Promise.all(participants.map(async (participant) => ({
        ...participant,
        contact: participant.userId ? await getContactById(participant.userId) : null,
        user: participant.userId ? await getUserById(participant.userId) : null
      })));

      return {
        ...activity,
        participants: enrichedParticipants,
        attachments,
        emails
      };
    }));

    // Use addresses from the lead response directly (now included by backend)
    const addresses = (lead.addresses || []).map(address => ({
      ...address,
      customer: address.customerId ? null : null, // Could enrich if needed
      contact: address.contactId ? null : null,   // Could enrich if needed
      deal: address.dealId ? null : null           // Could enrich if needed
    }));

    const [customer, contact, deal] = await Promise.all([
      lead.customerId ? getCustomerById(lead.customerId) : Promise.resolve(null),
      lead.contactId ? getContactById(lead.contactId) : Promise.resolve(null),
      lead.dealId ? getDealById(lead.dealId) : Promise.resolve(null),
    ]);

    return {
      ...lead,
      assignees,
      activities,
      customer,
      contact,
      deal,
      addresses
    };
  } catch (error) {
    console.error('Error fetching enriched lead:', error);
    throw error;
  }
};

export const getEnrichedCustomer = async (customerId) => {
  try {
    const customer = await getCustomerById(customerId);
    if (!customer) return null;

    const [contacts, deals, activitiesResponse] = await Promise.all([
      getContactsByCustomer(customerId),
      getDealsByCustomer(customerId),
      getActivitiesByRelation('customer', customerId)
    ]);

    const activities = await Promise.all(activitiesResponse.map(async (activity) => {
      const [participants, attachments, emails] = await Promise.all([
        getActivityParticipantsByActivityId(activity.id),
        getActivityAttachmentsByActivity(activity.id),
        getEmailsByActivityId(activity.id)
      ]);

      const enrichedParticipants = await Promise.all(participants.map(async (participant) => ({
        ...participant,
        contact: participant.userId ? await getContactById(participant.userId) : null,
        user: participant.userId ? await getUserById(participant.userId) : null
      })));

      return {
        ...activity,
        participants: enrichedParticipants,
        attachments,
        emails
      };
    }));

    return {
      ...customer,
      contacts,
      deals,
      activities
    };
  } catch (error) {
    console.error('Error fetching enriched customer:', error);
    throw error;
  }
};

// Helper function to get all activities for a deal including lead activities from database
const getDealActivitiesWithLeadActivities = async (dealId) => {
  try {
    const deal = await getDealById(dealId);
    if (!deal) return [];

    // Get deal activities and lead activities in parallel
    const [dealActivities, leadActivities] = await Promise.all([
      getActivitiesByRelation('deal', dealId),
      deal.leadId ? getActivitiesByRelation('lead', deal.leadId) : Promise.resolve([])
    ]);

    // Mark lead activities and combine
    const markedLeadActivities = leadActivities.map(activity => ({
      ...activity,
      fromLead: true // Mark as coming from lead
    }));

    // Combine, sort, and enrich activities
    const combined = [...dealActivities, ...markedLeadActivities].sort((a, b) =>
      new Date(b.createdOn) - new Date(a.createdOn)
    );

    return await Promise.all(combined.map(async (activity) => {
      const [participants, attachments, emails] = await Promise.all([
        getActivityParticipantsByActivityId(activity.id),
        getActivityAttachmentsByActivity(activity.id),
        getEmailsByActivityId(activity.id)
      ]);

      const enrichedParticipants = await Promise.all(participants.map(async (participant) => ({
        ...participant,
        contact: participant.userId ? await getContactById(participant.userId) : null,
        user: participant.userId ? await getUserById(participant.userId) : null
      })));

      return {
        ...activity,
        participants: enrichedParticipants,
        attachments,
        emails
      };
    }));
  } catch (error) {
    console.error('Error fetching deal activities with lead activities:', error);
    throw error;
  }
};

export const getEnrichedDeal = async (dealId) => {
  try {
    const deal = await getDealById(dealId);
    if (!deal) return null;

    const [assigneesResponse, activities, quotations, pipelineLogs] = await Promise.all([
      getAssigneesByRelation('deal', dealId),
      getDealActivitiesWithLeadActivities(dealId),
      getQuotationsByDeal(dealId),
      getPipelineLogsByDeal(dealId)
    ]);

    const assignees = await Promise.all(assigneesResponse.map(async (assignee) => ({
      ...assignee,
      user: await getUserByEmail(assignee.userEmail)
    })));

    const [customer, contact, lead] = await Promise.all([
      getCustomerById(deal.customerId),
      deal.contactId ? getContactById(deal.contactId) : Promise.resolve(null),
      deal.leadId ? getLeadById(deal.leadId) : Promise.resolve(null)
    ]);

    return {
      ...deal,
      customer,
      contact,
      lead,
      activities,
      quotations,
      pipelineLogs,
      assignees
    };
  } catch (error) {
    console.error('Error fetching enriched deal:', error);
    throw error;
  }
};

export const getEnrichedContact = async (contactId) => {
  try {
    const contact = await getContactById(contactId);
    if (!contact) return null;

    const [customer, activitiesResponse] = await Promise.all([
      getCustomerById(contact.customerId),
      getActivitiesByRelation('contact', contactId)
    ]);

    const activities = await Promise.all(activitiesResponse.map(async (activity) => {
      const [participants, attachments, emails] = await Promise.all([
        getActivityParticipantsByActivityId(activity.id),
        getActivityAttachmentsByActivity(activity.id),
        getEmailsByActivityId(activity.id)
      ]);

      const enrichedParticipants = await Promise.all(participants.map(async (participant) => ({
        ...participant,
        contact: participant.userId ? await getContactById(participant.userId) : null,
        user: participant.userId ? await getUserById(participant.userId) : null
      })));

      return {
        ...activity,
        participants: enrichedParticipants,
        attachments,
        emails
      };
    }));

    return {
      ...contact,
      customer,
      activities
    };
  } catch (error) {
    console.error('Error fetching enriched contact:', error);
    throw error;
  }
};

export const getEnrichedActivity = async (activityId) => {
  try {
    const activity = await getActivityById(activityId);
    if (!activity) return null;

    // Get the related entity based on relationType and relationId
    let relatedEntity = null;
    if (activity.relationType && activity.relationId) {
      switch (activity.relationType) {
        case 'lead':
          relatedEntity = await getLeadById(activity.relationId);
          break;
        case 'contact':
          relatedEntity = await getContactById(activity.relationId);
          break;
        case 'deal':
          relatedEntity = await getDealById(activity.relationId);
          break;
        case 'customer':
          relatedEntity = await getCustomerById(activity.relationId);
          break;
        default:
          relatedEntity = null;
      }
    }

    const [participants, attachments, emails] = await Promise.all([
      getActivityParticipantsByActivityId(activityId),
      getActivityAttachmentsByActivity(activityId),
      getEmailsByActivityId(activityId)
    ]);

    const enrichedParticipants = await Promise.all(participants.map(async (participant) => ({
      ...participant,
      contact: participant.userId ? await getContactById(participant.userId) : null,
      user: participant.userId ? await getUserById(participant.userId) : null
    })));

    return {
      ...activity,
      participants: enrichedParticipants,
      attachments,
      emails,
      relatedEntity
    };
  } catch (error) {
    console.error('Error fetching enriched activity:', error);
    throw error;
  }
};

export const getEnrichedEmail = async (emailId) => {
  try {
    const email = await getEmailById(emailId);
    if (!email) return null;

    // Get related entity based on potentialRelationType and potentialRelationId
    let relatedEntity = null;
    if (email.potentialRelationType && email.potentialRelationId) {
      switch (email.potentialRelationType) {
        case 'lead':
          relatedEntity = await getLeadById(email.potentialRelationId);
          break;
        case 'contact':
          relatedEntity = await getContactById(email.potentialRelationId);
          break;
        case 'deal':
          relatedEntity = await getDealById(email.potentialRelationId);
          break;
        case 'customer':
          relatedEntity = await getCustomerById(email.potentialRelationId);
          break;
        default:
          relatedEntity = null;
      }
    }

    const [matchedContact, syncedActivity] = await Promise.all([
      email.matchedUserId ? getContactById(email.matchedUserId) : Promise.resolve(null),
      email.syncedActivityId ? getActivityById(email.syncedActivityId) : Promise.resolve(null)
    ]);

    return {
      ...email,
      matchedContact,
      relatedEntity,
      syncedActivity
    };
  } catch (error) {
    console.error('Error fetching enriched email:', error);
    throw error;
  }
};

// Dashboard statistics from database
export const getDashboardStats = async () => {
  try {
    // Get all entities in parallel for better performance
    const [
      leadsResponse,
      customersResponse,
      dealsResponse,
      quotationsResponse,
      activitiesResponse,
      emailsResponse
    ] = await Promise.all([
      getLeads(),
      getCustomers(),
      getDeals(),
      getQuotations(),
      getActivities(),
      getEmails()
    ]);

    const leads = leadsResponse || [];
    const customers = customersResponse || [];
    const deals = dealsResponse || [];
    const quotations = quotationsResponse || [];
    const activities = activitiesResponse || [];
    const emails = emailsResponse || [];

    // Calculate statistics
    const leadsByStatus = leads.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {});

    const leadsBySource = leads.reduce((acc, lead) => {
      acc[lead.source] = (acc[lead.source] || 0) + 1;
      return acc;
    }, {});

    const customersByType = customers.reduce((acc, customer) => {
      acc[customer.type] = (acc[customer.type] || 0) + 1;
      return acc;
    }, {});

    const dealsByStage = deals.reduce((acc, deal) => {
      acc[deal.stage] = (acc[deal.stage] || 0) + 1;
      return acc;
    }, {});

    const quotationsByStatus = quotations.reduce((acc, quotation) => {
      acc[quotation.status] = (acc[quotation.status] || 0) + 1;
      return acc;
    }, {});

    const activitiesByType = activities.reduce((acc, activity) => {
      acc[activity.activityType] = (acc[activity.activityType] || 0) + 1;
      return acc;
    }, {});

    const activitiesByStatus = activities.reduce((acc, activity) => {
      acc[activity.status] = (acc[activity.status] || 0) + 1;
      return acc;
    }, {});

    const activitiesByPriority = activities.reduce((acc, activity) => {
      acc[activity.priority] = (acc[activity.priority] || 0) + 1;
      return acc;
    }, {});

    const emailsByImportance = emails.reduce((acc, email) => {
      acc[email.importance] = (acc[email.importance] || 0) + 1;
      return acc;
    }, {});

    const totalExpectedRevenue = deals.reduce((sum, deal) => sum + (deal.expectedRevenue || 0), 0);
    const totalActualRevenue = deals.reduce((sum, deal) => sum + (deal.actualRevenue || 0), 0);
    const totalQuotationValue = quotations.reduce((sum, quotation) => sum + (quotation.totalAmount || 0), 0);

    return {
      leads: {
        total: leads.length,
        byStatus: leadsByStatus,
        bySource: leadsBySource,
        converted: leads.filter(lead => lead.isConverted).length,
        averageScore: leads.length > 0 ? leads.reduce((sum, lead) => sum + (lead.score || 0), 0) / leads.length : 0
      },
      customers: {
        total: customers.length,
        byType: customersByType
      },
      deals: {
        total: deals.length,
        byStage: dealsByStage,
        totalExpectedRevenue,
        totalActualRevenue,
        averageExpectedDealSize: deals.length > 0 ? totalExpectedRevenue / deals.length : 0,
        averageActualDealSize: deals.length > 0 ? totalActualRevenue / deals.length : 0
      },
      quotations: {
        total: quotations.length,
        byStatus: quotationsByStatus,
        totalValue: totalQuotationValue,
        averageQuotationValue: quotations.length > 0 ? totalQuotationValue / quotations.length : 0
      },
      activities: {
        total: activities.length,
        byType: activitiesByType,
        byStatus: activitiesByStatus,
        byPriority: activitiesByPriority
      },
      emails: {
        total: emails.length,
        unread: emails.filter(email => !email.isRead).length,
        flagged: emails.filter(email => email.flag?.flagStatus === 'flagged').length,
        withAttachments: emails.filter(email => email.hasAttachments).length,
        syncedToActivity: emails.filter(email => email.activityId).length,
        pendingSync: emails.filter(email => !email.activityId).length,
        byImportance: emailsByImportance
      }
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};

export default {
  // Database API functions - no more mock data
  getLeads,
  getLeadById,
  getLeadsByStatus,
  getLeadsBySource,
  getActivities,
  getActivitiesByRelation,
  getActivitiesByStatus,
  getActivityById,
  createActivity,
  updateActivity,
  checkEmailsByConversation,
  getAssignees,
  getAssigneesByRelation,
  createAssignee,
  updateAssignee,
  deleteAssignee,
  getActivityParticipants,
  getActivityParticipantsByActivityId,
  getActivityParticipantsByContactId,
  getActivityParticipantsByUserId,
  getActivityParticipantsByRole,
  getActivityAttachments,
  getActivityAttachmentsByActivity,
  getUsers,
  getUserById,
  getCustomers,
  getCustomerById,
  getCustomersByType,
  getContacts,
  getContactById,
  getContactsByCustomer,
  getPrimaryContacts,
  getDeals,
  getDealById,
  getDealsByStage,
  getDealsByCustomer,
  createDeal,
  updateDeal,
  getQuotations,
  getQuotationById,
  getQuotationsByStatus,
  getQuotationsByDeal,
  getDealQuotations,
  getDealQuotationById,
  getDealQuotationsByDeal,
  getDealQuotationsByQuotation,
  createDealQuotation,
  bulkCreateDealQuotations,
  updateDealQuotation,
  deleteDealQuotation,
  getPipelineLogs,
  getPipelineLogById,
  getPipelineLogsByDeal,
  getPipelineLogsByStage,
  createPipelineLog,
  getEmails,
  getEmailById,
  getEmailsByImportance,
  getUnreadEmails,
  getFlaggedEmails,
  getEmailsWithAttachments,
  getPendingSyncEmails,
  getSyncedEmails,
  getEmailsByRelation,
  getEmailsByContact,
  getEmailsBySender,
  getEmailsByConversation,
  getEmailsByActivityId,
  getEnrichedLead,
  getEnrichedCustomer,
  getEnrichedContact,
  getEnrichedDeal,
  getEnrichedActivity,
  getEnrichedEmail,
  getDashboardStats,
  getDealActivitiesWithLeadActivities,
  getAddressesByRelation
};

// Function to create email record in crm_email table
export const createEmail = async (emailData) => {
  try {
    const emailPayload = {
      mailId: emailData.mailId,
      conversationId: emailData.conversationId || null,
      subject: emailData.subject || '',
      bodyPreview: emailData.bodyPreview || emailData.body?.substring(0, 500) || '',
      bodyContent: emailData.bodyContent || emailData.body || '',
      bodyContentType: emailData.bodyContentType || 'html',
      importance: emailData.importance || 'normal',
      hasAttachments: emailData.hasAttachments || false,
      isRead: emailData.isRead || false,
      isDraft: emailData.isDraft || false,
      fromName: emailData.fromName || emailData.from?.name || null,
      fromAddress: emailData.fromAddress || emailData.from?.emailAddress?.address || emailData.from?.address || null,
      senderName: emailData.senderName || emailData.sender?.name || null,
      senderAddress: emailData.senderAddress || emailData.sender?.emailAddress?.address || emailData.sender?.address || null,
      toRecipients: emailData.toRecipients ? (Array.isArray(emailData.toRecipients) ? JSON.stringify(emailData.toRecipients) : emailData.toRecipients) : null,
      ccRecipients: emailData.ccRecipients ? (Array.isArray(emailData.ccRecipients) ? JSON.stringify(emailData.ccRecipients) : emailData.ccRecipients) : null,
      bccRecipients: emailData.bccRecipients ? (Array.isArray(emailData.bccRecipients) ? JSON.stringify(emailData.bccRecipients) : emailData.bccRecipients) : null,
      replyTo: emailData.replyTo ? (typeof emailData.replyTo === 'object' ? JSON.stringify(emailData.replyTo) : emailData.replyTo) : null,
      receivedDateTime: emailData.receivedDateTime || emailData.receivedDate || null,
      sentDateTime: emailData.sentDateTime || emailData.sentDate || null,
      createdDateTime: emailData.createdDateTime || new Date().toISOString(),
      lastModifiedDateTime: emailData.lastModifiedDateTime || null,
      internetMessageId: emailData.internetMessageId || emailData.messageId || null,
      activityId: emailData.activityId || null,
    };

    const response = await emailsApi.create(emailPayload);
    return response.data.data; // Returns email ID
  } catch (error) {
    console.error('Error creating email:', error);
    throw error;
  }
};

// Function to update email record (especially to link with activityId)
export const updateEmail = async (emailId, emailData) => {
  try {
    const emailPayload = {
      conversationId: emailData.conversationId,
      subject: emailData.subject,
      bodyPreview: emailData.bodyPreview,
      bodyContent: emailData.bodyContent,
      bodyContentType: emailData.bodyContentType,
      importance: emailData.importance,
      hasAttachments: emailData.hasAttachments,
      isRead: emailData.isRead,
      isDraft: emailData.isDraft,
      fromName: emailData.fromName,
      fromAddress: emailData.fromAddress,
      senderName: emailData.senderName,
      senderAddress: emailData.senderAddress,
      toRecipients: emailData.toRecipients,
      ccRecipients: emailData.ccRecipients,
      bccRecipients: emailData.bccRecipients,
      replyTo: emailData.replyTo,
      receivedDateTime: emailData.receivedDateTime,
      sentDateTime: emailData.sentDateTime,
      lastModifiedDateTime: emailData.lastModifiedDateTime,
      internetMessageId: emailData.internetMessageId,
      activityId: emailData.activityId,
    };

    const response = await emailsApi.update(emailId, emailPayload);
    return response.data.data;
  } catch (error) {
    console.error('Error updating email:', error);
    throw error;
  }
};

// Function to find email by mailId in crm_email table
export const findEmailByMailId = async (mailId) => {
  try {
    if (!mailId) {
      console.log('findEmailByMailId: No mailId provided');
      return null;
    }

    // Use getAll with filter to find email by mailId
    const response = await emailsApi.getAll({ mailId: mailId });
    const emails = response.data.data?.items || response.data.data || [];

    return emails.find(email => email.mailId === mailId) || null;
  } catch (error) {
    console.error('Error finding email by mailId:', error);
    return null;
  }
};

// Function to find email by conversationId and activityId
export const findEmailByConversationAndActivity = async (conversationId, activityId) => {
  try {
    const response = await emailsApi.getByConversation(conversationId);
    const emails = response.data.data?.items || response.data.data || [];
    return emails.find(email => email.conversationId === conversationId && email.activityId === activityId) || null;
  } catch (error) {
    console.error('Error finding email by conversation and activity:', error);
    return null;
  }
};

// ==== Appointments (crm_appointment) ====
export const createAppointment = async (appointmentData) => {
  try {
    const payload = {
      mailId: appointmentData.mailId || null,
      iCalUId: appointmentData.iCalUId || null,
      conversationId: appointmentData.conversationId || null,
      subject: appointmentData.subject || '',
      bodyPreview: appointmentData.bodyPreview || appointmentData.bodyContent?.substring?.(0, 500) || '',
      bodyContent: appointmentData.bodyContent || '',
      bodyContentType: appointmentData.bodyContentType || 'html',
      organizerName: appointmentData.organizerName || null,
      organizerAddress: appointmentData.organizerAddress || null,
      attendees: appointmentData.attendees ? (Array.isArray(appointmentData.attendees) ? JSON.stringify(appointmentData.attendees) : appointmentData.attendees) : null,
      startDateTime: appointmentData.startDateTime,
      endDateTime: appointmentData.endDateTime || null,
      startTimeZone: appointmentData.startTimeZone || null,
      endTimeZone: appointmentData.endTimeZone || null,
      durationMinutes: appointmentData.durationMinutes || null,
      locationName: appointmentData.locationName || null,
      locationAddress: appointmentData.locationAddress || null,
      isOnlineMeeting: Boolean(appointmentData.isOnlineMeeting),
      joinUrl: appointmentData.joinUrl || null,
      platform: appointmentData.platform || null,
      showAs: appointmentData.showAs || null,
      importance: appointmentData.importance || 'normal',
      status: appointmentData.status || null,
      hasAttachments: appointmentData.hasAttachments || false,
      lastModifiedDateTime: appointmentData.lastModifiedDateTime || null,
      activityId: appointmentData.activityId || null,
    };

    const response = await appointmentsApi.create(payload);
    return response.data.data;
  } catch (error) {
    console.error('Error creating appointment:', error);
    throw error;
  }
};

export const updateAppointment = async (appointmentId, appointmentData) => {
  try {
    const payload = {
      mailId: appointmentData.mailId || null,
      iCalUId: appointmentData.iCalUId || null,
      conversationId: appointmentData.conversationId || null,
      subject: appointmentData.subject || '',
      bodyPreview: appointmentData.bodyPreview || appointmentData.bodyContent?.substring?.(0, 500) || '',
      bodyContent: appointmentData.bodyContent || '',
      bodyContentType: appointmentData.bodyContentType || 'html',
      organizerName: appointmentData.organizerName || null,
      organizerAddress: appointmentData.organizerAddress || null,
      attendees: appointmentData.attendees ? (Array.isArray(appointmentData.attendees) ? JSON.stringify(appointmentData.attendees) : appointmentData.attendees) : null,
      startDateTime: appointmentData.startDateTime || null,
      endDateTime: appointmentData.endDateTime || null,
      startTimeZone: appointmentData.startTimeZone || null,
      endTimeZone: appointmentData.endTimeZone || null,
      durationMinutes: appointmentData.durationMinutes || null,
      locationName: appointmentData.locationName || null,
      locationAddress: appointmentData.locationAddress || null,
      isOnlineMeeting: Boolean(appointmentData.isOnlineMeeting),
      joinUrl: appointmentData.joinUrl || null,
      platform: appointmentData.platform || null,
      showAs: appointmentData.showAs || null,
      importance: appointmentData.importance || 'normal',
      status: appointmentData.status || null,
      hasAttachments: appointmentData.hasAttachments || false,
      lastModifiedDateTime: appointmentData.lastModifiedDateTime || null,
      activityId: appointmentData.activityId || null,
    };

    const response = await appointmentsApi.update(appointmentId, payload);
    return response.data.data;
  } catch (error) {
    console.error('Error updating appointment:', error);
    throw error;
  }
};

export const findAppointmentByMailId = async (mailId) => {
  try {
    if (!mailId) return null;
    const response = await appointmentsApi.getAll({ mailId });
    const items = response.data.data?.items || response.data.data || [];
    return items.find(item => item.mailId === mailId) || null;
  } catch (error) {
    console.error('Error finding appointment by mailId:', error);
    return null;
  }
};
