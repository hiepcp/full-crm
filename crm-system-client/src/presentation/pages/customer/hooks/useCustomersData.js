import customersApi from '@infrastructure/api/customersApi';
import useDataGridData from '@presentation/hooks/useDataGridData';

/**
 * Hook for managing customer data with DataGrid
 * Uses generic useDataGridData hook with customer-specific configuration
 */
export default function useCustomersData({ initialFilterColumn = 'name' } = {}) {
  return useDataGridData({
    fetchFunction: customersApi.getAllPaging,
    initialFilterColumn,
    initialPageSize: 10,
    initialSortField: 'id',
    initialSortOrder: 'asc',
  });
}
