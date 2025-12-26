import {
  Rule as RuleIcon,
  Score as ScoreIcon,
  Label as LabelIcon,
  Description as DescriptionIcon,
  TableChart as TableChartIcon,
} from '@mui/icons-material';

/**
 * Lead table field names for dropdown
 * These correspond to actual database columns in crm_lead table
 */
export const LEAD_FIELD_OPTIONS = [
  { value: 'source', label: 'Source' },
  { value: 'firstName', label: 'First Name' },
  { value: 'lastName', label: 'Last Name' },
  { value: 'company', label: 'Company' },
  { value: 'vatNumber', label: 'VAT Number' },
  { value: 'email', label: 'Email' },
  { value: 'telephoneNo', label: 'Telephone No' },
  { value: 'website', label: 'Website' },
  { value: 'paymentTerms', label: 'Payment Terms' },
  { value: 'country', label: 'Country' },
  { value: 'ownerId', label: 'Owner ID' },
  { value: 'followUpDate', label: 'Follow Up Date' },
  { value: 'note', label: 'Note' },
];

/**
 * Configuration for Lead Score Rule Form - Simplified single-table design
 * Rules award points if the specified field has a value (simple existence check)
 */
export const LeadScoreRuleFormConfig = {
  title: "Scoring Rule",

  // Initial form data
  initialData: {
    ruleName: '',
    description: '',
    fieldName: '',
    score: 0,
    isActive: true,
  },

  // Form sections
  sections: [
    {
      id: 'rule-config',
      title: 'Rule Configuration',
      icon: RuleIcon,
      fields: [
        {
          name: 'ruleName',
          label: 'Rule Name',
          type: 'text',
          required: true,
          icon: LabelIcon,
          grid: { xs: 12, sm: 6, md: 6, lg: 6, xl: 6 },
          helperText: 'Friendly name for this rule (e.g., "Source Provided")',
        },
        {
          name: 'isActive',
          label: 'Active',
          type: 'checkbox',
          required: false,
          grid: { xs: 12, sm: 6, md: 6, lg: 6, xl: 6 },
          helperText: 'Enable or disable this rule',
        },
        {
          name: 'fieldName',
          label: 'Field Name',
          type: 'select',
          required: true,
          icon: TableChartIcon,
          options: LEAD_FIELD_OPTIONS,
          grid: { xs: 12, sm: 6, md: 6, lg: 6, xl: 6 },
          helperText: 'Lead table column to check for value',
        },
        {
          name: 'score',
          label: 'Score',
          type: 'number',
          min: 0,
          max: 100,
          size: 'small',
          required: true,
          icon: ScoreIcon,
          grid: { xs: 12, sm: 6, md: 6, lg: 6, xl: 6 },
          helperText: 'Points awarded if field has value (between 0 and 100)',
          validation: {
            validate: (value) => {
              const numValue = parseInt(value);
              if (isNaN(numValue)) return 'Score must be a number';
              if (numValue < 0) return 'Score must be non-negative';
              if (numValue > 100) return 'Score must be less than 100';
              return true;
            }
          }
        },
        {
          name: 'description',
          label: 'Description',
          type: 'textarea',
          required: false,
          icon: DescriptionIcon,
          grid: { xs: 12, sm: 12, md: 12, lg: 12, xl: 12 },
          rows: 2,
          helperText: 'Optional description of this rule',
        },
      ]
    }
  ],
};

/**
 * Transform form data to API format
 */
export const transformLeadScoreRuleData = (formData) => {
  return {
    rule: {
      ruleName: formData.ruleName,
      description: formData.description || null,
      fieldName: formData.fieldName,
      score: parseInt(formData.score),
      isActive: formData.isActive ?? true,
    }
  };
};

/**
 * Wrapper function to generate form config dynamically
 * @param {Object} existingData - Existing rule data for edit mode
 * @returns {Object} Form configuration
 */
export const LeadScoreRuleFormConfigWrapper = (existingData = null) => {
  const config = { ...LeadScoreRuleFormConfig };

  // If editing, set initial data
  if (existingData) {
    config.initialData = {
      ruleName: existingData.ruleName || '',
      description: existingData.description || '',
      fieldName: existingData.fieldName || '',
      score: existingData.score || 0,
      isActive: existingData.isActive ?? true,
    };
  }

  return config;
};
