import contactsApi from '@infrastructure/api/contactsApi';
import useDataGridData from '@presentation/hooks/useDataGridData';

/**
 * Hook for managing contact data with DataGrid
 * Uses generic useDataGridData hook with contact-specific configuration
 */
export default function useContactsData({ initialFilterColumn = 'firstName' } = {}) {
  return useDataGridData({
    fetchFunction: contactsApi.getAllPaging,
    initialFilterColumn,
    initialPageSize: 10,
    initialSortField: 'id',
    initialSortOrder: 'asc',
  });
}
