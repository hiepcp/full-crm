import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { Box, Chip, Button, Tooltip, Typography, LinearProgress } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add as AddIcon } from '@mui/icons-material';
import { getStatusColor, getSourceColor, getScoreColor } from '../utils/leadUtils';
import { formatDate } from '../../../../utils/formatDate';

const LeadsDataGrid = ({
  rows,
  rowCount,
  loading,
  paginationModel,
  onPaginationModelChange,
  sortModel,
  onSortModelChange,
  filterModel,
  onFilterModelChange,
  onCreateActivity,
}) => {
  const navigate = useNavigate();
  const theme = useTheme();

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
            cursor: 'pointer',
            '&:hover': { color: 'secondary.main', textDecoration: 'underline' },
          }}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/leads/${params.row.id}`);
          }}
        >
          {`Lead_${params.row.id}`}
        </Typography>
      ),
    },
    {
      field: 'company',
      headerName: 'Company',
      flex: 1,
      minWidth: 180,
      sortable: true,
      renderCell: (params) => {
        const { company, website, customerId } = params.row;
        const hasCustomer = Boolean(customerId);

        return (
          <Box sx={{ lineHeight: 1.1 }}>
            <Typography
              variant="body2"
              onClick={hasCustomer ? (e) => {
                e.stopPropagation();
                navigate(`/customers/${customerId}`);
              } : undefined}
              sx={hasCustomer ? {
                color: 'primary.main',
                cursor: 'pointer',
                '&:hover': { color: 'secondary.main', textDecoration: 'underline' },
              } : { color: 'text.' }}
            >
              {company}
            </Typography>
            {website && (
              <Typography variant="caption" color="text.secondary">
                {website}
              </Typography>
            )}
          </Box>
        );
      },
      filterable: true,
    },
    { field: 'email', headerName: 'Email', flex: 1, minWidth: 180, sortable: true, filterable: true },
    { field: 'telephoneNo', headerName: 'Telephone No', width: 160, sortable: true, filterable: true },
    {
      field: 'source',
      headerName: 'Source',
      width: 140,
      sortable: true,
      renderCell: (params) => (
        <Chip label={params.row.source} color={getSourceColor(params.row.source)} variant="outlined" />
      ),
      filterable: true,
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 140,
      sortable: true,
      renderCell: (params) => (
        <Chip label={params.row.status} color={getStatusColor(params.row.status)} variant="outlined" />
      ),
      filterable: true,
    },
    {
      field: 'score',
      headerName: 'Score',
      width: 140,
      sortable: true,
      renderCell: (params) => {
        const scoreColor = getScoreColor(params.row.score);
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 'medium',
                color: theme.palette[scoreColor].main
              }}
            >
              {params.row.score}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={Number(params.row.score) || 0}
              sx={{
                width: 64,
                height: 8,
                borderRadius: 4,
                '& .MuiLinearProgress-bar': {
                  backgroundColor: theme.palette[scoreColor].main,
                },
              }}
            />
          </Box>
        );
      },
    },
    {
      field: 'createdOn',
      headerName: 'Created',
      width: 160,
      sortable: true,
      renderCell: (params) => {
        const dateVal = (params && params.row && params.row.createdOn) || params.value || null;
        return (
          <Typography variant="body2" color="text.secondary">
            {dateVal ? formatDate(dateVal) : ''}
          </Typography>
        );
      },
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
              onCreateActivity?.(params.row);
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
    <Box sx={{ minHeight: 560, maxHeight: 800, width: '100%', mt: 1 }}>
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
        onRowClick={(params) => navigate(`/leads/${params.row.id}`)}
      />
    </Box>
  );
};

export default LeadsDataGrid;
