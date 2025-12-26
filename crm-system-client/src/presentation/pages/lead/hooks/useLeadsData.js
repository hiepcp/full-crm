import { useState, useCallback, useRef } from 'react';
import leadsApi from '@infrastructure/api/leadsApi';

function mapFieldToApi(field) {
  if (!field) return 'Id';
  // Map common UI fields to API columns (PascalCase)
  switch (field) {
    case 'id':
      return 'Id';
    case 'company':
      return 'Company';
    case 'email':
      return 'Email';
    case 'phone':
      return 'Phone';
    case 'source':
      return 'Source';
    case 'status':
      return 'Status';
    case 'score':
      return 'Score';
    case 'createdOn':
      return 'CreatedOn';
    case 'customerId':
      return 'CustomerId';
    default: {
      // Fallback: capitalize first letter
      return field.charAt(0).toUpperCase() + field.slice(1);
    }
  }
}

function mapOperatorToApi(op) {
  // Basic mapping; extend as backend supports more operators
  switch (op) {
    case 'contains':
      // Map DataGrid 'contains' to backend 'like'
      return 'like';
    case 'equals':
      return '=';
    case 'startsWith':
      return 'startsWith';
    case 'endsWith':
      return 'endsWith';
    default:
      return 'like';
  }
}

export default function useLeadsData({ initialFilterColumn = 'company', type = null } = {}) {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [filterModel, setFilterModel] = useState({
    items: [{ field: initialFilterColumn, operator: 'contains', value: '' }],
  });
  const [sortModel, setSortModel] = useState([{ field: 'id', sort: 'desc' }]);

  const lastRequestKeyRef = useRef(null);

  const fetchData = useCallback(
    async (extraFilters = {}) => {
      setLoading(true);
      setError(null);
      try {
        const { __force, ...filters } = extraFilters || {};
        const requestKey = JSON.stringify({
          paginationModel,
          sortModel,
          filterModel,
          filters,
          type,
        });
        if (!__force && lastRequestKeyRef.current === requestKey) {
          setLoading(false);
          return;
        }
        lastRequestKeyRef.current = requestKey;
        // Convert DataGrid filterModel to backend payload
        const payload = [];
        const items = filterModel?.items || [];
        items.forEach((it) => {
          const hasValue = it?.value !== undefined && it?.value !== null && String(it.value).length > 0;
          const field = it?.field || it?.columnField; // support legacy shape
          const operator = it?.operator || it?.operatorValue; // support legacy shape
          if (hasValue && field) {
            payload.push({
              column: mapFieldToApi(field),
              operator: mapOperatorToApi(operator),
              value: it.value,
            });
          }
        });

        // Append explicit filters from LeadFilters (status, source)
        const { status, source } = filters || {};
        if (status && status !== 'all') {
          payload.push({ column: 'Status', operator: '=', value: status });
        }
        if (source && source !== 'all') {
          payload.push({ column: 'Source', operator: '=', value: source });
        }

        const sortField = sortModel?.[0]?.field || 'id';
        const sortOrder = sortModel?.[0]?.sort || 'desc';
        const response = type !== null
          ? await leadsApi.getAllPagingByType(
              (paginationModel.page || 0) + 1,
              paginationModel.pageSize,
              mapFieldToApi(sortField),
              sortOrder,
              payload,
              type
            )
          : await leadsApi.getAllPaging(
              (paginationModel.page || 0) + 1,
              paginationModel.pageSize,
              mapFieldToApi(sortField),
              sortOrder,
              payload
            );

        // Try to normalize response shape
        const resData = response?.data;
        const itemsData = resData?.data?.items ?? resData?.items ?? [];
        // Try several common total keys
        let totalCount =
          resData?.data?.totalCount ??
          resData?.totalCount;
        // Normalize totalCount (may come as string or undefined)
        if (totalCount !== undefined && totalCount !== null) {
          const parsed = parseInt(totalCount, 10);
          if (Number.isNaN(parsed)) {
            totalCount = Array.isArray(itemsData) ? itemsData.length : 0;
          } else if (parsed <= 0 && Array.isArray(itemsData) && itemsData.length > 0) {
            // Fallback when API incorrectly reports 0 but items are present
            totalCount = itemsData.length;
          } else {
            totalCount = parsed;
          }
        } else {
          totalCount = Array.isArray(itemsData) ? itemsData.length : 0;
        }
        // Fallback: if API returns all items instead of paged items, client-slice to current page
        let finalItems = itemsData;
        const size = paginationModel.pageSize || 10;
        const pageIdx = paginationModel.page || 0;
        if (Array.isArray(itemsData) && itemsData.length > size) {
          const start = pageIdx * size;
          const end = start + size;
          finalItems = itemsData.slice(start, end);
        }

        setData(finalItems);
        setTotal(totalCount);
      } catch (err) {
        console.error('Error loading leads:', err);
        setError('Không thể tải dữ liệu');
      } finally {
        setLoading(false);
      }
    },
    [paginationModel, filterModel, sortModel, type]
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
