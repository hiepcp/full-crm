import React from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Box, Chip, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { getStatusColor, getPriorityColor, getActivityTypeIcon } from '../utils/activityUtils';
import { formatDate } from '../../../../utils/formatDate';

// Utility function to convert HTML to plain text
const htmlToText = (html) => {
  if (!html) return '';
  // Create a temporary DOM element to strip HTML tags
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  return tempDiv.textContent || tempDiv.innerText || '';
};

export default function ActivityDataGrid({
  data,
  total,
  loading,
  paginationModel,
  onPaginationModelChange,
  sortModel,
  onSortModelChange,
  filterModel,
  onFilterModelChange,
}) {
  const navigate = useNavigate();

  const handleRowClick = (params) => {
    navigate(`/activities/${params.id}`);
  };

  const columns = [
    {
      field: 'sourceFrom',
      headerName: 'Type',
      width: 80,
      sortable: true,
      filterable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <span style={{ fontSize: '1.25rem' }}>{getActivityTypeIcon(params.value)}</span>
        </Box>
      ),
    },
    {
      field: 'subject',
      headerName: 'Subject',
      flex: 1,
      minWidth: 250,
      sortable: true,
      filterable: true,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', py: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'medium', lineHeight: 1.3 }}>
            {params.value}
          </Typography>
          {params.row.body && (
            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.3, mt: 0.5 }}>
              {htmlToText(params.row.body).substring(0, 60)}...
            </Typography>
          )}
        </Box>
      ),
    },
    {
      field: 'relationType',
      headerName: 'Related To',
      width: 150,
      sortable: true,
      filterable: true,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
          {params.value} #{params.row.relationId}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      sortable: true,
      filterable: true,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getStatusColor(params.value)}
          variant="outlined"
          size="small"
        />
      ),
    },
    {
      field: 'priority',
      headerName: 'Priority',
      width: 120,
      sortable: true,
      filterable: true,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getPriorityColor(params.value)}
          variant="outlined"
          size="small"
        />
      ),
    },
    {
      field: 'dueAt',
      headerName: 'Due Date',
      width: 130,
      sortable: true,
      filterable: false,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">
          {params.value ? formatDate(params.value) : '-'}
        </Typography>
      ),
    },
    {
      field: 'createdOn',
      headerName: 'Created',
      width: 130,
      sortable: true,
      filterable: false,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">
          {formatDate(params.value)}
        </Typography>
      ),
    },
  ];

  return (
    <Box sx={{ minHeight: 560, maxHeight: 800, width: '100%' }}>
      <DataGrid
        rows={data}
        columns={columns}
        rowCount={total}
        loading={loading}
        pageSizeOptions={[5, 10, 25, 50]}
        paginationModel={paginationModel}
        paginationMode="server"
        onPaginationModelChange={onPaginationModelChange}
        sortingMode="server"
        sortModel={sortModel}
        onSortModelChange={onSortModelChange}
        filterMode="server"
        filterModel={filterModel}
        onFilterModelChange={onFilterModelChange}
        onRowClick={handleRowClick}
        getRowHeight={() => 'auto'}
        sx={{
          '& .MuiDataGrid-row:hover': {
            cursor: 'pointer',
          },
          '& .MuiDataGrid-cell': {
            py: 1,
          },
          minHeight: 560,
          maxHeight: 800,
        }}
        disableRowSelectionOnClick
        disableColumnFilter={false}
      />
    </Box>
  );
}
