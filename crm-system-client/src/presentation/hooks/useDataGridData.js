import { useState, useCallback, useRef } from 'react';
import { buildFilterPayload } from '@utils/fieldMapper';

/**
 * Generic hook for DataGrid with server-side pagination, sorting, and filtering
 * Can be reused for any entity (Customer, Deal, Lead, Activity, etc.)
 * 
 * @param {Object} config - Configuration object
 * @param {Function} config.fetchFunction - API function to call (e.g., customersApi.getAllPaging)
 * @param {string} config.initialFilterColumn - Initial filter column (default: 'name')
 * @param {number} config.initialPageSize - Initial page size (default: 10)
 * @param {string} config.initialSortField - Initial sort field (default: 'id')
 * @param {string} config.initialSortOrder - Initial sort order (default: 'asc')
 * 
 * @example
 * // For Customers
 * const customersData = useDataGridData({
 *   fetchFunction: customersApi.getAllPaging,
 *   initialFilterColumn: 'name',
 * });
 * 
 * // For Deals
 * const dealsData = useDataGridData({
 *   fetchFunction: dealsApi.getAllPaging,
 *   initialFilterColumn: 'title',
 * });
 */
export default function useDataGridData({
  fetchFunction,
  initialFilterColumn = 'name',
  initialPageSize = 10,
  initialSortField = 'id',
  initialSortOrder = 'asc',
} = {}) {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [paginationModel, setPaginationModel] = useState({ 
    page: 0, 
    pageSize: initialPageSize 
  });
  const [filterModel, setFilterModel] = useState({
    items: [{ field: initialFilterColumn, operator: 'contains', value: '' }],
  });
  const [sortModel, setSortModel] = useState([
    { field: initialSortField, sort: initialSortOrder }
  ]);

  const lastRequestKeyRef = useRef(null);

  const fetchData = useCallback(
    async (extraFilters = {}) => {
      if (!fetchFunction) {
        console.error('fetchFunction is required');
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        const { __force, ...filters } = extraFilters || {};
        const requestKey = JSON.stringify({
          paginationModel,
          sortModel,
          filterModel,
          filters,
        });
        
        // Skip if same request (unless forced)
        if (!__force && lastRequestKeyRef.current === requestKey) {
          setLoading(false);
          return;
        }
        lastRequestKeyRef.current = requestKey;

        // Build filter payload using common utility
        const payload = buildFilterPayload(filterModel, filters);

        // Get sort parameters
        const sortField = sortModel?.[0]?.field || initialSortField;
        const sortOrder = sortModel?.[0]?.sort || initialSortOrder;
        
        // Call API - send field names as-is (camelCase), server will handle mapping
        const response = await fetchFunction(
          (paginationModel.page || 0) + 1,
          paginationModel.pageSize,
          sortField,  // Send as-is (camelCase)
          sortOrder,
          payload
        );

        // Normalize response shape
        const resData = response?.data;
        const itemsData = resData?.data?.items ?? resData?.items ?? [];
        
        // Get total count
        let totalCount = resData?.data?.totalCount ?? resData?.totalCount;
        
        // Normalize totalCount
        if (totalCount !== undefined && totalCount !== null) {
          const parsed = parseInt(totalCount, 10);
          if (Number.isNaN(parsed)) {
            totalCount = Array.isArray(itemsData) ? itemsData.length : 0;
          } else if (parsed <= 0 && Array.isArray(itemsData) && itemsData.length > 0) {
            totalCount = itemsData.length;
          } else {
            totalCount = parsed;
          }
        } else {
          totalCount = Array.isArray(itemsData) ? itemsData.length : 0;
        }

        // Fallback: if API returns all items, client-side slice to current page
        let finalItems = itemsData;
        const size = paginationModel.pageSize || initialPageSize;
        const pageIdx = paginationModel.page || 0;
        if (Array.isArray(itemsData) && itemsData.length > size) {
          const start = pageIdx * size;
          const end = start + size;
          finalItems = itemsData.slice(start, end);
        }

        setData(finalItems);
        setTotal(totalCount);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    },
    [fetchFunction, paginationModel, filterModel, sortModel, initialPageSize, initialSortField, initialSortOrder]
  );

  return {
    data,
    total,
    loading,
    error,
    paginationModel,
    setPaginationModel,
    filterModel,
    setFilterModel,
    sortModel,
    setSortModel,
    fetchData,
  };
}
