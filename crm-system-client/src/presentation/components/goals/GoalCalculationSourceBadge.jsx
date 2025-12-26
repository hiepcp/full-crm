import React from 'react';
import { Chip, Tooltip } from '@mui/material';
import { AutoMode as AutoModeIcon, Edit as EditIcon } from '@mui/icons-material';

/**
 * GoalCalculationSourceBadge - Displays badge indicating calculation source (manual vs auto)
 * @param {Object} props
 * @param {Object} props.goal - Goal object with calculationSource property
 * @param {string} props.size - Chip size: 'small' | 'medium' (default: 'small')
 * @param {boolean} props.showIcon - Show icon (default: true)
 */
const GoalCalculationSourceBadge = ({ goal, size = 'small', showIcon = true }) => {
  if (!goal) {
    return null;
  }

  const isAutoCalculated = goal.calculationSource === 'auto_calculated';

  const config = isAutoCalculated
    ? {
        color: 'info',
        icon: showIcon ? <AutoModeIcon fontSize="small" /> : null,
        label: 'Auto',
        tooltip: 'Progress is automatically calculated from CRM data (deals, activities, etc.)',
      }
    : {
        color: 'default',
        icon: showIcon ? <EditIcon fontSize="small" /> : null,
        label: 'Manual',
        tooltip: 'Progress is manually entered',
      };

  const chipElement = (
    <Chip
      icon={config.icon}
      label={config.label}
      color={config.color}
      size={size}
      variant="outlined"
    />
  );

  return <Tooltip title={config.tooltip}>{chipElement}</Tooltip>;
};

export default GoalCalculationSourceBadge;
