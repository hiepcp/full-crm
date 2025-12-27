import {
  Person as PersonIcon,
  PersonAdd as PersonAddIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
  LocationOn as LocationOnIcon,
  Notes as NotesIcon,
  Badge as BadgeIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { useCustomers } from '@presentation/hooks/useCustomers';
import { useUsers, getUserOptions } from '@presentation/hooks/useUsers';
import { isDefined } from '~/@mui/x-charts/internals';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[0-9\s().-]{7,}$/;

const SALUTATION_OPTIONS = [
  { value: 'Mr.', label: 'Mr.' },
  { value: 'Mrs.', label: 'Mrs.' },
  { value: 'Ms.', label: 'Ms.' },
  { value: 'Dr.', label: 'Dr.' },
  { value: 'Prof.', label: 'Prof.' },
];

/**
 * Configuration for Contact Form
 * Defines the structure and behavior of the contact creation/editing form
 */
export const ContactFormConfig = {
  title: "Create New Contact",

  // Initial form data
  initialData: {
    customerId: '',
    salutation: '',
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    phone: '',
    mobilePhone: '',
    fax: '',
    jobTitle: '',
    address: '',
    ownerId: '',
    notes: '',
    isPrimary: false,
  },

  // Form sections
  sections: [
    {
      id: 'basic-info',
      title: 'Basic Information',
      icon: PersonIcon,
      fields: [
        {
          name: 'customerId',
          label: 'Customer',
          type: 'autocomplete',
          required: true,
          icon: BusinessIcon,
          options: [], // Will be set dynamically by ContactFormConfigWrapper
          grid: { xs: 12, sm: 12, md: 12, lg: 6 },
          helperText: 'Select the customer this contact belongs to',
          disabled: true
        },
        {
          name: 'salutation',
          label: 'Salutation',
          type: 'select',
          required: false,
          icon: BadgeIcon,
          options: SALUTATION_OPTIONS,
          grid: { xs: 12, sm: 6, md: 6, lg: 3 },
        },
        {
          name: 'firstName',
          label: 'First Name',
          type: 'text',
          required: true,
          icon: PersonIcon,
          grid: { xs: 12, sm: 6, md: 6, lg: 3 },
          helperText: 'Contact first name',
          validation: {
            validate: (value) => {
              if (!value?.trim()) return 'First name is required';
              if (value.trim().length < 2) return 'First name must be at least 2 characters';
              return true;
            }
          }
        },
        {
          name: 'middleName',
          label: 'Middle Name',
          type: 'text',
          required: false,
          icon: PersonIcon,
          grid: { xs: 12, sm: 6, md: 6, lg: 3 },
          helperText: 'Optional middle name'
        },
        {
          name: 'lastName',
          label: 'Last Name',
          type: 'text',
          required: false,
          icon: PersonIcon,
          grid: { xs: 12, sm: 6, md: 6, lg: 3 },
          helperText: 'Optional last name'
        },
        {
          name: 'jobTitle',
          label: 'Job Title',
          type: 'text',
          required: false,
          icon: BadgeIcon,
          grid: { xs: 12, sm: 12, md: 12, lg: 6 },
          helperText: 'Position or role within the company'
        },
        {
          name: 'isPrimary',
          label: 'Set as Primary Contact',
          type: 'checkbox',
          required: false,
          icon: StarIcon,
          grid: { xs: 12, sm: 12, md: 12, lg: 6 },
          helperText: 'Mark this as the primary contact for the customer'
        },
      ]
    },
    {
      id: 'contact-details',
      title: 'Contact Details',
      icon: EmailIcon,
      fields: [
        {
          name: 'email',
          label: 'Email',
          type: 'email',
          required: true,
          icon: EmailIcon,
          grid: { xs: 12, sm: 12, md: 12, lg: 6 },
          helperText: 'Primary email address',
          validation: {
            validate: (value) => {
              if (!value?.trim()) return 'Email is required';
              if (!EMAIL_REGEX.test(value.trim())) return 'Please enter a valid email address';
              return true;
            }
          }
        },
        {
          name: 'phone',
          label: 'Phone',
          type: 'text',
          required: false,
          icon: PhoneIcon,
          grid: { xs: 12, sm: 6, md: 6, lg: 6 },
          helperText: 'Office or landline phone number',
          validation: {
            validate: (value) => {
              if (value && !PHONE_REGEX.test(value)) return 'Please enter a valid phone number';
              return true;
            }
          }
        },
        {
          name: 'mobilePhone',
          label: 'Mobile Phone',
          type: 'text',
          required: false,
          icon: PhoneIcon,
          grid: { xs: 12, sm: 6, md: 6, lg: 6 },
          helperText: 'Mobile phone number',
          validation: {
            validate: (value) => {
              if (value && !PHONE_REGEX.test(value)) return 'Please enter a valid mobile phone number';
              return true;
            }
          }
        },
        {
          name: 'fax',
          label: 'Fax',
          type: 'text',
          required: false,
          icon: PhoneIcon,
          grid: { xs: 12, sm: 6, md: 6, lg: 6 },
          helperText: 'Fax number',
        },
      ]
    },
    {
      id: 'additional-info',
      title: 'Additional Information',
      icon: NotesIcon,
      fields: [
        {
          name: 'address',
          label: 'Address',
          type: 'textarea',
          required: false,
          rows: 3,
          placeholder: 'Enter contact address...',
          icon: LocationOnIcon,
          grid: { xs: 12, sm: 12, md: 12, lg: 12 },
          helperText: 'Full address of the contact'
        },
        {
          name: 'notes',
          label: 'Notes',
          type: 'textarea',
          required: false,
          rows: 4,
          placeholder: 'Add any additional notes about this contact...',
          icon: NotesIcon,
          grid: { xs: 12, sm: 12, md: 12, lg: 12 },
          helperText: 'Additional notes or comments'
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
 * Transform form data to contact object
 * @param {Object} formData - Form data from BaseForm
 * @returns {Object} - Object containing contact data
 */
export const transformContactData = (formData) => {
  const contact = {
    customerId: formData.customerId ? parseInt(formData.customerId) : null,
    salutation: formData.salutation?.trim() || null,
    firstName: formData.firstName?.trim() || '',
    middleName: formData.middleName?.trim() || null,
    lastName: formData.lastName?.trim() || '',
    email: formData.email?.trim() || '',
    phone: formData.phone?.trim() || null,
    mobilePhone: formData.mobilePhone?.trim() || null,
    fax: formData.fax?.trim() || null,
    jobTitle: formData.jobTitle?.trim() || null,
    address: formData.address?.trim() || null,
    ownerId: formData.ownerId ? parseInt(formData.ownerId) : null,
    notes: formData.notes?.trim() || null,
    isPrimary: formData.isPrimary || false,
  };

  return { contact };
};

/**
 * ContactFormConfigWrapper - Component wrapper to use hooks
 * Provides dynamic customer and user options from API
 */
export const ContactFormConfigWrapper = (initialData = {}) => {
  const { customers, loading: customersLoading, error: customersError } = useCustomers();
  const { users, loading: usersLoading, error: usersError } = useUsers();

  const config = {
    ...ContactFormConfig,
    sections: ContactFormConfig.sections.map(section => ({
      ...section,
      fields: (section.fields || []).map(field => {
        if (field.name === 'customerId') {
          return {
            ...field,
            options: (formData) => {
              if (customersLoading) {
                return [
                  { value: '', label: 'Loading customers...', disabled: true }
                ];
              }

              if (customersError) {
                return [
                  { value: '', label: 'Failed to load customers', disabled: true }
                ];
              }

              const customerOptions = customers.map(customer => ({
                value: customer.id,
                label: `${customer.id} - ${customer.name}` || `Customer ${customer.id}`,
              }));

              console.log('customerOptions:', customerOptions);

              return customerOptions;
            },
            // Disable field only if it's locked (from CustomerDetail)
            disabled: isDefined(initialData.customerId) && initialData.customerId !== '' && initialData.customerId !== null,
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

export default ContactFormConfigWrapper;
