import React from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { LEAD_STATUSES, LEAD_SOURCES_CREATE } from '../../../../utils/constants';

const LeadFilters = ({ statusFilter, setStatusFilter, sourceFilter, setSourceFilter }) => {
  return (
    <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
      <FormControl sx={{ minWidth: { xs: '100%', sm: 180 } }}>
        <InputLabel>Status Filter</InputLabel>
        <Select
          value={statusFilter}
          label="Status Filter"
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <MenuItem value="all">All Status</MenuItem>
          {LEAD_STATUSES.map((status) => (
            <MenuItem key={status.value} value={status.value}>
              {status.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl sx={{ minWidth: { xs: '100%', sm: 180 } }}>
        <InputLabel>Source Filter</InputLabel>
        <Select
          value={sourceFilter}
          label="Source Filter"
          onChange={(e) => setSourceFilter(e.target.value)}
        >
          <MenuItem value="all">All Sources</MenuItem>
          {LEAD_SOURCES_CREATE.map((source) => (
            <MenuItem key={source.value} value={source.value}>
              {source.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default LeadFilters;

