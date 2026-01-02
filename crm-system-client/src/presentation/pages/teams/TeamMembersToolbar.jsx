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
  PersonAdd as PersonAddIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { TEAM_ROLES } from '../../../utils/constants';

const TeamMembersToolbar = ({
  onSearch,
  onFilterChange,
  onAddMember,
  selectedCount = 0,
  onBulkRemove,
  onExport
}) => {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    role: '',
    sortBy: 'joinedAt'
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
      role: '',
      sortBy: 'joinedAt'
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
            placeholder="Search by name or email..."
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

          {onExport && (
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={onExport}
            >
              Export
            </Button>
          )}

          {selectedCount > 0 && (
            <Button
              variant="outlined"
              color="error"
              onClick={onBulkRemove}
            >
              Remove ({selectedCount})
            </Button>
          )}

          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={onAddMember}
          >
            Add Member
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
            Filter Members
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Stack spacing={2}>
            {/* Role Filter */}
            <FormControl fullWidth size="small">
              <InputLabel>Role</InputLabel>
              <Select
                value={filters.role}
                label="Role"
                onChange={(e) => handleFilterChange('role', e.target.value)}
              >
                <MenuItem value="">All Roles</MenuItem>
                {TEAM_ROLES.map((role) => (
                  <MenuItem key={role.value} value={role.value}>
                    {role.label}
                  </MenuItem>
                ))}
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
                <MenuItem value="joinedAt">Recently Joined</MenuItem>
                <MenuItem value="joinedAt-asc">Oldest Members</MenuItem>
                <MenuItem value="name">Name (A-Z)</MenuItem>
                <MenuItem value="name-desc">Name (Z-A)</MenuItem>
                <MenuItem value="role">Role</MenuItem>
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

TeamMembersToolbar.propTypes = {
  onSearch: PropTypes.func.isRequired,
  onFilterChange: PropTypes.func.isRequired,
  onAddMember: PropTypes.func.isRequired,
  selectedCount: PropTypes.number,
  onBulkRemove: PropTypes.func.isRequired,
  onExport: PropTypes.func
};

TeamMembersToolbar.defaultProps = {
  selectedCount: 0,
  onExport: null
};

export default TeamMembersToolbar;
