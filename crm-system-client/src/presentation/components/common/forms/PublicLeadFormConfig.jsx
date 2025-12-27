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
import { PAYMENT_TERMS } from '@src/utils/constants';

/**
 * Public Lead Form Configuration
 * Based on Customer's Legal Information form layout
 */
export const PublicLeadFormConfig = {
  initialData: {
    // Customer's Legal Information
    company: '',
    address: '',
    postcode: '',
    city: '',
    country: '',
    vatNo: '',
    contactPerson: '',
    email: '',
    invoiceEmail: '',
    telephoneNo: '',
    website: '',
    paymentTerms: '',
    documentsNeeded: '',
    portOfDestination: '',
    
    // Delivery Address
    deliveryCompanyName: '',
    deliveryAddress: '',
    deliveryPostcode: '',
    deliveryCity: '',
    deliveryCountry: '',
    deliveryContactPerson: '',
    deliveryTelephoneNo: '',
    deliveryPortOfDestination: '',
    
    // Forwarder Details
    forwarderCompanyName: '',
    forwarderAddress: '',
    forwarderPostcode: '',
    forwarderCity: '',
    forwarderCountry: '',
    forwarderContactPerson: '',
    forwarderTelephoneNo: '',
    
    // Forwarder Agent in Asia
    agentCompanyName: '',
    agentAddress: '',
    agentPostcode: '',
    agentCity: '',
    agentCountry: '',
    agentContactPerson: '',
    agentTelephoneNo: '',
  },

  sections: [
    {
      id: 'customer-legal-info',
      title: "Customer's Legal Information",
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
      id: 'delivery-address',
      title: 'Delivery Address',
      subtitle: 'Please complete if different from invoicing address (if more warehouses, please fill in all)',
      icon: ShippingIcon,
      collapsible: true,
      defaultCollapsed: true,
      fields: [
        {
          name: 'deliveryCompanyName',
          label: 'Company Name',
          type: 'text',
          placeholder: 'Delivery company name',
          grid: { xs: 12, sm: 12, md: 12, lg: 12, xl: 12 },
        },
        {
          name: 'deliveryContactPerson',
          label: 'Contact Person / E-mail Address',
          type: 'text',
          placeholder: 'Contact person and email',
          grid: { xs: 12, sm: 6, md: 6, lg: 6, xl: 6 },
        },
        {
          name: 'deliveryTelephoneNo',
          label: 'Telephone No',
          type: 'text',
          placeholder: 'Phone number',
          icon: PhoneIcon,
          grid: { xs: 12, sm: 6, md: 6, lg: 6, xl: 6 },
        },
        {
          name: 'deliveryCountry',
          label: 'Country',
          type: 'autocomplete',
          options: COUNTRY_OPTIONS,
          placeholder: 'Select country',
          grid: { xs: 12, sm: 4, md: 4, lg: 4, xl: 4 },
        },
        {
          name: 'deliveryCity',
          label: 'City',
          type: 'text',
          placeholder: 'City',
          grid: { xs: 12, sm: 4, md: 4, lg: 4, xl: 4 },
        },
        {
          name: 'deliveryPostcode',
          label: 'Postcode',
          type: 'text',
          placeholder: 'Postcode',
          grid: { xs: 12, sm: 4, md: 4, lg: 4, xl: 4 },
        },
        {
          name: 'deliveryAddress',
          label: 'Address',
          type: 'text',
          placeholder: 'Delivery address',
          icon: LocationIcon,
          grid: { xs: 12, sm: 6, md: 6, lg: 6, xl: 6 },
        },
        {
          name: 'deliveryPortOfDestination',
          label: 'Port of Destination',
          type: 'text',
          placeholder: 'Port name',
          icon: ShippingIcon,
          grid: { xs: 12, sm: 6, md: 6, lg: 6, xl: 6 },
        },
      ],
    },
    {
      id: 'forwarder-details',
      title: 'Forwarder Details',
      icon: ShippingIcon,
      collapsible: true,
      defaultCollapsed: true,
      fields: [
        {
          name: 'forwarderCompanyName',
          label: 'Company Name',
          type: 'text',
          placeholder: 'Forwarder company name',
          grid: { xs: 12, sm: 12, md: 12, lg: 12, xl: 12 },
        },
        {
          name: 'forwarderContactPerson',
          label: 'Contact Person / E-mail Address',
          type: 'text',
          placeholder: 'Contact person and email',
          grid: { xs: 12, sm: 6, md: 6, lg: 6, xl: 6 },
        },
        {
          name: 'forwarderTelephoneNo',
          label: 'Telephone No',
          type: 'text',
          placeholder: 'Phone number',
          icon: PhoneIcon,
          grid: { xs: 12, sm: 6, md: 6, lg: 6, xl: 6 },
        },
        {
          name: 'forwarderCountry',
          label: 'Country',
          type: 'autocomplete',
          options: COUNTRY_OPTIONS,
          placeholder: 'Select country',
          grid: { xs: 12, sm: 4, md: 4, lg: 4, xl: 4 },
        },
        {
          name: 'forwarderCity',
          label: 'City',
          type: 'text',
          placeholder: 'City',
          grid: { xs: 12, sm: 4, md: 4, lg: 4, xl: 4 },
        },
        {
          name: 'forwarderPostcode',
          label: 'Postcode',
          type: 'text',
          placeholder: 'Postcode',
          grid: { xs: 12, sm: 4, md: 4, lg: 4, xl: 4 },
        },
        {
          name: 'forwarderAddress',
          label: 'Address',
          type: 'text',
          placeholder: 'Forwarder address',
          icon: LocationIcon,
          grid: { xs: 12, sm: 12, md: 12, lg: 12, xl: 12 },
        },
      ],
    },
    {
      id: 'agent-details',
      title: "Forwarder's Agent in Asia (Vietnam)",
      icon: ShippingIcon,
      collapsible: true,
      defaultCollapsed: true,
      fields: [
        {
          name: 'agentCompanyName',
          label: 'Company Name',
          type: 'text',
          placeholder: 'Agent company name',
          grid: { xs: 12, sm: 12, md: 12, lg: 12, xl: 12 },
        },
        {
          name: 'agentContactPerson',
          label: 'Contact Person / E-mail Address',
          type: 'text',
          placeholder: 'Contact person and email',
          grid: { xs: 12, sm: 6, md: 6, lg: 6, xl: 6 },
        },
        {
          name: 'agentTelephoneNo',
          label: 'Telephone No',
          type: 'text',
          placeholder: 'Phone number',
          icon: PhoneIcon,
          grid: { xs: 12, sm: 6, md: 6, lg: 6, xl: 6 },
        },
        {
          name: 'agentCountry',
          label: 'Country',
          type: 'autocomplete',
          options: COUNTRY_OPTIONS,
          placeholder: 'Select country',
          grid: { xs: 12, sm: 4, md: 4, lg: 4, xl: 4 },
        },
        {
          name: 'agentCity',
          label: 'City',
          type: 'text',
          placeholder: 'City',
          grid: { xs: 12, sm: 4, md: 4, lg: 4, xl: 4 },
        },
        {
          name: 'agentPostcode',
          label: 'Postcode',
          type: 'text',
          placeholder: 'Postcode',
          grid: { xs: 12, sm: 4, md: 4, lg: 4, xl: 4 },
        },
        {
          name: 'agentAddress',
          label: 'Address',
          type: 'text',
          placeholder: 'Agent address',
          icon: LocationIcon,
          grid: { xs: 12, sm: 12, md: 12, lg: 12, xl: 12 },
        },
      ],
    },
  ],
};

