import React from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Box, Chip, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function CustomerDataGrid({
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
    navigate(`/customers/${params.id}`);
  };

  const columns = [
    {
      field: 'accountNum',
      headerName: 'Account #',
      width: 140,
      sortable: true,
      filterable: true,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
          {params.value || '-'}
        </Typography>
      ),
    },
    {
      field: 'name',
      headerName: 'Customer Name',
      flex: 1,
      minWidth: 220,
      sortable: true,
      filterable: true,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
            {params.value || '-'}
          </Typography>
          {params.row.nameAlias && params.row.nameAlias !== params.value && (
            <Typography variant="caption" color="text.secondary">
              {params.row.nameAlias}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      field: 'custGroup',
      headerName: 'Group',
      width: 100,
      sortable: true,
      filterable: true,
      renderCell: (params) => (
        <Chip
          label={params.value || '-'}
          size="small"
          variant="outlined"
          color="primary"
        />
      ),
    },
    {
      field: 'custClassificationId',
      headerName: 'Classification',
      width: 130,
      sortable: true,
      filterable: true,
      renderCell: (params) => {
        const classification = params.value || '-';
        const color = classification === 'In-Active' ? 'default' : 'success';
        return (
          <Chip
            label={classification}
            size="small"
            variant="outlined"
            color={color}
          />
        );
      },
    },
    {
      field: 'vatNum',
      headerName: 'VAT Number',
      width: 130,
      sortable: true,
      filterable: true,
    },
    {
      field: 'partyCountry',
      headerName: 'Country',
      width: 90,
      sortable: true,
      filterable: true,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
          {params.value || '-'}
        </Typography>
      ),
    },
    {
      field: 'currency',
      headerName: 'Currency',
      width: 90,
      sortable: true,
      filterable: true,
      renderCell: (params) => (
        <Chip
          label={params.value || 'USD'}
          size="small"
          variant="filled"
          sx={{ bgcolor: '#e3f2fd', color: '#1976d2', fontWeight: 'bold' }}
        />
      ),
    },
    {
      field: 'paymTermId',
      headerName: 'Payment',
      width: 100,
      sortable: true,
      filterable: true,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">
          {params.value || '-'}
        </Typography>
      ),
    },
    {
      field: 'salesResponsible',
      headerName: 'Sales Person',
      flex: 1,
      minWidth: 150,
      sortable: true,
      filterable: true,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">
          {params.value || '-'}
        </Typography>
      ),
    },
    {
      field: 'blocked',
      headerName: 'Status',
      width: 100,
      sortable: true,
      filterable: true,
      renderCell: (params) => {
        const isBlocked = params.value === 'Yes' || params.value === '1';
        return (
          <Chip
            label={isBlocked ? 'Blocked' : 'Active'}
            color={isBlocked ? 'error' : 'success'}
            size="small"
            variant="filled"
          />
        );
      },
    },
  ];

  return (
    <Box sx={{ height: 600, width: '100%' }}>
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
        sx={{
          '& .MuiDataGrid-row:hover': {
            cursor: 'pointer',
          },
        }}
        disableRowSelectionOnClick
        disableColumnFilter={false}
      />
    </Box>
  );
}
