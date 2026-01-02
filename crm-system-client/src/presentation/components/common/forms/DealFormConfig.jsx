import {
  Business as BusinessIcon,
  Person as PersonIcon,
  PersonAdd as PersonAddIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  TrendingUp as TrendingUpIcon,
  Flag as FlagIcon,
  AttachMoney as MoneyIcon,
  Event as EventIcon,
  Notes as NotesIcon,
} from '@mui/icons-material';
import { DEAL_STAGES, DEAL_SOURCES_CREATE } from '../../../../utils/constants';
import React from 'react';
import { ContactFormConfig } from './ContactFormConfig';
import { CustomerFormConfig } from './CustomerFormConfig';
import { useCustomers, getCustomerOptions } from '@presentation/hooks/useCustomers';
import { useContacts, getContactOptions } from '@presentation/hooks/useContacts';
import { useUsers, getUserOptions } from '@presentation/hooks/useUsers';

/**
 * Deal Form Configuration
 * Defines the structure and behavior of the deal creation/editing form
 */
export const DealFormConfig = {
  title: "Create New Deal",

  // Configuration for creation capabilities
  canCreate: {
    customer: false, // Allow creating new customers
    contact: false,  // Allow creating new contacts
  },

  // Initial form data
  initialData: {
    name: '',
    description: '',
    expectedRevenue: '',
    actualRevenue: '',
    closeDate: '',
    stage: 'Prospecting',
    note: '',
    customerId: '',
    contactId: '',
    ownerId: '',
    customerSelection: 'create_new',
    contactSelection: '',
  },

  // Derive form data when fields change
  deriveFormData: (data, changedField) => {
    if (changedField === 'customerSelection') {
      return {
        ...data,
        contactSelection: '',
        contactId: '',
        newContactData: undefined,
      };
    }
    return data;
  },

  // Form sections
  sections: [
    {
      id: 'customer-contact',
      title: 'General Information',
      icon: PersonIcon,
      fields: [
        {
          name: 'customerSelection',
          label: 'Customer',
          type: 'autocomplete',
          required: true,
          canCreate: false, // Disable create-new option - existing customers only
          options: [], // Will be set dynamically by DealFormConfigWrapper
          grid: { xs: 12, sm: 12, md: 12, lg: 6 },
          helperText: 'Select an existing customer (required)'
        },
        {
          name: 'contactSelection',
          label: 'Primary Contact',
          type: 'autocomplete',
          required: false, // Contact is optional
          canCreate: false, // Disable create-new option - existing contacts only
          options: [], // Will be set dynamically by DealFormConfigWrapper
          grid: { xs: 12, sm: 12, md: 12, lg: 6 },
          helperText: 'Select a contact (optional)'
        },
      ]
    },
    {
      id: 'deal-info',
      title: 'Deal Information',
      icon: BusinessIcon,
      fields: [
        {
          name: 'name',
          label: 'Deal Name',
          type: 'text',
          required: true,
          icon: BusinessIcon,
          grid: { xs: 12, sm: 12, md: 12, lg: 12 },
          helperText: 'Enter a descriptive name for this deal'
        },
        {
          name: 'expectedRevenue',
          label: 'Expected Revenue',
          type: 'number',
          required: false,
          icon: MoneyIcon,
          grid: { xs: 12, sm: 12, md: 12, lg: 6 },
          helperText: 'Estimated deal value (e.g., 50000.00)'
        },
        {
          name: 'closeDate',
          label: 'Expected Close Date',
          type: 'date',
          required: false,
          icon: EventIcon,
          grid: { xs: 12, sm: 12, md: 12, lg: 6 },
          helperText: 'When do you expect to close this deal?'
        },
        {
          name: 'description',
          label: 'Description',
          type: 'textarea',
          required: false,
          rows: 3,
          icon: NotesIcon,
          grid: { xs: 12, sm: 12, md: 12, lg: 12 },
          helperText: 'Describe the deal opportunity and requirements'
        },
      ]
    },
    {
      id: 'deal-details',
      title: 'Deal Details',
      icon: TrendingUpIcon,
      fields: [
        {
          name: 'stage',
          label: 'Deal Stage',
          type: 'autocomplete',
          required: true,
          icon: FlagIcon,
          options: DEAL_STAGES.map(stage => ({
            value: stage.value,
            label: stage.label,
          })),
          grid: { xs: 12, sm: 12, md: 12, lg: 6 }
        },
        {
          name: 'ownerId',
          label: 'Deal Owner',
          type: 'autocomplete',
          required: true,
          icon: PersonAddIcon,
          options: [], // Will be set dynamically by DealFormConfigWrapper
          helperText: 'Select the sales user who owns this deal',
          grid: { xs: 12, sm: 12, md: 12, lg: 6 }
        },
        {
          name: 'actualRevenue',
          label: 'Actual Revenue',
          type: 'text',
          required: false,
          icon: MoneyIcon,
          grid: { xs: 12, sm: 12, md: 12, lg: 6 },
          helperText: 'Actual deal value when closed (leave empty if not closed)',
          conditional: {
            field: 'stage',
            value: 'Closed Won'
          }
        },
        {
          name: 'note',
          label: 'Additional Notes',
          type: 'textarea',
          required: false,
          rows: 3,
          placeholder: 'Add any additional notes about this deal...',
          icon: NotesIcon,
          grid: { xs: 12, sm: 12, md: 12, lg: 12 }
        }
      ]
    }
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
 * Transform form data to deal object with associated contact and customer
 * @param {Object} formData - Form data from BaseForm
 * @returns {Object} - Object containing deal, contact, and customer (or null if using existing)
 */
export const transformDealData = (formData) => {
  let contact = null;
  let customer = null;

  // Create contact from nested form data if user chose to create new
  if (formData.contactSelection === 'create_new' && formData.newContactData) {
    contact = createContactFromNestedData(formData.newContactData);
  }

  // Create customer from dialog data if user chose to create new
  if (formData.customerSelection === 'create_new' && formData.newCustomerData) {
    customer = createCustomerFromDialogData(formData.newCustomerData);
  }

  // Create deal object - only include fields expected by the API (PascalCase)
  const deal = {
    name: formData.name || '',
    description: formData.description || null,
    expectedRevenue: formData.expectedRevenue ? parseFloat(formData.expectedRevenue) : null,
    actualRevenue: formData.actualRevenue ? parseFloat(formData.actualRevenue) : null,
    closeDate: formData.closeDate && formData.closeDate.trim() !== '' ? formData.closeDate : null,
    source: formData.source || null,
    stage: formData.stage || 'Prospecting',
    note: formData.note || null,
    ownerId: formData.ownerId ? parseInt(formData.ownerId) : null,
    customerId: customer ? customer.id : (formData.customerSelection !== 'create_new' ? formData.customerSelection : null),
    contactId: contact ? contact.id : (formData.contactSelection !== 'create_new' ? formData.contactSelection : null),
  };

  return {
    deal,
    contact, // null if using existing contact
    customer // null if using existing customer
  };
};

/**
 * DealFormConfigWrapper - Component wrapper to use hooks
 * Provides dynamic customer, contact, and user options from API
 */
export const DealFormConfigWrapper = () => {
  const { customers, loading: customersLoading, error: customersError } = useCustomers();
  const { contacts, loading: contactsLoading, error: contactsError } = useContacts();
  const { users, loading: usersLoading, error: usersError } = useUsers();

  const config = {
    ...DealFormConfig,
    sections: DealFormConfig.sections.map(section => ({
      ...section,
      fields: section.fields.map(field => {
        if (field.name === 'contactSelection') {
          return {
            ...field,
            options: (formData) => {
              const baseOptions = []; // No create-new option since canCreate.contact is false

              // Always include the current selected value (fallback even if not in dataset)
              let additionalOptions = [];
              if (formData?.contactSelection && formData.contactSelection !== 'create_new') {
                const currentContact = contacts.find(c => c.id.toString() === formData.contactSelection);
                const label = currentContact
                  ? `${currentContact.firstName} ${currentContact.lastName} (${currentContact.email})`
                  : `Selected Contact (#${formData.contactSelection})`;
                additionalOptions = [{
                  value: formData.contactSelection.toString(),
                  label
                }];
              }

              if (contactsLoading) {
                return [
                  ...baseOptions,
                  ...additionalOptions,
                  { value: '', label: 'Loading contacts...', disabled: true }
                ];
              }

              if (contactsError) {
                return [
                  ...baseOptions,
                  ...additionalOptions,
                  { value: '', label: 'Failed to load contacts', disabled: true }
                ];
              }

              // Filter contacts by selected customer
              let filteredContacts = contacts;
              if (formData?.customerSelection && formData.customerSelection !== 'create_new' && formData.customerSelection !== null) {
                // If existing customer selected, filter contacts by customerId
                filteredContacts = contacts.filter(contact =>
                  contact.customerId && contact.customerId.toString() === formData.customerSelection.toString()
                );
              } else {
                // Show all contacts when no customer is selected
                filteredContacts = contacts;
              }

              const contactOptions = getContactOptions(filteredContacts);
              // Remove duplicate if current selection is already in contactOptions
              const filteredContactOptions = additionalOptions.length > 0
                ? contactOptions.filter(option => option.value !== additionalOptions[0].value)
                : contactOptions;

              const allOptions = [
                ...baseOptions,
                ...additionalOptions,
                ...filteredContactOptions
              ];

              return allOptions;
            }
          };
        }

        if (field.name === 'customerSelection') {
          return {
            ...field,
            options: (formData) => {
              const baseOptions = []; // No create-new option since canCreate.customer is false

              // Always include the current selected value (fallback even if not in dataset)
              let additionalOptions = [];
              if (formData?.customerSelection && formData.customerSelection !== 'create_new') {
                const currentCustomer = customers.find(c => c.id.toString() === formData.customerSelection);
                const label = currentCustomer
                  ? `${currentCustomer.name} (${currentCustomer.domain})`
                  : `Selected Customer (#${formData.customerSelection})`;
                additionalOptions = [{
                  value: formData.customerSelection.toString(),
                  label
                }];
              }

              if (customersLoading) {
                return [
                  ...baseOptions,
                  ...additionalOptions,
                  { value: '', label: 'Loading customers...', disabled: true }
                ];
              }

              if (customersError) {
                return [
                  ...baseOptions,
                  ...additionalOptions,
                  { value: '', label: 'Failed to load customers', disabled: true }
                ];
              }

              const customerOptions = getCustomerOptions(customers);
              // Remove duplicate if current selection is already in customerOptions
              const filteredCustomerOptions = additionalOptions.length > 0
                ? customerOptions.filter(option => option.value !== additionalOptions[0].value)
                : customerOptions;

              const allOptions = [
                ...baseOptions,
                ...additionalOptions,
                ...filteredCustomerOptions
              ];

              return allOptions;
            }
          };
        }

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

        return field;
      })
    }))
  };

  return config;
};
