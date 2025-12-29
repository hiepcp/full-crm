import {
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Language as LanguageIcon,
  LocalShipping as ShippingIcon,
  Description as DocumentIcon,
} from '@mui/icons-material';
import { COUNTRY_OPTIONS } from '@utils/constants_contry';
import { PAYMENT_TERMS, ADDRESS_TYPES } from '@src/utils/constants';

/**
 * Public Lead Form Configuration
 * Based on Customer's Legal Information form layout
 */
export const PublicLeadFormConfig = {
  initialData: {
    // Customer's Legal Information
    company: '',
    email: '',
    telephoneNo: '',
    website: '',
    country: '',
    vatNo: '',
    paymentTerms: '',
    
    // Address array for multiple addresses
    addresses: []
  },

  sections: [
    {
      id: 'company-info',
      title: "Company Information",
      icon: BusinessIcon,
      fields: [
        {
          name: 'company',
          label: 'Company Name',
          type: 'text',
          required: true,
          placeholder: 'Enter company name',
          icon: BusinessIcon,
          grid: { xs: 12, sm: 6, md: 6, lg: 6, xl: 6 },
        },
        {
          name: 'email',
          label: 'Primary E-mail',
          type: 'email',
          required: true,
          placeholder: 'contact@company.com',
          icon: EmailIcon,
          grid: { xs: 12, sm: 6, md: 6, lg: 6, xl: 6 },
          validation: {
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: 'Please enter a valid email address',
          },
        },
        {
          name: 'telephoneNo',
          label: 'Telephone No',
          type: 'text',
          required: true,
          placeholder: '+852 12345678',
          icon: PhoneIcon,
          grid: { xs: 12, sm: 6, md: 6, lg: 6, xl: 6 },
        },
        {
          name: 'website',
          label: 'Website',
          type: 'text',
          placeholder: 'www.company.com',
          icon: LanguageIcon,
          grid: { xs: 12, sm: 6, md: 6, lg: 6, xl: 6 },
        },
        {
          name: 'country',
          label: 'Country',
          type: 'autocomplete',
          required: true,
          options: COUNTRY_OPTIONS,
          placeholder: 'Select country',
          grid: { xs: 12, sm: 4, md: 4, lg: 4, xl: 4 },
        },
        {
          name: 'vatNo',
          label: 'VAT No',
          type: 'text',
          placeholder: 'VAT number',
          grid: { xs: 12, sm: 4, md: 4, lg: 4, xl: 4 },
        },
        {
          name: 'paymentTerms',
          label: 'Payment Terms',
          type: 'freesolo-autocomplete',
          options: PAYMENT_TERMS,
          placeholder: 'e.g., 30/70, Net 30',
          grid: { xs: 12, sm: 4, md: 4, lg: 4, xl: 4 },
        },
      ],
    },
    {
      id: 'address-info',
      title: 'Address Information',
      subtitle: 'Add up to 10 addresses (Legal, Delivery, Forwarder, Agent, etc.)',
      icon: LocationIcon,
      fields: [
        {
          name: 'addresses',
          label: 'Addresses',
          type: 'array',
          required: false,
          maxItems: 10,
          grid: { xs: 12, sm: 12, md: 12, lg: 12, xl: 12 },
          addButtonLabel: 'Add Address',
          itemFields: [
            {
              name: 'addressType',
              label: 'Address Type',
              type: 'select',
              required: true,
              defaultValue: 'legal',
              options: ADDRESS_TYPES,
              grid: { xs: 12, sm: 12, md: 12, lg: 6, xl: 6 },
            },
            {
              name: 'isPrimary',
              label: 'Primary Address',
              type: 'checkbox',
              required: false,
              grid: { xs: 12, sm: 12, md: 12, lg: 6, xl: 6 },
            },
            {
              name: 'companyName',
              label: 'Company Name',
              type: 'text',
              required: false,
              placeholder: 'Company name for this address',
              grid: { xs: 12, sm: 12, md: 12, lg: 6, xl: 6 },
            },
            {
              name: 'addressLine',
              label: 'Address Line',
              type: 'text',
              required: false,
              placeholder: 'Street address',
              grid: { xs: 12, sm: 12, md: 12, lg: 6, xl: 6 },
            },
            {
              name: 'postcode',
              label: 'Postcode',
              type: 'text',
              required: false,
              placeholder: 'Postal code',
              grid: { xs: 12, sm: 6, md: 6, lg: 3, xl: 3 },
            },
            {
              name: 'city',
              label: 'City',
              type: 'text',
              required: false,
              placeholder: 'City',
              grid: { xs: 12, sm: 6, md: 6, lg: 3, xl: 3 },
            },
            {
              name: 'country',
              label: 'Country',
              type: 'autocomplete',
              required: false,
              options: COUNTRY_OPTIONS,
              placeholder: 'Select country',
              grid: { xs: 12, sm: 6, md: 6, lg: 5, xl: 5 },
            },
            {
              name: 'contactPerson',
              label: 'Contact Person',
              type: 'text',
              required: false,
              placeholder: 'Contact name',
              grid: { xs: 12, sm: 6, md: 6, lg: 6, xl: 6 },
            },
            {
              name: 'email',
              label: 'Email',
              type: 'email',
              required: false,
              placeholder: 'contact@company.com',
              grid: { xs: 12, sm: 6, md: 6, lg: 6, xl: 6 },
            },
            {
              name: 'telephoneNo',
              label: 'Telephone',
              type: 'text',
              required: false,
              placeholder: 'Phone number',
              grid: { xs: 12, sm: 6, md: 6, lg: 6, xl: 6 },
            },
            {
              name: 'portOfDestination',
              label: 'Port of Destination',
              type: 'text',
              required: false,
              placeholder: 'Port name (if applicable)',
              grid: { xs: 12, sm: 6, md: 6, lg: 6, xl: 6 },
            },
          ]
        }
      ]
    },
  ],
};

/**
 * Transform public form data to lead entity with addresses
 * Maps to crm_lead table and crm_lead_address table
 */
export const transformPublicLeadData = (formData) => {
  return {
    // Map to crm_lead table fields
    email: formData.email,
    telephoneNo: formData.telephoneNo,
    firstName: null,
    lastName: null,
    company: formData.company,
    website: formData.website,
    country: formData.country,
    vatNumber: formData.vatNo,
    paymentTerms: formData.paymentTerms,
    source: 'web',
    status: 'working',
    type: 0, // Draft type for public form submissions
    score: 0,
    note: null, // No note field in public form
    
    // Addresses array for crm_lead_address table
    addresses: formData.addresses || [],
  };
};
