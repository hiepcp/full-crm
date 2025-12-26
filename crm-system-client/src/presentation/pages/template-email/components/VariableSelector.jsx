import React, { useState, useEffect } from 'react';
import {
  Button,
  Popover,
  MenuItem,
  ListSubheader,
  Chip,
  Box,
  Typography,
  TextField,
  InputAdornment,
  MenuList
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  MonetizationOn as DealIcon,
  Contacts as ContactIcon,
  Settings as SystemIcon
} from '@mui/icons-material';
import { emailTemplateApi } from '../../../../infrastructure/api/emailTemplateApi';

const entityIcons = {
  user: <PersonIcon fontSize="small" />,
  lead: <BusinessIcon fontSize="small" />,
  deal: <DealIcon fontSize="small" />,
  contact: <ContactIcon fontSize="small" />,
  customer: <BusinessIcon fontSize="small" />,
  system: <SystemIcon fontSize="small" />
};

const VariableSelector = ({ onInsert, variant = 'button' }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [variableGroups, setVariableGroups] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadVariables = async () => {
      try {
        const data = await emailTemplateApi.getVariables();
        setVariableGroups(data || []);
      } catch (error) {
        console.error('Failed to load variables:', error);
        setVariableGroups([]);
      }
    };
    loadVariables();
  }, []);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setSearchTerm('');
  };

  const handleInsert = (variableKey) => {
    onInsert(variableKey);
    handleClose();
  };

  // Filter variables by search term
  const filteredVariableGroups = variableGroups.map(group => ({
    entityType: group.entityType,
    variables: group.variables.filter(variable => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return variable.variableName.toLowerCase().includes(searchLower) ||
             variable.variableKey.toLowerCase().includes(searchLower);
    })
  })).filter(group => group.variables.length > 0);

  const open = Boolean(anchorEl);

  return (
    <>
      {variant === 'button' ? (
        <Button
          variant="outlined"
          size="small"
          startIcon={<AddIcon />}
          onClick={handleClick}
          sx={{ textTransform: 'none' }}
        >
          Insert Variable
        </Button>
      ) : (
        <Chip
          icon={<AddIcon />}
          label="Variables"
          onClick={handleClick}
          variant="outlined"
          size="small"
        />
      )}

      <Popover
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        PaperProps={{
          style: {
            maxHeight: 500,
            width: 400
          }
        }}
      >
        <Box sx={{ p: 2, pb: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search variables..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              )
            }}
          />
        </Box>

        <MenuList sx={{ maxHeight: 400, overflow: 'auto' }}>
          {filteredVariableGroups.length === 0 ? (
            <MenuItem disabled>
              <Typography variant="body2" color="text.secondary">
                No variables found
              </Typography>
            </MenuItem>
          ) : (
            filteredVariableGroups.map((group) => (
              <React.Fragment key={group.entityType}>
                <ListSubheader sx={{ bgcolor: 'background.paper' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {entityIcons[group.entityType]}
                    <Typography variant="caption" fontWeight="bold" textTransform="uppercase">
                      {group.entityType}
                    </Typography>
                  </Box>
                </ListSubheader>
                {group.variables.map((variable) => (
                  <MenuItem
                    key={variable.id}
                    onClick={() => handleInsert(variable.variableKey)}
                    sx={{ pl: 3 }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                      <Chip label={variable.variableKey} size="small" color="primary" variant="outlined" />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2">{variable.variableName}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Example: {variable.exampleValue}
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                ))}
              </React.Fragment>
            ))
          )}
        </MenuList>
      </Popover>
    </>
  );
};

export default VariableSelector;
