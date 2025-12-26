import React from 'react';
import {
  Person as PersonIcon,
  PersonAdd as PersonAddIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
  Language as LanguageIcon,
  TrendingUp as TrendingUpIcon,
  Flag as FlagIcon,
  Source as SourceIcon,
  Notes as NotesIcon,
  Event as EventIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { LEAD_SOURCES_CREATE, LEAD_STATUSES_CREATE, ADDRESS_TYPES } from '../../../../utils/constants';
import { useCustomers } from '@presentation/hooks/useCustomers';
import { useContacts } from '@presentation/hooks/useContacts';
import { useUsers, getUserOptions } from '@presentation/hooks/useUsers';
import { COUNTRY_OPTIONS } from '@utils/constants_contry';
import leadScoreApi from '@infrastructure/api/leadScoreApi';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[0-9\s().-]{7,}$/;

const clampScore = (value) => Math.max(0, Math.min(100, Math.round(value || 0)));

// Module-level cache for lead score rules
let cachedRules = null;

/**
 * Set cached rules (called by useLeadScoreRules hook)
 * @param {Array} rules - Active rules from database
 */
const setCachedRules = (rules) => {
  cachedRules = rules;
};

/**
 * Get cached rules
 * @returns {Array|null} - Cached rules or null if not loaded
 */
const getCachedRules = () => {
  return cachedRules;
};

/**
 * Clear the rules cache (useful when rules are updated)
 */
export const clearLeadScoreRulesCache = () => {
  cachedRules = null;
};

/**
 * Custom hook to load and cache lead score rules
 * Call this hook in components that need to calculate scores (e.g., CreateLead)
 * @returns {Object} - { rules, loading, error }
 */
export const useLeadScoreRules = () => {
  const { useState, useEffect } = React;
  const [rules, setRules] = useState(getCachedRules());
  const [loading, setLoading] = useState(!getCachedRules());
  const [error, setError] = useState(null);

  useEffect(() => {
    // If already cached, use cache
    if (getCachedRules()) {
      setRules(getCachedRules());
      setLoading(false);
      return;
    }

    // Otherwise, fetch from API
    const fetchRules = async () => {
      try {
        setLoading(true);
        const response = await leadScoreApi.getActiveRules();
        const fetchedRules = response?.data?.data || [];
        
        // Cache the rules
        setCachedRules(fetchedRules);
        setRules(fetchedRules);
        setError(null);
      } catch (err) {
        console.error('Failed to load lead score rules:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRules();
  }, []);

  return { rules, loading, error };
};

/**
 * Calculate lead score using cached rules
 * Make sure to call useLeadScoreRules() hook before using this function
 * @param {Object} data - Lead data
 * @returns {number} - Calculated score (0-100)
 */
export const calculateLeadScore = (data = {}) => {
  const rules = getCachedRules();
  
  if (!rules || rules.length === 0) {
    console.warn('Lead score rules not loaded. Call useLeadScoreRules() hook first.');
    return 0;
  }

  let totalScore = 0;

  // For each active rule, check if field has value
  rules.forEach(rule => {
    const fieldName = rule.fieldName;
    const fieldValue = data[fieldName];

    // Check if field has value (not null, not empty, not whitespace)
    const hasValue = fieldValue != null && 
                    (typeof fieldValue === 'string' ? fieldValue.trim() !== '' : true);

    if (hasValue) {
      totalScore += rule.score;
    }
  });

  return clampScore(totalScore);
};

export const canConvertLead = (score) => {
  return (score || 0) >= 70;
};

const applyAutoLeadScore = (data = {}) => {
  if (!data) {
    return data;
  }

  const computedScore = calculateLeadScore(data);
  if (data.score === computedScore) {
    return data;
  }

  // If the new score is below 75, ensure isConverted is false
  const shouldResetConversion = !canConvertLead(computedScore);

  return {
    ...data,
    score: computedScore,
    ...(shouldResetConversion && { isConverted: false }),
  };
};
// Note: applyAutoLeadScore removed - score calculation is now async and handled separately

const extractDomainFromEmail = (email = '') => {
  const cleaned = (email || '').trim();
  if (!cleaned || !cleaned.includes('@')) {
    return '';
  }

  const [, domain = ''] = cleaned.split('@');
  return domain.trim().toLowerCase();
};

const buildCompanyNameFromDomain = (domain = '') => {
  const cleaned = (domain || '').trim();
  if (!cleaned) {
    return '';
  }

  const prefix = cleaned.split('.')[0] || '';
  if (!prefix) {
    return '';
  }

  return prefix
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

/**
 * Derive lead form data based on field changes (synchronous)
 * Score calculation is done separately and asynchronously
 * @param {Object} data - Current form data
 * @param {string} changedField - Field that was changed
 * @returns {Object} - Updated form data
 */
export const deriveLeadFormData = (data = {}, changedField) => {
  if (!data) {
    return data;
  }

  let nextData = { ...data };

  if (changedField === 'email') {
    const domainFromEmail = extractDomainFromEmail(nextData.email);
    if (domainFromEmail) {
      nextData.website = domainFromEmail;

      const companyFromDomain = buildCompanyNameFromDomain(domainFromEmail);
      if (companyFromDomain) {
        nextData.company = companyFromDomain;
      }
    }
  }

  return applyAutoLeadScore(nextData);
};

/**
 * Configuration for Lead Form
 * Defines the structure and behavior of the lead creation/editing form
 */
export const LeadFormConfig = {
  title: "Create New Lead",

  // Configuration for creation capabilities
  canCreate: {
    customer: true, // Allow creating new customers
    contact: true,  // Allow creating new contacts
  },

  // Initial form data
  initialData: {
    email: '',
    telephoneNo: '',
    company: '',
    website: '',
    country: '',
    vatNumber: '',
    source: 'web',
    status: 'working',
    score: 0, // Will be calculated using rules from database
    note: '',
    ownerId: '',
    followUpDate: '',
    // Address array for multiple addresses
    addresses: []
  },
  deriveFormData: deriveLeadFormData,

  // Form sections
  sections: [
    {
      id: 'general-info',
      title: 'General Information',
      icon: PersonIcon,
      fields: [
        {
          name: 'email',
          label: 'Email',
          type: 'email',
          required: true,
          icon: EmailIcon,
          grid: { xs: 12, sm: 12, md: 12, lg: 4 },
          helperText: 'Contact email address'
        },
        {
          name: 'telephoneNo',
          label: 'Telephone No',
          type: 'text',
          required: false,
          icon: PhoneIcon,
          grid: { xs: 12, sm: 12, md: 12, lg: 4 },
          helperText: 'Contact telephone number'
        },
        {
          name: 'website',
          label: 'Website',
          type: 'text',
          required: false,
          icon: LanguageIcon,
          grid: { xs: 12, sm: 12, md: 12, lg: 4 },
          helperText: 'Company website (e.g., example.com)'
        },
        {
          name: 'company',
          label: 'Company',
          type: 'text',
          required: true,
          icon: BusinessIcon,
          grid: { xs: 12, sm: 12, md: 12, lg: 4 },
          helperText: 'Company name'
        },
        {
          name: 'vatNumber',
          label: 'VAT Number',
          type: 'text',
          required: false,
          icon: AssignmentIcon,
          grid: { xs: 12, sm: 12, md: 12, lg: 4 },
          helperText: 'Company VAT / Tax ID'
        },
        {
          name: 'paymentTerms',
          label: 'Payment Terms',
          type: 'text',
          required: false,
          grid: { xs: 12, sm: 12, md: 12, lg: 4 },
          helperText: 'e.g., NET 30, TT, CAD'
        },
        {
          name: 'country',
          label: 'Country (ISO 3)',
          type: 'autocomplete',
          required: false,
          options: COUNTRY_OPTIONS,
          grid: { xs: 12, sm: 12, md: 12, lg: 4 },
          helperText: 'ISO 3166-1 alpha-3 code, e.g. DNK'
        },
      ]
    },
    {
      id: 'lead-details',
      title: 'Lead Details',
      icon: TrendingUpIcon,
      fields: [
        {
          name: 'score',
          label: 'Lead Score',
          type: 'slider',
          min: 0,
          max: 100,
          step: 5,
          marks: [
            { value: 0, label: '0' },
            { value: 25, label: '25' },
            { value: 50, label: '50' },
            { value: 75, label: '75' },
            { value: 100, label: '100' },
          ],
          icon: TrendingUpIcon,
          getColor: (score) => {
            if (score >= 70) return '#22c55e';
            if (score >= 40) return '#f59e0b';
            return '#ef4444';
          },
          getLabel: (score) => {
            if (score >= 70) return 'High Quality';
            if (score >= 40) return 'Medium Quality';
            return 'Low Quality';
          },
          hint: 'Higher scores indicate better quality leads with higher conversion potential',
          helperText: 'Automatically calculated based on lead details',
          disabled: true,
          grid: { xs: 12, sm: 12, md: 12, lg: 4 }
        },
        {
          name: 'source',
          label: 'Lead Source',
          type: 'select',
          required: false,
          icon: SourceIcon,
          options: LEAD_SOURCES_CREATE,
          grid: { xs: 12, sm: 12, md: 12, lg: 4 }
        },
        {
          name: 'followUpDate',
          label: 'Follow-up Date',
          type: 'date',
          required: false,
          icon: EventIcon,
          helperText: 'Set a date for follow-up activities',
          grid: { xs: 12, sm: 12, md: 12, lg: 4 }
        },
        {
          name: 'ownerId',
          label: 'Owner (Sales User)',
          type: 'autocomplete',
          required: true,
          icon: PersonAddIcon,
          options: [], // Will be set dynamically by LeadFormConfigWrapper
          helperText: 'Select the sales user who will own this lead',
          grid: { xs: 12, sm: 12, md: 12, lg: 4 }
        },
        {
          name: 'note',
          label: 'Notes',
          type: 'textarea',
          required: false,
          rows: 3,
          placeholder: 'Add any additional notes about this lead...',
          icon: NotesIcon,
          grid: { xs: 12, sm: 12, md: 12, lg: 8 }
        }
      ]
    },
    {
      id: 'address-info',
      title: 'Address Information',
      icon: BusinessIcon,
      fields: [
        {
          name: 'addresses',
          label: 'Addresses',
          type: 'array',
          required: false,
          grid: { xs: 12, sm: 12, md: 12, lg: 12 },
          addButtonLabel: 'Add Address',
          itemFields: [
            {
              name: 'addressType',
              label: 'Address Type',
              type: 'select',
              required: true,
              defaultValue: 'legal',
              options: ADDRESS_TYPES,
              grid: { xs: 12, sm: 12, md: 12, lg: 6 },
            },
            {
              name: 'isPrimary',
              label: 'Primary Address',
              type: 'checkbox',
              required: false,
              grid: { xs: 12, sm: 12, md: 12, lg: 6 },
            },
            {
              name: 'companyName',
              label: 'Company Name',
              type: 'text',
              required: false,
              grid: { xs: 12, sm: 12, md: 12, lg: 6 },
            },
            {
              name: 'addressLine',
              label: 'Address Line',
              type: 'text',
              required: false,
              grid: { xs: 12, sm: 12, md: 12, lg: 6 },
            },
            {
              name: 'postcode',
              label: 'Postcode',
              type: 'text',
              required: false,
              grid: { xs: 12, sm: 6, md: 6, lg: 3 },
            },
            {
              name: 'city',
              label: 'City',
              type: 'text',
              required: false,
              grid: { xs: 12, sm: 6, md: 6, lg: 3 },
            },
            {
              name: 'country',
              label: 'Country',
              type: 'autocomplete',
              required: false,
              options: COUNTRY_OPTIONS,
              grid: { xs: 12, sm: 6, md: 6, lg: 5 },
            },
            {
              name: 'contactPerson',
              label: 'Contact Person',
              type: 'text',
              required: false,
              grid: { xs: 12, sm: 6, md: 6, lg: 6 },
            },
            {
              name: 'email',
              label: 'Email',
              type: 'email',
              required: false,
              grid: { xs: 12, sm: 6, md: 6, lg: 6 },
            },
            {
              name: 'telephoneNo',
              label: 'Telephone',
              type: 'text',
              required: false,
              grid: { xs: 12, sm: 6, md: 6, lg: 6 },
            },
            {
              name: 'portOfDestination',
              label: 'Port of Destination',
              type: 'text',
              required: false,
              grid: { xs: 12, sm: 6, md: 6, lg: 6 },
            },
          ]
        }
      ]
    },
  ],

  // Action buttons configuration
  actions: {
    cancel: {
      label: 'Cancel'
    },
    submit: {
      label: 'Save',
      gradient: 'linear-gradient(135deg, #586a68 0%, #4e605e 100%)',
      hoverGradient: 'linear-gradient(135deg, #4e605e 0%, #434f4e 100%)'
    }
  }
};

/**
 * Create contact object from nested form data
 * @param {Object} contactData - Contact form data from nested form
 * @returns {Object} - Contact object
 */
const createContactFromNestedData = (contactData) => {
  return {
    id: Date.now() + Math.random(), // Temporary unique ID
    firstName: contactData.firstName,
    lastName: contactData.lastName,
    email: contactData.email,
    phone: contactData.phone,
    company: contactData.company,
    notes: contactData.notes,
    createdOn: new Date().toISOString(),
    updatedOn: new Date().toISOString(),
    createdBy: 'current_user@crm.com',
    isActive: true
  };
};

/**
 * Create customer object from dialog form data
 * @param {Object} customerData - Customer form data from dialog
 * @returns {Object} - Customer object
 */
const createCustomerFromDialogData = (customerData) => {
  return {
    id: Date.now() + Math.random() + 1, // Temporary unique ID
    name: customerData.name,
    domain: customerData.domain,
    email: customerData.email,
    phone: customerData.phone,
    address: customerData.address,
    city: customerData.city,
    country: customerData.country,
    notes: customerData.notes,
    createdOn: new Date().toISOString(),
    updatedOn: new Date().toISOString(),
    createdBy: 'current_user@crm.com',
    isActive: true
  };
};


/**
 * Transform form data to lead object with associated contact, customer, and activity
 * @param {Object} formData - Form data from BaseForm
 * @returns {Object} - Object containing lead, contact, customer, and activity
 */
export const transformLeadData = (formData) => {
  let contact = null;
  let customer = null;
  
  // Calculate score using cached rules (synchronous)
  const computedScore = calculateLeadScore(formData);

  // Always create contact from nested form data if available
  if (formData.new_contact_data) {
    contact = createContactFromNestedData(formData.new_contact_data);
  }

  // Create customer from dialog data if available
  if (formData.new_customer_data) {
    customer = createCustomerFromDialogData(formData.new_customer_data);
  }

  const addresses = buildAddressesFromForm(formData);

  // Create lead object
  const lead = {
    ...formData,
    addresses,
    id: Date.now(), // Temporary ID
    ownerId: formData.ownerId ? parseInt(formData.ownerId) : null, // Use selected owner
    score: computedScore, // Calculated using rules from database (client-side)
    isConverted: false,
    convertedAt: null,
    customerId: customer ? customer.id : null,
    contactId: contact ? contact.id : null,
    dealId: null,
    createdOn: new Date().toISOString(),
    updatedOn: new Date().toISOString(),
    createdBy: 'current_user@crm.com' // Should come from auth context
  };

  return {
    lead,
    contact,
    customer, // null if using existing customer
    activity: null   // Activity is now created separately
  };
};

export const buildAddressesFromForm = (formData) => {
  // Addresses are now managed as an array directly in the form
  return formData.addresses || [];
};

/**
 * LeadFormConfigWrapper - Component wrapper to use hooks
 * Provides dynamic customer options from API
 */
export const LeadFormConfigWrapper = () => {
  const { customers, loading: customersLoading, error: customersError } = useCustomers();
  const { contacts, loading: contactsLoading, error: contactsError } = useContacts();
  const { users, loading: usersLoading, error: usersError } = useUsers();

  const config = {
    ...LeadFormConfig,
    sections: LeadFormConfig.sections.map(section => ({
      ...section,
      // Preserve fields for normal sections; for sections with subSections, transform fields inside subSections
      fields: (section.fields || []).map(field => {


        if (field.name === 'ownerId') {
          return {
            ...field,
            options: (formData) => {
              if (usersLoading) {
                return [
                  { value: '', label: 'Loading users...', disabled: true }
                ];
              }

              if (usersError) {
                return [
                  { value: '', label: 'Failed to load users', disabled: true }
                ];
              }

              const userOptions = getUserOptions(users);
              return userOptions;
            }
          };
        }

        if (field.name === 'assignedTo') {
          return {
            ...field,
            options: (formData) => {
              if (usersLoading) {
                return [
                  { value: '', label: 'Loading users...', disabled: true }
                ];
              }

              if (usersError) {
                return [
                  { value: '', label: 'Failed to load users', disabled: true }
                ];
              }

              const userOptions = getUserOptions(users);
              return userOptions;
            }
          };
        }

        return field;
      }),
      subSections: (section.subSections || []).map(sub => ({
        ...sub,
        fields: (sub.fields || []).map(field => {
          if (field.name === 'ownerId' || field.name === 'assignedTo') {
            // ownerId / assignedTo only live in non-address sections today, but keep logic symmetric
            if (field.name === 'ownerId') {
              return {
                ...field,
                options: () => {
                  if (usersLoading) {
                    return [{ value: '', label: 'Loading users...', disabled: true }];
                  }
                  if (usersError) {
                    return [{ value: '', label: 'Failed to load users', disabled: true }];
                  }
                  return getUserOptions(users);
                }
              };
            }

            if (field.name === 'assignedTo') {
              return {
                ...field,
                options: () => {
                  if (usersLoading) {
                    return [{ value: '', label: 'Loading users...', disabled: true }];
                  }
                  if (usersError) {
                    return [{ value: '', label: 'Failed to load users', disabled: true }];
                  }
                  return getUserOptions(users);
                }
              };
            }
          }

          return field;
        })
      }))
    }))
  };

  return config;
};
