// ==============================|| CONSTANTS ||============================== //

/**
 * Danh sách nguồn khách hàng tiềm năng (Lead Sources)
 * Được sử dụng trong LeadDetail, DealDetail và CreateLeadModal components
 */
export const LEAD_SOURCES = [
  { value: 'Website', label: '🌐 Website' },
  { value: 'Referral', label: '🤝 Referral' },
  { value: 'Cold Call', label: '📞 Cold Call' },
  { value: 'Advertisement', label: '📢 Advertisement' },
  { value: 'Social Media', label: '👥 Social Media' },
  { value: 'Email Campaign', label: '📧 Email Campaign' }
];

/**
 * Danh sách nguồn khách hàng tiềm năng cho form tạo mới (CreateLeadModal và CreateDealModal)
 * Sử dụng các giá trị khác với display name có emoji
 */
export const LEAD_SOURCES_CREATE = [
  { value: 'web', label: '🌐 Web' },
  { value: 'event', label: '🎪 Event' },
  { value: 'referral', label: '🤝 Referral' },
  { value: 'ads', label: '📢 Ads' },
  { value: 'facebook', label: '📘 Facebook' },
  { value: 'other', label: '📋 Other' }
];


/**
 * Danh sách trạng thái của Lead
 */
export const LEAD_STATUSES = [
  { value: 'working', label: '🔄 Working', description: 'In progress' },
  { value: 'qualified', label: '✅ Qualified', description: 'Ready to convert' },
  { value: 'cancelled', label: '🚫 Cancelled', description: 'Cancelled' }
];

/**
 * Danh sách trạng thái của Lead cho form tạo mới (CreateLeadModal)
 * Với format đầy đủ bao gồm chip và description
 */
export const LEAD_STATUSES_CREATE = [
  { value: 'working', label: '🔄 Working', description: 'In progress', color: 'warning' },
  { value: 'qualified', label: '✅ Qualified', description: 'Ready to convert', color: 'success' }
];

/**
 * Danh sách nguồn gốc của Deal
 */
export const DEAL_SOURCES = [
  { value: 'web', label: '🌐 Web' },
  { value: 'event', label: '🎪 Event' },
  { value: 'referral', label: '🤝 Referral' },
  { value: 'ads', label: '📢 Ads' },
  { value: 'facebook', label: '📘 Facebook' },
  { value: 'other', label: '📋 Other' }
];

/**
 * Danh sách nguồn gốc của Deal cho form tạo mới (CreateDealModal)
 * Sử dụng các giá trị khác với display name có emoji
 */
export const DEAL_SOURCES_CREATE = [
  { value: 'web', label: '🌐 Web' },
  { value: 'event', label: '🎪 Event' },
  { value: 'referral', label: '🤝 Referral' },
  { value: 'ads', label: '📢 Ads' },
  { value: 'facebook', label: '📘 Facebook' },
  { value: 'other', label: '📋 Other' }
];

/**
 * Danh sách giai đoạn của Deal
 */
export const DEAL_STAGES = [
  { value: 'Prospecting', label: '🔍 Prospecting' },
  { value: 'Quotation', label: '📋 Quotation' },
  { value: 'Proposal', label: '📄 Proposal' },
  { value: 'Negotiation', label: '🤝 Negotiation' },
  { value: 'Closed Won', label: '✅ Closed Won' },
  { value: 'Closed Lost', label: '❌ Closed Lost' },
  { value: 'On Hold', label: '⏸️ On Hold' }
];

/**
 * Danh sách loại hoạt động (Activity Types)
 * Được sử dụng trong các form tạo và edit activity
 */
export const ACTIVITY_TYPES = [
  // { value: 'task', label: 'Task' },
  { value: 'email', label: '📧 Email' },
  { value: 'meeting-online', label: '📹 Online Appointment' },
  { value: 'meeting-offline', label: '📅 Offline Appointment' },
  { value: 'call', label: '📞 Call' },
  { value: 'note', label: '📝 Note' },
  { value: 'contract', label: '📄 Contract' }
];

/**
 * Activity categories used for filtering and display in detail pages
 * Meeting types (online/offline) are normalized to a single 'meeting' category
 */
