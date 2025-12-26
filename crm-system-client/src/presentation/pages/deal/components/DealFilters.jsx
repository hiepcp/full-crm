import { Box, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { DEAL_STAGES } from '../../../../utils/constants';

const DealFilters = ({ stageFilter, setStageFilter }) => {
  return (
    <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
      <FormControl sx={{ minWidth: { xs: '100%', sm: 200 } }}>
        <InputLabel>Stage Filter</InputLabel>
        <Select
          value={stageFilter}
          label="Stage Filter"
          onChange={(e) => setStageFilter(e.target.value)}
        >
          <MenuItem value="all">All Stages</MenuItem>
          {DEAL_STAGES.map((stage) => (
            <MenuItem key={stage.value} value={stage.value}>
              {stage.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default DealFilters;

