import React, { useState, useEffect } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  TextField,
  Grid,
  Button,
  Chip
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
import { filterActivities } from '../../../infrastructure/api/activitiesApi';

/**
 * ActivityList Component
 * Feature 006-contract-activity-fields: Added contract date and value columns and filters
 * T034 [US3]: Added contract date and value columns to activity list table
 * T036 [US3]: Added date range filter UI component
 * T037 [US3]: Added value range filter UI component
 */
const ActivityList = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);

  // T036 [US3]: Date range filter state
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    contractDateFrom: null,
    contractDateTo: null,
    contractValueMin: null,
    contractValueMax: null
  });

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const data = await filterActivities(filters);
      setActivities(data.items || []);
    } catch (error) {
      console.error('Failed to load activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field) => (event) => {
    setFilters({ ...filters, [field]: event.target.value });
  };

  const handleDateFilterChange = (field) => (newDate) => {
    setFilters({ ...filters, [field]: newDate });
  };

  const handleApplyFilters = () => {
    loadActivities();
  };

  const handleClearFilters = () => {
    setFilters({
      type: '',
      status: '',
      contractDateFrom: null,
      contractDateTo: null,
      contractValueMin: null,
      contractValueMax: null
    });
    // Reload with empty filters
    setTimeout(() => loadActivities(), 0);
  };

  // Format date for display
  const formatDate = (date) => {
    if (!date) return '-';
    try {
      return format(new Date(date), 'PP'); // e.g., "Jan 15, 2025"
    } catch (error) {
      return '-';
    }
  };

  // T034 [US3]: Format currency for contract value column
  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Activities
        </Typography>

        {/* Filters Section */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Filters
          </Typography>
          <Grid container spacing={2}>
            {/* Existing filters */}
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                select
                label="Type"
                value={filters.type}
                onChange={handleFilterChange('type')}
                SelectProps={{ native: true }}
              >
                <option value="">All Types</option>
                <option value="contract">Contract</option>
                <option value="call">Call</option>
                <option value="meeting">Meeting</option>
                <option value="email">Email</option>
                <option value="task">Task</option>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                select
                label="Status"
                value={filters.status}
                onChange={handleFilterChange('status')}
                SelectProps={{ native: true }}
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </TextField>
            </Grid>

            {/* NEW: T036 [US3] - Contract Date Range Filters */}
            <Grid item xs={12} sm={6} md={3}>
              <DatePicker
                label="Contract Date From"
                value={filters.contractDateFrom}
                onChange={handleDateFilterChange('contractDateFrom')}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <DatePicker
                label="Contract Date To"
                value={filters.contractDateTo}
                onChange={handleDateFilterChange('contractDateTo')}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Grid>

            {/* NEW: T037 [US3] - Contract Value Range Filters */}
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                type="number"
                label="Min Contract Value"
                value={filters.contractValueMin || ''}
                onChange={handleFilterChange('contractValueMin')}
                inputProps={{ min: 0, step: 1000 }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                type="number"
                label="Max Contract Value"
                value={filters.contractValueMax || ''}
                onChange={handleFilterChange('contractValueMax')}
                inputProps={{ min: 0, step: 1000 }}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button variant="contained" onClick={handleApplyFilters}>
                  Apply Filters
                </Button>
                <Button variant="outlined" onClick={handleClearFilters}>
                  Clear Filters
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Activities Table */}
        {/* T034 [US3]: Added contract date and value columns */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Due Date</TableCell>
                {/* NEW COLUMNS (Feature 006-contract-activity-fields) */}
                <TableCell>Contract Date</TableCell>
                <TableCell align="right">Contract Value</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : activities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No activities found
                  </TableCell>
                </TableRow>
              ) : (
                activities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell>{activity.id}</TableCell>
                    <TableCell>{activity.name}</TableCell>
                    <TableCell>
                      <Chip label={activity.type} size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={activity.status}
                        size="small"
                        color={
                          activity.status === 'completed'
                            ? 'success'
                            : activity.status === 'cancelled'
                            ? 'error'
                            : 'default'
                        }
                      />
                    </TableCell>
                    <TableCell>{formatDate(activity.dueDate)}</TableCell>
                    {/* T034 [US3]: Display contract date */}
                    <TableCell>
                      {activity.type === 'contract'
                        ? formatDate(activity.contractDate)
                        : '-'}
                    </TableCell>
                    {/* T034 [US3]: Display contract value with currency formatting */}
                    <TableCell align="right">
                      {activity.type === 'contract'
                        ? formatCurrency(activity.contractValue)
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Button size="small" variant="outlined">
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </LocalizationProvider>
  );
};

export default ActivityList;
