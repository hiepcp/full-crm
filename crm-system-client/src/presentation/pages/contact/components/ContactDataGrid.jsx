import React, { useEffect, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Box, Chip, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../../../../utils/formatDate';
import customersApi from '@infrastructure/api/customersApi';

export default function ContactDataGrid({
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
  const [customers, setCustomers] = useState({});

  // Load all customers once and build lookup map
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        // Load all customers at once
        const response = await customersApi.getAll();
        const data = response?.data?.data || response?.data;
        const customersList = data?.items || data || [];

        // Build customer lookup map by ID
        const customerMap = {};
        customersList.forEach(customer => {
          if (customer && customer.id) {
            customerMap[customer.id] = customer;
          }
        });

        setCustomers(customerMap);
      } catch (error) {
        console.error('Error loading customers:', error);
      }
    };

    loadCustomers();
  }, []); // Load once on component mount

  const handleRowClick = (params) => {
    navigate(`/contacts/${params.id}`);
  };

  const columns = [
    {
      field: 'id',
      headerName: 'ID',
      width: 80,
      sortable: true,
      filterable: true,
    },
    {
      field: 'salutation',
      headerName: 'Title',
      width: 80,
      sortable: true,
      filterable: true,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">
          {params.value || '-'}
        </Typography>
      ),
    },
    {
      field: 'firstName',
      headerName: 'First Name',
      flex: 1,
      minWidth: 130,
      sortable: true,
      filterable: true,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'lastName',
      headerName: 'Last Name',
      flex: 1,
      minWidth: 130,
      sortable: true,
      filterable: true,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'email',
      headerName: 'Email',
      flex: 1,
      minWidth: 200,
      sortable: true,
      filterable: true,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ color: '#0176d3' }}>
          {params.value || '-'}
        </Typography>
      ),
    },
    {
      field: 'phone',
      headerName: 'Phone',
      width: 140,
      sortable: true,
      filterable: true,
      renderCell: (params) => (
        <Typography variant="body2">
          {params.value || '-'}
        </Typography>
      ),
    },
    {
      field: 'mobilePhone',
      headerName: 'Mobile',
      width: 140,
      sortable: true,
      filterable: true,
      renderCell: (params) => (
        <Typography variant="body2">
          {params.value || '-'}
        </Typography>
      ),
    },
    {
      field: 'jobTitle',
      headerName: 'Job Title',
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
      field: 'customerId',
      headerName: 'Customer',
      flex: 1,
      minWidth: 180,
      sortable: true,
      filterable: true,
      renderCell: (params) => {
        const customer = customers[params.value];
        const customerName = customer?.name || `Customer ${params.value}`;
        
        return params.value ? (
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'primary.main',
              cursor: 'pointer',
              '&:hover': { 
                textDecoration: 'underline' 
              }
            }}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/customers/${params.value}`);
            }}
          >
            {customerName}
          </Typography>
        ) : (
          <Typography variant="body2" color="text.secondary">
            -
          </Typography>
        );
      },
    },
    {
      field: 'isPrimary',
      headerName: 'Status',
      width: 110,
      sortable: true,
      filterable: true,
      renderCell: (params) => (
        params.value ? (
          <Chip label="Primary" color="primary" variant="outlined" size="small" />
        ) : (
          <Chip label="Standard" variant="outlined" size="small" />
        )
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
        sx={{
          '& .MuiDataGrid-row:hover': {
            cursor: 'pointer',
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
