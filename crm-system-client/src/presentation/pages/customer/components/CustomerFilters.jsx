import React from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem } from '@mui/material';

const CustomerFilters = ({ typeFilter, setTypeFilter }) => {
  return (
    <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
      <FormControl sx={{ minWidth: { xs: '100%', sm: 200 } }}>
        <InputLabel>Type Filter</InputLabel>
        <Select
          value={typeFilter}
          label="Type Filter"
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <MenuItem value="all">All Types</MenuItem>
          <MenuItem value="Customer">Customer</MenuItem>
          <MenuItem value="Prospect">Prospect</MenuItem>
          <MenuItem value="Partner">Partner</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
};

export default CustomerFilters;


