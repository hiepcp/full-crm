import { useState } from 'react';
import { Autocomplete, TextField } from '@mui/material';
import { useTeams } from '../../../app/contexts/TeamContext';

const TeamSelector = ({ value, onChange, ...props }) => {
  const { teams, loading } = useTeams();
  const [search, setSearch] = useState('');

  const handleInputChange = (event, newValue) => {
    setSearch(newValue);
  };

  return (
    <Autocomplete
      {...props}
      options={teams}
      getOptionLabel={(option) => option.name}
      value={value}
      onChange={onChange}
      onInputChange={handleInputChange}
      isOptionEqualToValue={(option, value) => option.id === value?.id}
      loading={loading}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder="Select team..."
          label="Team"
          variant="outlined"
          size="small"
        />
      )}
    />
  );
};

export default TeamSelector;