/**
 * Transform public form data to lead entity with addresses
 * Maps to crm_lead table and crm_lead_address table
 */
export const transformPublicLeadData = (formData) => {
  // Parse contact person to extract name parts
  const contactPersonFull = formData.contactPerson || '';
  const emailMatch = contactPersonFull.match(/\(([^)]+)\)/);
  const namePart = contactPersonFull.replace(/\([^)]*\)/, '').trim();
  const nameParts = namePart.split(' ');
  
  // Build addresses array matching crm_lead_address schema
  const addresses = [];

  // 2. Delivery address - from Delivery Address section
  if (formData.deliveryCompanyName || formData.deliveryAddress) {
    addresses.push({
      addressType: 'delivery',
      companyName: formData.deliveryCompanyName,
      addressLine: formData.deliveryAddress,
      postcode: formData.deliveryPostcode,
      city: formData.deliveryCity,
      country: formData.deliveryCountry,
      contactPerson: formData.deliveryContactPerson,
      email: null,
      telephoneNo: formData.deliveryTelephoneNo,
      portOfDestination: formData.deliveryPortOfDestination,
      isPrimary: false,
    });
  }

  // 3. Forwarder address - from Forwarder Details section
  if (formData.forwarderCompanyName || formData.forwarderAddress) {
    addresses.push({
      addressType: 'forwarder',
      companyName: formData.forwarderCompanyName,
      addressLine: formData.forwarderAddress,
      postcode: formData.forwarderPostcode,
      city: formData.forwarderCity,
      country: formData.forwarderCountry,
      contactPerson: formData.forwarderContactPerson,
      email: null,
      telephoneNo: formData.forwarderTelephoneNo,
      portOfDestination: null,
      isPrimary: false,
    });
  }

  // 4. Forwarder agent in Asia address - from Agent Details section
  if (formData.agentCompanyName || formData.agentAddress) {
    addresses.push({
      addressType: 'forwarder_agent_asia',
      companyName: formData.agentCompanyName,
      addressLine: formData.agentAddress,
      postcode: formData.agentPostcode,
      city: formData.agentCity,
      country: formData.agentCountry,
      contactPerson: formData.agentContactPerson,
      email: null,
      telephoneNo: formData.agentTelephoneNo,
      portOfDestination: null,
      isPrimary: false,
    });
  }

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
    addresses: addresses,
  };
};
