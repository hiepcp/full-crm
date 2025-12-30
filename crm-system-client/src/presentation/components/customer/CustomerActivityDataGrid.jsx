import React from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Box, Chip, Typography, Avatar } from '@mui/material';
import {
  Email as EmailIcon,
  Phone as PhoneIcon,
  Event as EventIcon,
  Note as NoteIcon
} from '@mui/icons-material';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

// Utility function to convert HTML to plain text
const htmlToText = (html) => {
  if (!html) return '';
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  return tempDiv.textContent || tempDiv.innerText || '';
};

// Get activity type icon
const getActivityTypeIcon = (sourceFrom) => {
  const src = (sourceFrom || '').toLowerCase();
  if (src.includes('email')) return <EmailIcon sx={{ fontSize: '1.1rem' }} />;
  if (src.includes('phone-call') || src.includes('call')) return <PhoneIcon sx={{ fontSize: '1.1rem' }} />;
  if (src.includes('meeting')) return <EventIcon sx={{ fontSize: '1.1rem' }} />;
  return <NoteIcon sx={{ fontSize: '1.1rem' }} />;
};

// Get activity type config
const getActivityTypeConfig = (sourceFrom) => {
  const src = (sourceFrom || '').toLowerCase();
  if (src.includes('email')) return { color: '#1976d2', bg: '#e3f2fd' };
  if (src.includes('phone-call') || src.includes('call')) return { color: '#2e7d32', bg: '#e8f5e9' };
  if (src.includes('meeting')) return { color: '#ed6c02', bg: '#fff4e5' };
  return { color: '#0288d1', bg: '#e1f5fe' };
};

export default function CustomerActivityDataGrid({
  data,
  loading,
  onRowClick,
  leadsData = [],
  dealsData = []
}) {
  const columns = [
    {
      field: 'sourceFrom',
      headerName: 'Type',
      width: 70,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const config = getActivityTypeConfig(params.value);
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: config.bg, color: config.color }}>
              {getActivityTypeIcon(params.value)}
            </Avatar>
          </Box>
        );
      },
    },
    {
      field: 'subject',
      headerName: 'Subject',
      flex: 1,
      minWidth: 300,
      sortable: true,
      filterable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', py: 0.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.3, fontSize: '0.875rem' }}>
            {params.value || 'No subject'}
          </Typography>
          {params.row.body && (
            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.3, mt: 0.25, fontSize: '0.75rem' }}>
              {htmlToText(params.row.body).substring(0, 80)}...
            </Typography>
          )}
        </Box>
      ),
    },
    {
      field: 'relationType',
      headerName: 'Related To',
      width: 200,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const relationType = params.value?.toLowerCase();
        const relationId = params.row.relationId;
        
        let relationName = '';
        if (relationType === 'lead') {
          const lead = leadsData.find(l => l.id === relationId);
          relationName = lead ? `Lead #${relationId}` : `Lead #${relationId}`;
        } else if (relationType === 'deal') {
          const deal = dealsData.find(d => d.id === relationId);
          relationName = deal ? (deal.title || deal.name) : `Deal #${relationId}`;
        }

        return relationName ? (
          <Chip
            label={`${relationName}`}
            size="small"
            sx={{
              fontSize: '0.7rem',
              height: 20,
              fontWeight: 600,
              bgcolor: relationType === 'lead' ? '#e3f2fd' : '#e8f5e9',
              color: relationType === 'lead' ? '#1565c0' : '#2e7d32'
            }}
          />
        ) : (
          <Typography variant="caption" color="text.secondary">-</Typography>
        );
      },
    },
    {
      field: 'ownerId',
      headerName: 'Owner',
      width: 150,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
          User #{params.value || '-'}
        </Typography>
      ),
    },
    {
      field: 'createdOn',
      headerName: 'Created',
      width: 150,
      sortable: true,
      filterable: false,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
          {dayjs(params.value).fromNow()}
        </Typography>
      ),
    },
    {
      field: 'attachments',
      headerName: 'Attachments',
      width: 110,
      sortable: false,
      filterable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        const count = params.row.attachments?.length || params.row.activityAttachments?.length || 0;
        return count > 0 ? (
          <Chip
            label={count}
            size="small"
            color="primary"
            variant="outlined"
            sx={{ fontSize: '0.7rem', height: 18 }}
          />
        ) : (
          <Typography variant="caption" color="text.secondary">-</Typography>
        );
      },
    },
  ];

  return (
    <Box sx={{ width: '100%', height: 600 }}>
      <DataGrid
        rows={data}
        columns={columns}
        loading={loading}
        pageSizeOptions={[10, 25, 50, 100]}
        initialState={{
          pagination: {
            paginationModel: { pageSize: 25, page: 0 },
          },
        }}
        onRowClick={(params) => onRowClick?.(params.row)}
        getRowId={(row) => row.activityId || row.id}
        getRowHeight={() => 'auto'}
        sx={{
          '& .MuiDataGrid-row:hover': {
            cursor: 'pointer',
            bgcolor: 'action.hover',
          },
          '& .MuiDataGrid-cell': {
            py: 0.75,
          },
          '& .MuiDataGrid-columnHeaders': {
            bgcolor: 'background.default',
            fontWeight: 600,
          },
        }}
        disableRowSelectionOnClick
        disableColumnMenu
      />
    </Box>
  );
}