export const ACTIVITY_CATEGORIES = {
  EMAIL: 'email',
  CALL: 'call',
  MEETING: 'meeting',
  // TASK: 'task',
  NOTE: 'note',
  CONTRACT: 'contract'
  // OTHER: 'other'
};

/**
 * Activity source types - define where activities originate from
 * Used for categorizing and displaying activities based on their source
 */
export const ACTIVITY_SOURCE_TYPES = {
  GMAIL_EMAIL: 'gmail-email',
  PHONE_CALL: 'phone-call',
  CALENDAR_MEETING: 'calendar-meeting',
  SYSTEM_TASK: 'system-task',
  SYSTEM_NOTE: 'system-note',
  INSTANT_DOC: 'instant-doc'
};

export const ADDRESS_TYPES = [
  { value: 'legal', label: '🏢 Customer\'s Legal Information' },
  { value: 'delivery', label: '🚚 Delivery Address' },
  { value: 'forwarder', label: '🔄 Forwarder Details' },
  { value: 'forwarder_agent_asia', label: '🌏 Forwarder Agent in Asia' },
  { value: 'other', label: '📋 Other' }
];

/**
 * Danh sách vai trò của Assignee
 */
export const ASSIGNEE_ROLES = [
  { value: 'owner', label: '👑 Owner' },
  { value: 'collaborator', label: '🤝 Collaborator' },
  { value: 'follower', label: '👀 Follower' }
];

/**
 * Danh sách vai trò của Team Member
 */
export const TEAM_ROLES = [
  { value: 'TeamLead', label: 'Team Lead' },
  { value: 'Member', label: 'Member' },
  { value: 'Observer', label: 'Observer' }
];

export const PAYMENT_TERMS = [
  { value: 'prepaid', label: 'Prepaid' },
  { value: 'cash_in_advance', label: 'Cash In Advance' },
  { value: 'cash_on_delivery', label: 'Cash On Delivery' },
  { value: 'cash_on_pickup', label: 'Cash On Pickup' },
  { value: 'immediate_payment', label: 'Immediate Payment' },
  { value: 'due_on_receipt', label: 'Due On Receipt' },

  { value: 'net_7', label: 'Net 7 Days' },
  { value: 'net_10', label: 'Net 10 Days' },
  { value: 'net_14', label: 'Net 14 Days' },
  { value: 'net_30', label: 'Net 30 Days' },
  { value: 'net_45', label: 'Net 45 Days' },
  { value: 'net_60', label: 'Net 60 Days' },
  { value: 'net_90', label: 'Net 90 Days' },

  { value: 'discount_2_10_net_30', label: '2/10 Net 30' },
  { value: 'discount_1_10_net_30', label: '1/10 Net 30' },
  { value: 'discount_3_15_net_45', label: '3/15 Net 45' },

  { value: 'payment_on_delivery', label: 'Payment On Delivery' },
  { value: 'payment_on_acceptance', label: 'Payment On Acceptance' },
  { value: 'milestone_payment', label: 'Milestone Payment' },
  { value: 'progress_payment', label: 'Progress Payment' },

  { value: 'monthly_billing', label: 'Monthly Billing' },
  { value: 'quarterly_billing', label: 'Quarterly Billing' },
  { value: 'annual_billing', label: 'Annual Billing' },
  { value: 'installment_payment', label: 'Installment Payment' },
  { value: 'subscription', label: 'Subscription' },

  { value: 'letter_of_credit', label: 'Letter of Credit (L/C)' },
  { value: 'documentary_collection_dp', label: 'Documentary Collection (D/P)' },
  { value: 'documentary_collection_da', label: 'Documentary Collection (D/A)' },
  { value: 'open_account', label: 'Open Account' },
  { value: 'advance_payment', label: 'Advance Payment' },

  { value: 'end_of_month', label: 'End of Month (EOM)' },
  { value: 'net_30_eom', label: 'Net 30 EOM' },
  { value: 'payment_in_arrears', label: 'Payment in Arrears' },
  { value: 'payment_in_advance', label: 'Payment in Advance' },
  { value: 'on_account', label: 'On Account' },
];