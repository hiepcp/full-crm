import { useNavigate } from 'react-router-dom';
import { Box, Chip, Button, Tooltip, Typography, LinearProgress } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add as AddIcon } from '@mui/icons-material';
import { getStageColor } from '../utils/dealUtils';
import customersApi from '@infrastructure/api/customersApi';
import React, { useEffect, useState } from 'react';
import { formatDate } from '../../../../utils/formatDate';
import { formatCurrency } from '../../../../utils/formatCurrency';

const DealDataGrid = ({
  rows,
  rowCount,
  loading,
  paginationModel,
  onPaginationModelChange,
  sortModel,
  onSortModelChange,
  filterModel,
  onFilterModelChange,
  handleCreateActivity,
}) => {
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

  const columns = [
    {
      field: 'id',
      headerName: 'Id',
      width: 100,
      sortable: true,
      renderCell: (params) => (
        <Typography
          variant="body2"
          sx={{
            fontWeight: 'medium',
            color: 'primary.main',
            verticalAlign: 'middle',
            display: 'inline-block',
            cursor: 'pointer',
            '&:hover': { color: 'secondary.main', textDecoration: 'underline' },
          }}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/deals/${params.row.id}`);
          }}
        >
          {`Deal_${params.row.id}`}
        </Typography>
      ),
    },
    { field: 'name', headerName: 'Deal Name', flex: 1, minWidth: 180, sortable: true, filterable: true, },
    
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
      field: 'stage',
      headerName: 'Stage',
      width: 100,
      sortable: true,
      renderCell: (params) => (
        <Chip
          label={params.row.stage}
          color={getStageColor(params.row.stage)}
          variant="outlined"
          size='small'
        />
      ),
      filterable: true
    },
    {
      field: 'expectedRevenue',
      headerName: 'Expected Revenue',
      width: 140,
      sortable: true,
      renderCell: (params) => (
        <Typography variant="body2" sx={{
          display: 'inline-block',
          verticalAlign: 'middle',
          fontWeight: 'medium',
          color: 'success.main'
        }}>
          {formatCurrency(params.row.expectedRevenue)}
        </Typography>
      ),
      filterable: true,
    },
    {
      field: 'actualRevenue',
      headerName: 'Actual Revenue',
      width: 140,
      sortable: true,
      renderCell: (params) => (
        <Typography variant="body2" sx={{
          display: 'inline-block',
          verticalAlign: 'middle', fontWeight: 'medium', color: 'success.dark'
        }}>
          {formatCurrency(params.row.actualRevenue || 0)}
        </Typography>
      ),
    },
    {
      field: 'closeDate',
      headerName: 'Close Date',
      width: 140,
      sortable: true,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary" sx={{
          display: 'inline-block',
          verticalAlign: 'middle',
        }}>
          {formatDate(params.row.closeDate)}
        </Typography>
      ),
    },
    {
      field: 'description',
      headerName: 'Description',
      width: 200,
      sortable: true,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary" sx={{
          display: 'inline-block',
          verticalAlign: 'middle',
          textWrap: 'wrap',
        }}>
          {params.row.description || 'N/A'}
        </Typography>
      ),
    },
    {
      field: 'createdOn',
      headerName: 'Created',
      width: 140,
      sortable: true,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary" sx={{
          display: 'inline-block',
          verticalAlign: 'middle',
        }}>
          {formatDate(params.row.createdOn)}
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 130,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Tooltip title="Create Activity">
          <Button
            size="small"
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={(e) => {
              e.stopPropagation();
              handleCreateActivity?.(params.row);
            }}
            sx={{ minWidth: 'auto', px: 1, py: 0.5, fontSize: '0.75rem', textTransform: 'none' }}
          >
            Activity
          </Button>
        </Tooltip>
      ),
    },
  ];

  return (
    <Box sx={{ height: 560, width: '100%', mt: 1 }}>
      <DataGrid
        rows={rows}
        columns={columns}
        rowCount={rowCount}
        loading={loading}
        pagination
        paginationMode="server"
        paginationModel={paginationModel}
        onPaginationModelChange={onPaginationModelChange}
        pageSizeOptions={[5, 10, 25, 50, 100]}
        sortingMode="server"
        sortModel={sortModel}
        onSortModelChange={onSortModelChange}
        filterMode="server"
        filterModel={filterModel}
        onFilterModelChange={onFilterModelChange}
        disableRowSelectionOnClick
        getRowId={(row) => row.id}
        onRowClick={(params) => navigate(`/deals/${params.row.id}`)}
        getRowHeight={() => 'auto'}
      />
    </Box>
  );
};

export default DealDataGrid;
