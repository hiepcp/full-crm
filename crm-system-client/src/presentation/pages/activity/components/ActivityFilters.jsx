import React from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem } from '@mui/material';

const ActivityFilters = ({ statusFilter, setStatusFilter, priorityFilter, setPriorityFilter }) => {
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
          <MenuItem value="open">Open</MenuItem>
          <MenuItem value="in_progress">In Progress</MenuItem>
          <MenuItem value="completed">Completed</MenuItem>
          <MenuItem value="overdue">Overdue</MenuItem>
          <MenuItem value="cancelled">Cancelled</MenuItem>
        </Select>
      </FormControl>

      <FormControl sx={{ minWidth: { xs: '100%', sm: 180 } }}>
        <InputLabel>Priority Filter</InputLabel>
        <Select
          value={priorityFilter}
          label="Priority Filter"
          onChange={(e) => setPriorityFilter(e.target.value)}
        >
          <MenuItem value="all">All Priorities</MenuItem>
          <MenuItem value="low">Low</MenuItem>
          <MenuItem value="normal">Normal</MenuItem>
          <MenuItem value="high">High</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
};

export default ActivityFilters;

