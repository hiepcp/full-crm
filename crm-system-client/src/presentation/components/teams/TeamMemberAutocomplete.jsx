import { useState, useEffect } from 'react';
import { Autocomplete, TextField, CircularProgress, Box } from '@mui/material';
import { usersApi } from '../../../infrastructure/api/usersApi';

const TeamMemberAutocomplete = ({ value, onChange, ...props }) => {
  const [search, setSearch] = useState('');
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const fetchUsers = async () => {
      if (debouncedSearch && debouncedSearch.length > 2) {
        setLoading(true);
        try {
          const response = await usersApi.getAllPaging({
            page: 1,
            pageSize: 20,
            sortColumn: 'Email',
            sortOrder: 'asc',
            payload: { email: debouncedSearch }
          });

          if (response.data?.items) {
            setOptions(response.data.items.map(user => ({
              id: user.id,
              email: user.email,
              displayName: user.email,
              firstName: user.firstName || '',
              lastName: user.lastName || ''
            })));
          } else {
            setOptions([]);
          }
        } catch (err) {
          console.error('Error fetching users:', err);
        } finally {
          setLoading(false);
        }
      } else {
        setOptions([]);
      }
    };

    fetchUsers();
  }, [debouncedSearch]);

  const handleInputChange = (event, newValue) => {
    setSearch(newValue);
  };

  const handleOptionSelected = (event, option) => {
    if (onChange) {
      onChange(option);
    }
  };

  const handleClear = () => {
    setSearch('');
    setOptions([]);
  };

  return (
    <Autocomplete
      {...props}
      options={options}
      getOptionLabel={(option) => option ? option.displayName : ''}
      value={value}
      onChange={handleOptionSelected}
      onInputChange={handleInputChange}
      isOptionEqualToValue={(option, value) => option?.id === value?.id}
      loading={loading}
      filterOptions={(options, params) => {
        const { inputValue } = params;
        return options.some(option =>
          option.displayName?.toLowerCase().includes(inputValue?.toLowerCase() || '')
        );
      }}
      renderInput={(params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
          <TextField
            {...params}
            placeholder="Search user by email..."
            label="User"
            variant="outlined"
            size="small"
            InputProps={{
              endAdornment: (
                <Box sx={{ position: 'absolute', right: 8 }}>
                  {loading && <CircularProgress size={20} />}
                  {!loading && params.InputProps.value && (
                    <Box
                      component="span"
                      sx={{
                        position: 'absolute',
                        right: 25,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        cursor: 'pointer'
                      }}
                      onClick={handleClear}
                    >
                      ✕
                    </Box>
                  )}
                </Box>
              )
            }}
          />
        </Box>
      )}
      renderOption={(props, option) => (
        <Box component="li" {...props} sx={{ fontSize: '0.9rem' }}>
          <Box sx={{ fontWeight: 500 }}>
            {option.firstName && `${option.firstName} `}
            {option.lastName && `${option.lastName} `}
            <span style={{ color: '#666' }}>({option.email})</span>
          </Box>
        </Box>
      )}
    />
  );
};

export default TeamMemberAutocomplete;