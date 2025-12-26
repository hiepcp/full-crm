/**
 * Utility for building filter payload for API
 * Client keeps camelCase, server handles all mapping
 */

/**
 * Map operator from DataGrid format to API format
 * 
 * @param {string} operator - DataGrid operator
 * @returns {string} API operator
 */
export function mapOperatorToApi(operator) {
  const operatorMap = {
    contains: 'like',
    equals: '=',
    startsWith: 'startsWith',
    endsWith: 'endsWith',
    isEmpty: 'isEmpty',
    isNotEmpty: 'isNotEmpty',
    '=': '=',
    '!=': '!=',
    '>': '>',
    '>=': '>=',
    '<': '<',
    '<=': '<=',
  };
  
  return operatorMap[operator] || 'like';
}

/**
 * Build filter payload for API from DataGrid filterModel
 * Sends field names as-is (camelCase), server will handle mapping
 * 
 * @param {Object} filterModel - DataGrid filter model
 * @param {Object} extraFilters - Additional filters (e.g., { type: 'Client' })
 * @returns {Array} Filter payload for API
 */
export function buildFilterPayload(filterModel, extraFilters = {}) {
  const payload = [];
  
  // Process DataGrid filters - send field names as-is
  const items = filterModel?.items || [];
  items.forEach((item) => {
    const hasValue = item?.value !== undefined && 
                     item?.value !== null && 
                     String(item.value).length > 0;
    const field = item?.field || item?.columnField;
    const operator = item?.operator || item?.operatorValue;
    
    if (hasValue && field) {
      payload.push({
        column: field,  // Send as-is (camelCase)
        operator: mapOperatorToApi(operator),
        value: item.value,
      });
    }
  });
  
  // Process extra filters - send as-is
  Object.entries(extraFilters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '' && value !== 'all') {
      payload.push({
        column: key,  // Send as-is (camelCase)
        operator: '=',
        value: value,
      });
    }
  });
  
  return payload;
}
