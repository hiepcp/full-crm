import React from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Chip, Box, Tooltip } from '@mui/material';
import { Email as EmailIcon, Phone as PhoneIcon, Business as BusinessIcon } from '@mui/icons-material';

/**
 * DraftLeadsDataGrid - Specialized DataGrid for draft leads
 * Displays columns relevant to draft lead information
 * Click on row opens detail dialog instead of navigating to detail page
 * Supports checkbox selection for bulk activation
 */
const DraftLeadsDataGrid = ({
  rows = [],
  rowCount = 0,
  loading = false,
  paginationModel,
  onPaginationModelChange,
  sortModel,
  onSortModelChange,
  filterModel,
  onFilterModelChange,
  onRowClick,
  rowSelectionModel = [],
  onRowSelectionModelChange
}) => {
  
  const columns = [
    {
      field: 'id',
      headerName: 'ID',
      width: 80,
      filterable: true,
      sortable: true,
    },
    {
      field: 'company',
      headerName: 'Company',
      flex: 1,
      minWidth: 200,
      filterable: true,
      sortable: true,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BusinessIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
          <Tooltip title={params.value || ''}>
            <span>{params.value || '-'}</span>
          </Tooltip>
        </Box>
      ),
    },
    {
      field: 'email',
      headerName: 'Email',
      flex: 1,
      minWidth: 220,
      filterable: true,
      sortable: true,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EmailIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
          <Tooltip title={params.value || ''}>
            <span>{params.value || '-'}</span>
          </Tooltip>
        </Box>
      ),
    },
    {
      field: 'telephoneNo',
      headerName: 'Telephone',
      width: 150,
      filterable: true,
      sortable: true,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PhoneIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
          <span>{params.value || '-'}</span>
        </Box>
      ),
    },
    {
      field: 'country',
      headerName: 'Country',
      width: 120,
      filterable: true,
      sortable: true,
      renderCell: (params) => (
        <Chip 
          label={params.value || 'N/A'} 
          size="small" 
          variant="outlined"
          sx={{ fontWeight: 500 }}
        />
      ),
    },
    {
      field: 'website',
      headerName: 'Website',
      width: 180,
      filterable: true,
      sortable: true,
      renderCell: (params) => (
        <Tooltip title={params.value || ''}>
          <span style={{ 
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            whiteSpace: 'nowrap',
            display: 'block'
          }}>
            {params.value || '-'}
          </span>
        </Tooltip>
      ),
    },
    {
      field: 'createdOn',
      headerName: 'Submitted Date',
      width: 160,
      filterable: false,
      sortable: true,
      valueFormatter: (params) => {
        if (!params.value) return '-';
        const date = new Date(params.value);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      },
    },
    {
      field: 'type',
      headerName: 'Status',
      width: 100,
      filterable: false,
      sortable: false,
      renderCell: (params) => (
        <Chip 
          label="Draft" 
          size="small" 
          color="warning"
          sx={{ fontWeight: 500 }}
        />
      ),
    },
  ];

  return (
    <Box sx={{ width: '100%', mt: 2 }}>
      <DataGrid
        rows={rows}
        columns={columns}
        rowCount={rowCount}
        loading={loading}
        pageSizeOptions={[5, 10, 25, 50, 100]}
        paginationModel={paginationModel}
        paginationMode="server"
        onPaginationModelChange={onPaginationModelChange}
        sortingMode="server"
        sortModel={sortModel}
        onSortModelChange={onSortModelChange}
        filterMode="server"
        filterModel={filterModel}
        onFilterModelChange={onFilterModelChange}
        onRowClick={onRowClick}
        checkboxSelection
        rowSelectionModel={rowSelectionModel}
        onRowSelectionModelChange={onRowSelectionModelChange}
        disableRowSelectionOnClick
        autoHeight
        sx={{
          '& .MuiDataGrid-row': {
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          },
          '& .MuiDataGrid-cell': {
            borderBottom: '1px solid',
            borderColor: 'divider',
          },
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: 'background.default',
            borderBottom: '2px solid',
            borderColor: 'divider',
          },
        }}
      />
    </Box>
  );
};

export default DraftLeadsDataGrid;
