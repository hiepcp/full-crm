import activitiesApi from '@infrastructure/api/activitiesApi';
import useDataGridData from '@presentation/hooks/useDataGridData';

/**
 * Hook for managing activity data with DataGrid
 * Uses generic useDataGridData hook with activity-specific configuration
 */
export default function useActivitiesData({ initialFilterColumn = 'subject' } = {}) {
  return useDataGridData({
    fetchFunction: activitiesApi.getAllPaging,
    initialFilterColumn,
    initialPageSize: 10,
    initialSortField: 'createdOn',
    initialSortOrder: 'desc',
  });
}
