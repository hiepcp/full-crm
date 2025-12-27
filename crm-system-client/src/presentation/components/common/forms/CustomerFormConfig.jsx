import {
  Business as BusinessIcon,
  Language as LanguageIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Notes as NotesIcon
} from '@mui/icons-material';

/**
 * Validation functions for customer form fields
 */

// Domain validation - basic domain format check
const validateDomain = (value) => {
  if (!value) return null; // Skip validation if empty (handled by required check)

  // More permissive domain regex - allows most common domain patterns
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9\-\.]*[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/;

  if (!domainRegex.test(value)) {
    return 'Invalid domain format. Use format like: example.com';
  }

  // Basic checks for obviously wrong input
  if (value.includes('://')) {
    return 'Domain should not include protocol (http:// or https://)';
  }

  if (value.includes(' ')) {
    return 'Domain should not contain spaces';
  }

  return null;
};

// Phone validation - allow any reasonable phone format
const validatePhone = (value) => {
  if (!value) return null; // Skip validation if empty (handled by required check)

  // Remove all spaces, dashes, parentheses for validation
  const cleanPhone = value.replace(/[\s\-\(\)]/g, '');

  // Very permissive phone regex - allow any combination of digits, plus signs, and common separators
  const phoneRegex = /^[\+\d\s\-\(\)]{7,20}$/;

  if (!phoneRegex.test(value)) {
    return 'Invalid phone number format';
  }

  // Check that there are at least some digits
  const digitCount = cleanPhone.replace(/\D/g, '').length;
  if (digitCount < 7) {
    return 'Phone number must contain at least 7 digits';
  }

  return null;
};

// Company email validation - basic email format only
const validateCompanyEmail = (value, formData) => {
  if (!value) return null; // Skip validation if empty

  // Basic email regex (this is also checked by BaseForm, but let's be explicit)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    return 'Invalid email format';
  }

  // Allow all email domains - no restrictions
  return null;
};

/**
 * Configuration for Customer Form
 * Defines the structure and behavior of the customer creation form
 */
export const CustomerFormConfig = {
  title: "Create New Customer",

  // Initial form data
  initialData: {
    name: '',
    domain: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    notes: '',
  },

  // Form sections
  sections: [
    {
      id: 'company-info',
      title: 'Company Information',
      icon: BusinessIcon,
      fields: [
        {
          name: 'name',
          label: 'Company Name',
          type: 'text',
          required: true,
          icon: BusinessIcon,
          grid: { sm: 12 }
        },
        {
          name: 'domain',
          label: 'Website Domain',
          type: 'text',
          required: true,
          placeholder: 'example.com',
          helperText: 'e.g., example.com',
          icon: LanguageIcon,
          grid: { sm: 6 },
          validate: validateDomain
        },
        {
          name: 'email',
          label: 'Company Email',
          type: 'email',
          required: false,
          helperText: "Primary company email address",
          icon: EmailIcon,
          grid: { sm: 6 },
          validate: validateCompanyEmail
        },
        {
          name: 'phone',
          label: 'Company Phone',
          type: 'text',
          required: false,
          placeholder: '+84 xxx xxx xxx',
          icon: PhoneIcon,
          grid: { sm: 6 },
          validate: validatePhone
        },
        {
          name: 'address',
          label: 'Address',
          type: 'text',
          required: false,
          icon: LocationIcon,
          grid: { sm: 6 }
        },
        {
          name: 'city',
          label: 'City',
          type: 'text',
          required: false,
          grid: { sm: 6 }
        },
        {
          name: 'country',
          label: 'Country',
          type: 'text',
          required: false,
          grid: { sm: 6 }
        },
        {
          name: 'notes',
          label: 'Notes',
          type: 'textarea',
          required: false,
          rows: 3,
          placeholder: 'Add any additional notes about this customer...',
          icon: NotesIcon,
          grid: { sm: 12 }
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
      label: 'Create Customer',
      gradient: 'linear-gradient(135deg, #586a68 0%, #4e605e 100%)',
      hoverGradient: 'linear-gradient(135deg, #4e605e 0%, #434f4e 100%)'
    }
  }
};

/**
 * Transform customer form data to customer object
 * @param {Object} formData - Form data from BaseForm
 * @returns {Object} - Customer object
 */
export const transformCustomerData = (formData) => {
  return {
    id: Date.now() + Math.random() + 1, // Temporary unique ID
    name: formData.name,
    domain: formData.domain,
    email: formData.email,
    phone: formData.phone,
    address: formData.address,
    city: formData.city,
    country: formData.country,
    notes: formData.notes,
    createdOn: new Date().toISOString(),
    updatedOn: new Date().toISOString(),
    createdBy: 'current_user@crm.com',
    isActive: true
  };
};
