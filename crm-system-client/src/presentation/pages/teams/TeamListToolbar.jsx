import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  TextField,
  Button,
  IconButton,
  Stack,
  Chip,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Popover,
  Typography,
  Divider,
  InputAdornment
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Add as AddIcon
} from '@mui/icons-material';

const TeamListToolbar = ({
  onSearch,
  onFilterChange,
  onCreateTeam,
  selectedCount = 0,
  onBulkDelete
}) => {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    memberCount: '',
    dateRange: '',
    sortBy: 'createdOn'
  });
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [activeFilters, setActiveFilters] = useState([]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const handleSearchSubmit = () => {
    onSearch(search);
  };

  const handleFilterClick = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const handleFilterChange = (field, value) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);

    // Update active filters display
    const active = Object.entries(newFilters)
      .filter(([key, val]) => val && key !== 'sortBy')
      .map(([key, val]) => ({ key, value: val }));
    setActiveFilters(active);

    onFilterChange(newFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      memberCount: '',
      dateRange: '',
      sortBy: 'createdOn'
    };
    setFilters(clearedFilters);
    setActiveFilters([]);
    onFilterChange(clearedFilters);
    handleFilterClose();
  };

  const handleRemoveFilter = (filterKey) => {
    handleFilterChange(filterKey, '');
  };

  const filterOpen = Boolean(filterAnchorEl);

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        justifyContent="space-between"
      >
        {/* Search Bar */}
        <Stack direction="row" spacing={1} sx={{ flex: 1, maxWidth: { sm: 500 } }}>
          <TextField
            fullWidth
            placeholder="Search teams by name..."
            value={search}
            onChange={handleSearchChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearchSubmit();
              }
            }}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'action.active' }} />
                </InputAdornment>
              ),
              endAdornment: search && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => {
                      setSearch('');
                      onSearch('');
                    }}
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          <Button
            variant="outlined"
            onClick={handleSearchSubmit}
            disabled={!search}
            sx={{ minWidth: 100 }}
          >
            Search
          </Button>
        </Stack>

        {/* Action Buttons */}
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={handleFilterClick}
            sx={{
              borderColor: activeFilters.length > 0 ? 'primary.main' : 'divider',
              bgcolor: activeFilters.length > 0 ? 'primary.50' : 'transparent'
            }}
          >
            Filters
            {activeFilters.length > 0 && (
              <Chip
                label={activeFilters.length}
                size="small"
                color="primary"
                sx={{ ml: 1, height: 20, minWidth: 20 }}
              />
            )}
          </Button>

          {selectedCount > 0 && (
            <Button
              variant="outlined"
              color="error"
              onClick={onBulkDelete}
            >
              Delete ({selectedCount})
            </Button>
          )}

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onCreateTeam}
          >
            Create Team
          </Button>
        </Stack>
      </Stack>

      {/* Active Filters Display */}
      {activeFilters.length > 0 && (
        <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap">
          <Typography variant="body2" sx={{ alignSelf: 'center', color: 'text.secondary' }}>
            Active filters:
          </Typography>
          {activeFilters.map((filter) => (
            <Chip
              key={filter.key}
              label={`${filter.key}: ${filter.value}`}
              size="small"
              onDelete={() => handleRemoveFilter(filter.key)}
              sx={{ mb: 1 }}
            />
          ))}
          <Chip
            label="Clear all"
            size="small"
            variant="outlined"
            onClick={handleClearFilters}
            sx={{ mb: 1 }}
          />
        </Stack>
      )}

      {/* Filter Popover */}
      <Popover
        open={filterOpen}
        anchorEl={filterAnchorEl}
        onClose={handleFilterClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
      >
        <Box sx={{ p: 3, minWidth: 320 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Advanced Filters
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Stack spacing={2}>
            {/* Member Count Filter */}
            <FormControl fullWidth size="small">
              <InputLabel>Member Count</InputLabel>
              <Select
                value={filters.memberCount}
                label="Member Count"
                onChange={(e) => handleFilterChange('memberCount', e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="0-5">0-5 members</MenuItem>
                <MenuItem value="6-10">6-10 members</MenuItem>
                <MenuItem value="11-20">11-20 members</MenuItem>
                <MenuItem value="21+">21+ members</MenuItem>
              </Select>
            </FormControl>

            {/* Date Range Filter */}
            <FormControl fullWidth size="small">
              <InputLabel>Created Date</InputLabel>
              <Select
                value={filters.dateRange}
                label="Created Date"
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              >
                <MenuItem value="">All time</MenuItem>
                <MenuItem value="today">Today</MenuItem>
                <MenuItem value="week">This week</MenuItem>
                <MenuItem value="month">This month</MenuItem>
                <MenuItem value="quarter">This quarter</MenuItem>
                <MenuItem value="year">This year</MenuItem>
              </Select>
            </FormControl>

            {/* Sort By */}
            <FormControl fullWidth size="small">
              <InputLabel>Sort By</InputLabel>
              <Select
                value={filters.sortBy}
                label="Sort By"
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              >
                <MenuItem value="createdOn">Newest First</MenuItem>
                <MenuItem value="createdOn-asc">Oldest First</MenuItem>
                <MenuItem value="name">Name (A-Z)</MenuItem>
                <MenuItem value="name-desc">Name (Z-A)</MenuItem>
                <MenuItem value="memberCount">Most Members</MenuItem>
                <MenuItem value="memberCount-asc">Least Members</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button onClick={handleClearFilters} size="small">
              Clear All
            </Button>
            <Button variant="contained" onClick={handleFilterClose} size="small">
              Apply
            </Button>
          </Stack>
        </Box>
      </Popover>
    </Box>
  );
};

TeamListToolbar.propTypes = {
  onSearch: PropTypes.func.isRequired,
  onFilterChange: PropTypes.func.isRequired,
  onCreateTeam: PropTypes.func.isRequired,
  selectedCount: PropTypes.number,
  onBulkDelete: PropTypes.func.isRequired
};

TeamListToolbar.defaultProps = {
  selectedCount: 0
};

export default TeamListToolbar;
