// Email template category enum (matches backend EmailTemplateCategory)
export const EmailTemplateCategory = {
  LeadFollowUp: 1,
  DealProposal: 2,
  CustomerWelcome: 3,
  Meeting: 4,
  FollowUp: 5,
  ThankYou: 6,
  Invoice: 7,
  Quote: 8,
  General: 9
};

// Category labels for display
export const EmailTemplateCategoryLabels = {
  [EmailTemplateCategory.LeadFollowUp]: 'Lead Follow-up',
  [EmailTemplateCategory.DealProposal]: 'Deal Proposal',
  [EmailTemplateCategory.CustomerWelcome]: 'Customer Welcome',
  [EmailTemplateCategory.Meeting]: 'Meeting',
  [EmailTemplateCategory.FollowUp]: 'Follow-up',
  [EmailTemplateCategory.ThankYou]: 'Thank You',
  [EmailTemplateCategory.Invoice]: 'Invoice',
  [EmailTemplateCategory.Quote]: 'Quote',
  [EmailTemplateCategory.General]: 'General'
};

// For backward compatibility with existing components
export const templateCategories = Object.values(EmailTemplateCategory);
