import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  InputAdornment,
  Chip,
  Stack,
  Avatar,
  Pagination,
  CircularProgress,
  Autocomplete,
  Collapse,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Search as SearchIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Event as EventIcon,
  Task as TaskIcon,
  Note as NoteIcon,
  FilterList as FilterListIcon,
  AttachFile as AttachFileIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const ACTIVITY_CATEGORIES = {
  EMAIL: 'email',
  CALL: 'call',
  MEETING: 'meeting',
  NOTE: 'note'
};

const TIME_FILTERS = [
  { value: 'any', label: 'Any Time' },
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last7', label: 'Last 7 Days' },
  { value: 'last30', label: 'Last 30 Days' }
];

const CustomerActivityList = ({
  activities = [],
  loading = false,
  getUserById,
  onActivityClick,
  customersData = [],
  customersLoading = false,
  selectedCustomers = [],
  onCustomersChange,
  leadsData = [],
  leadsLoading = false,
  selectedLeads = [],
  onLeadsChange,
  dealsData = [],
  dealsLoading = false,
  selectedDeals = [],
  onDealsChange,
  // DataGrid mode
  DataGridComponent,
  // Disable customer filter (for use in customer detail page)
  disableCustomerFilter = false,
  hideAdvancedFiltersToggle = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('any');

  // When disableCustomerFilter is true, use props directly (shared state with parent)
  // When false, use local state for independent filtering
  const effectiveSelectedLeads = selectedLeads;
  const effectiveSelectedDeals = selectedDeals;
  const effectiveOnLeadsChange = onLeadsChange;
  const effectiveOnDealsChange = onDealsChange;

  // Get activity category
  const getActivityCategory = (activity) => {
    const src = (activity?.sourceFrom || '').toLowerCase();
    const typ = (activity?.activityType || '').toLowerCase();
    if (src.includes('email') || typ === 'email') return ACTIVITY_CATEGORIES.EMAIL;
    if (src.includes('phone-call') || typ === 'call') return ACTIVITY_CATEGORIES.CALL;
    if (src.includes('meeting') || typ === 'meeting' || typ === 'meeting-online' || typ === 'meeting-offline') return ACTIVITY_CATEGORIES.MEETING;
    if (src.includes('task') || typ === 'task') return ACTIVITY_CATEGORIES.TASK;
    if (src.includes('note') || typ === 'note') return ACTIVITY_CATEGORIES.NOTE;
    return ACTIVITY_CATEGORIES.EMAIL;
  };

  // Count by category
  const categoryCounts = useMemo(() => {
    const counts = {
      all: 0,
      [ACTIVITY_CATEGORIES.EMAIL]: 0,
      [ACTIVITY_CATEGORIES.CALL]: 0,
      [ACTIVITY_CATEGORIES.MEETING]: 0,
      [ACTIVITY_CATEGORIES.NOTE]: 0
    };
    // Ensure activities is an array
    const activitiesArray = Array.isArray(activities) ? activities : [];
    counts.all = activitiesArray.length;
    activitiesArray.forEach((a) => {
      const cat = getActivityCategory(a);
      if (counts[cat] !== undefined) counts[cat] += 1;
    });
    return counts;
  }, [activities]);

  // Filter activities
  const filteredActivities = useMemo(() => {
    // Ensure activities is an array
    const activitiesArray = Array.isArray(activities) ? activities : [];
    let list = [...activitiesArray];

    // Category filter
    if (categoryFilter !== 'all') {
      list = list.filter((a) => getActivityCategory(a) === categoryFilter);
    }

    // Time filter
    if (timeFilter !== 'any') {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(todayStart);
      todayEnd.setHours(23, 59, 59, 999);

      list = list.filter((activity) => {
        const activityDate = new Date(activity.createdOn);
        if (isNaN(activityDate.getTime())) return false;

        const t = activityDate.getTime();
        if (timeFilter === 'today') {
          return t >= todayStart.getTime() && t <= todayEnd.getTime();
        }
        if (timeFilter === 'yesterday') {
          const yesterdayStart = new Date(todayStart);
          yesterdayStart.setDate(yesterdayStart.getDate() - 1);
          const yesterdayEnd = new Date(yesterdayStart);
          yesterdayEnd.setHours(23, 59, 59, 999);
          return t >= yesterdayStart.getTime() && t <= yesterdayEnd.getTime();
        }
        if (timeFilter === 'last7') {
          const last7Start = new Date(todayStart);
          last7Start.setDate(last7Start.getDate() - 6);
          return t >= last7Start.getTime();
        }
        if (timeFilter === 'last30') {
          const last30Start = new Date(todayStart);
          last30Start.setDate(last30Start.getDate() - 29);
          return t >= last30Start.getTime();
        }
        return true;
      });
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      list = list.filter((activity) => {
        const subject = (activity.subject || '').toLowerCase();
        const body = (activity.body || '').toLowerCase();
        const user = getUserById ? getUserById(activity.ownerId) : null;
        const userName = user ? `${user.firstName} ${user.lastName}`.toLowerCase() : '';

        return subject.includes(query) || body.includes(query) || userName.includes(query);
      });
    }

    // Sort by date (newest first)
    return list.sort((a, b) => new Date(b.createdOn) - new Date(a.createdOn));
  }, [activities, categoryFilter, timeFilter, searchQuery, getUserById, selectedCustomers, selectedLeads, selectedDeals]);

  return (
    <Box>
      <Card sx={{ mb: 2, bgcolor: 'background.paper', boxShadow: 1 }}>
        <CardContent sx={{ py: 0.5, '&:last-child': { pb: 2 } }}>
          <Accordion
            defaultExpanded={true}
            disableGutters
            square
            sx={{
              boxShadow: 'none',
              '&:before': { display: 'none' },
            }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                <FilterListIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Advanced Filters
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {/* Customer Filter */}
                <Autocomplete
                  multiple
                  options={customersData}
                  value={selectedCustomers}
                  onChange={(event, newValue) => onCustomersChange?.(newValue)}
                  loading={customersLoading}
                  filterSelectedOptions
                  getOptionLabel={(option) => option.label || option.name}
                  isOptionEqualToValue={(option, value) => option.accountNum === value.accountNum}
                  disabled={disableCustomerFilter}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Filter by Customers"
                      placeholder="Select customers..."
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {customersLoading ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        label={option.name}
                        size="small"
                        {...getTagProps({ index })}
                      />
                    ))
                  }
                />

                {/* Lead Filter */}
                {selectedCustomers.length > 0 && (
                  <Autocomplete
                    multiple
                    options={leadsData}
                    value={effectiveSelectedLeads}
                    onChange={(event, newValue) => effectiveOnLeadsChange?.(newValue)}
                    loading={leadsLoading}
                    filterSelectedOptions
                    getOptionLabel={(option) => option.title || option.name || `Lead #${option.id}`}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Filter by Leads"
                        placeholder="Select leads..."
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {leadsLoading ? <CircularProgress color="inherit" size={20} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          label={option.title || option.name}
                          size="small"
                          color="primary"
                          {...getTagProps({ index })}
                        />
                      ))
                    }
                    disabled={leadsData.length === 0}
                  />
                )}

                {/* Deal Filter */}
                {selectedCustomers.length > 0 && (
                  <Autocomplete
                    multiple
                    options={dealsData}
                    value={effectiveSelectedDeals}
                    onChange={(event, newValue) => effectiveOnDealsChange?.(newValue)}
                    loading={dealsLoading}
                    filterSelectedOptions
                    getOptionLabel={(option) => option.title || option.name || `Deal #${option.id}`}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Filter by Deals"
                        placeholder="Select deals..."
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {dealsLoading ? <CircularProgress color="inherit" size={20} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          label={option.title || option.name}
                          size="small"
                          color="secondary"
                          {...getTagProps({ index })}
                        />
                      ))
                    }
                    disabled={dealsData.length === 0}
                  />
                )}

                {/* Search and Basic Filters */}
                {/* Search */}
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search by subject, body, or user name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" sx={{ fontSize: '1.2rem' }} />
                      </InputAdornment>
                    )
                  }}
                />

                {/* Filter Groups */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {/* Time Filter */}
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 600 }}>
                      🕒 Time Period:
                    </Typography>
                    <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', gap: 0.75 }}>
                      {TIME_FILTERS.map((filter) => (
                        <Chip
                          key={filter.value}
                          label={filter.label}
                          onClick={() => setTimeFilter(filter.value)}
                          color={timeFilter === filter.value ? 'secondary' : 'default'}
                          variant={timeFilter === filter.value ? 'filled' : 'outlined'}
                          size="medium"
                        />
                      ))}
                    </Stack>
                  </Box>

                  {/* Category Filter */}
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 600 }}>
                      📧 Activity Type:
                    </Typography>
                    <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', gap: 0.75 }}>
                      <Chip
                        label="All"
                        onClick={() => setCategoryFilter('all')}
                        color={categoryFilter === 'all' ? 'primary' : 'default'}
                        variant={categoryFilter === 'all' ? 'filled' : 'outlined'}
                        size="medium"
                      />
                      <Chip
                        icon={<EmailIcon />}
                        label={`Email (${categoryCounts[ACTIVITY_CATEGORIES.EMAIL]})`}
                        onClick={() => setCategoryFilter(ACTIVITY_CATEGORIES.EMAIL)}
                        color={categoryFilter === ACTIVITY_CATEGORIES.EMAIL ? 'primary' : 'default'}
                        variant={categoryFilter === ACTIVITY_CATEGORIES.EMAIL ? 'filled' : 'outlined'}
                        size="medium"
                      />
                      <Chip
                        icon={<PhoneIcon />}
                        label={`Call (${categoryCounts[ACTIVITY_CATEGORIES.CALL]})`}
                        onClick={() => setCategoryFilter(ACTIVITY_CATEGORIES.CALL)}
                        color={categoryFilter === ACTIVITY_CATEGORIES.CALL ? 'primary' : 'default'}
                        variant={categoryFilter === ACTIVITY_CATEGORIES.CALL ? 'filled' : 'outlined'}
                        size="medium"
                      />
                      <Chip
                        icon={<EventIcon />}
                        label={`Meeting (${categoryCounts[ACTIVITY_CATEGORIES.MEETING]})`}
                        onClick={() => setCategoryFilter(ACTIVITY_CATEGORIES.MEETING)}
                        color={categoryFilter === ACTIVITY_CATEGORIES.MEETING ? 'primary' : 'default'}
                        variant={categoryFilter === ACTIVITY_CATEGORIES.MEETING ? 'filled' : 'outlined'}
                        size="medium"
                      />
                      <Chip
                        icon={<NoteIcon />}
                        label={`Note (${categoryCounts[ACTIVITY_CATEGORIES.NOTE]})`}
                        onClick={() => setCategoryFilter(ACTIVITY_CATEGORIES.NOTE)}
                        color={categoryFilter === ACTIVITY_CATEGORIES.NOTE ? 'primary' : 'default'}
                        variant={categoryFilter === ACTIVITY_CATEGORIES.NOTE ? 'filled' : 'outlined'}
                        size="medium"
                      />
                    </Stack>
                  </Box>
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>
        </CardContent>
      </Card>

      {/* Activities List */}
      <Card sx={{ boxShadow: 2 }}>
        <CardContent>
          {
            // Render as DataGrid
            selectedCustomers.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8, bgcolor: 'background.default', borderRadius: 2 }}>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                  No customer selected
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Please select customers from the filters above to view activities
                </Typography>
              </Box>
            ) : (
              <DataGridComponent
                data={filteredActivities}
                loading={loading}
                onRowClick={onActivityClick}
                leadsData={leadsData}
                dealsData={dealsData}
              />
            )
          }
        </CardContent>
      </Card>

    </Box>
  );
};

export default CustomerActivityList;
