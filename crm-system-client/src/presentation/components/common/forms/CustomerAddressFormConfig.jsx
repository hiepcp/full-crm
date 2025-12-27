import {
  LocationOn as LocationIcon,
  Home as HomeIcon,
  Public as PublicIcon
} from '@mui/icons-material';
import { COUNTRY_OPTIONS } from '../../../../utils/constants_contry';
import { ADDRESS_TYPES } from '../../../../utils/constants';

/**
 * Configuration for Customer Address Form
 * Defines the structure and behavior of the customer address creation/edit form
 */
export const CustomerAddressFormConfig = {
  title: "Customer Address",

  // Initial form data
  initialData: {
    customerId: '',
    addressType: 'legal',
    companyName: '',
    addressLine: '',
    postcode: '',
    city: '',
    country: 'VNM',
    contactPerson: '',
    email: '',
    telephoneNo: '',
    portOfDestination: '',
    isPrimary: false
  },

  // Form sections
  sections: [
    {
      id: 'address-info',
      title: 'Address Information',
      icon: LocationIcon,
      defaultExpanded: true,
      fields: [
        {
          name: 'addressType',
          label: 'Address Type',
          type: 'select',
          required: true,
          icon: HomeIcon,
          options: ADDRESS_TYPES,
          grid: { xs: 12, sm: 6 },
        },
        {
          name: 'companyName',
          label: 'Company Name',
          type: 'text',
          required: false,
          placeholder: 'Company name at this address',
          grid: { xs: 12, sm: 6 },
        },
        {
          name: 'addressLine',
          label: 'Address Line',
          type: 'textarea',
          required: true,
          rows: 2,
          placeholder: 'Street address, building, apartment, etc.',
          icon: LocationIcon,
          grid: { xs: 12 },
        },
        {
          name: 'city',
          label: 'City',
          type: 'text',
          required: true,
          grid: { xs: 12, sm: 6, md: 4 },
        },
        {
          name: 'postcode',
          label: 'Postcode',
          type: 'text',
          required: false,
          grid: { xs: 12, sm: 6, md: 4 },    
        },
        {
          name: 'country',
          label: 'Country (ISO 3)',
          type: 'autocomplete',
          required: true,
          options: COUNTRY_OPTIONS,
          grid: { xs: 12, sm: 12, md: 4 },
          helperText: 'ISO 3166-1 alpha-3 code, e.g. VNM, DNK'
        },
        {
          name: 'contactPerson',
          label: 'Contact Person',
          type: 'text',
          required: false,
          placeholder: 'Contact person name',
          grid: { xs: 12, sm: 6 },
        },
        {
          name: 'email',
          label: 'Email',
          type: 'email',
          required: false,
          placeholder: 'Contact email address',
          grid: { xs: 12, sm: 6 },
        },
        {
          name: 'telephoneNo',
          label: 'Telephone',
          type: 'text',
          required: false,
          placeholder: 'Contact phone number',
          grid: { xs: 12, sm: 6 },
        },
        {
          name: 'portOfDestination',
          label: 'Port of Destination',
          type: 'text',
          required: false,
          placeholder: 'Destination port (for shipping)',
          grid: { xs: 12, sm: 6 },
        },
        {
          name: 'isPrimary',
          label: 'Primary Address',
          type: 'select',
          required: false,
          helperText: 'Set as the default address for this type',
          options: [
            { value: false, label: 'No' },
            { value: true, label: 'Yes' },
          ],
          grid: { xs: 12, sm: 6 },
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
      label: 'Save Address',
      gradient: 'linear-gradient(135deg, #586a68 0%, #4e605e 100%)',
      hoverGradient: 'linear-gradient(135deg, #4e605e 0%, #434f4e 100%)'
    }
  }
};

/**
 * Transform address form data to address object matching API request
 * Maps client field names to API field names (PascalCase)
 * @param {Object} formData - Form data from BaseForm
 * @returns {Object} - Address object for API
 */
export const transformAddressData = (formData) => {
  return {
    customerId: parseInt(formData.customerId) || null,
    addressType: formData.addressType || 'other',
    companyName: formData.companyName || null,
    addressLine: formData.addressLine || null,
    postcode: formData.postcode || null,
    city: formData.city || null,
    country: formData.country || null,
    contactPerson: formData.contactPerson || null,
    email: formData.email || null,
    telephoneNo: formData.telephoneNo || null,
    portOfDestination: formData.portOfDestination || null,
    isPrimary: formData.isPrimary === true || formData.isPrimary === 'true'
  };
};
