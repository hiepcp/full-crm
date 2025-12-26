import axiosInstance from './axiosInstance';

/**
 * Activities API Client
 * Feature 006-contract-activity-fields: Added contractDate and contractValue support
 */

/**
 * Create a new activity
 * T015 [US1]: Added contractDate field
 * T025 [US2]: Added contractValue field
 */
export const createActivity = async (activityData) => {
  const response = await axiosInstance.post('/api/activities', {
    name: activityData.name,
    type: activityData.type,
    description: activityData.description,
    dueDate: activityData.dueDate,
    status: activityData.status,
    customerId: activityData.customerId,
    leadId: activityData.leadId,
    dealId: activityData.dealId,
    // NEW FIELDS (Feature 006-contract-activity-fields)
    contractDate: activityData.contractDate || null,  // T015 [US1]
    contractValue: activityData.contractValue || null // T025 [US2]
  });
  return response.data;
};

/**
 * Update an existing activity
 * T016 [US1]: Added contractDate field
 * T026 [US2]: Added contractValue field
 */
export const updateActivity = async (id, activityData) => {
  const response = await axiosInstance.put(`/api/activities/${id}`, {
    name: activityData.name,
    type: activityData.type,
    description: activityData.description,
    dueDate: activityData.dueDate,
    status: activityData.status,
    customerId: activityData.customerId,
    leadId: activityData.leadId,
    dealId: activityData.dealId,
    // NEW FIELDS (Feature 006-contract-activity-fields)
    contractDate: activityData.contractDate || null,  // T016 [US1]
    contractValue: activityData.contractValue || null // T026 [US2]
  });
  return response.data;
};

/**
 * Get activity by ID
 * Returns activity with contractDate and contractValue fields (nullable)
 */
export const getActivityById = async (id) => {
  const response = await axiosInstance.get(`/api/activities/${id}`);
  return response.data;
};

/**
 * Query/filter activities
 * T035 [US3]: Added contract date and value range filtering
 */
export const filterActivities = async (filters) => {
  const response = await axiosInstance.post('/api/activities/query', {
    type: filters.type,
    status: filters.status,
    customerId: filters.customerId,
    leadId: filters.leadId,
    dealId: filters.dealId,
    dueDateFrom: filters.dueDateFrom,
    dueDateTo: filters.dueDateTo,
    // NEW FILTERS (Feature 006-contract-activity-fields)
    contractDateFrom: filters.contractDateFrom || null,  // T035 [US3]
    contractDateTo: filters.contractDateTo || null,      // T035 [US3]
    contractValueMin: filters.contractValueMin || null,  // T035 [US3]
    contractValueMax: filters.contractValueMax || null   // T035 [US3]
  });
  return response.data;
};

/**
 * Helper function to filter contract activities by date range
 * T035 [US3]: Convenience wrapper for contract date filtering
 */
export const filterContractActivitiesByDateRange = async (dateFrom, dateTo) => {
  return await filterActivities({
    type: 'contract',
    contractDateFrom: dateFrom,
    contractDateTo: dateTo
  });
};

/**
 * Helper function to filter contract activities by value range
 * T035 [US3]: Convenience wrapper for contract value filtering
 */
export const filterContractActivitiesByValueRange = async (valueMin, valueMax) => {
  return await filterActivities({
    type: 'contract',
    contractValueMin: valueMin,
    contractValueMax: valueMax
  });
};

export default {
  createActivity,
  updateActivity,
  getActivityById,
  filterActivities,
  filterContractActivitiesByDateRange,
  filterContractActivitiesByValueRange
};
