import React, { useState } from 'react';
import PropTypes from 'prop-types';

// material-ui
import { useTheme } from '@mui/material/styles';
import Fab from '@mui/material/Fab';
import SpeedDial from '@mui/material/SpeedDial';
import SpeedDialAction from '@mui/material/SpeedDialAction';
import useMediaQuery from '@mui/material/useMediaQuery';

// material-ui icons
import {
  Add as AddIcon,
  Phone as PhoneIcon,
  Event as EventIcon,
  Close as CloseIcon
} from '@mui/icons-material';

// ==============================|| MOBILE QUICK ACTION FAB ||============================== //

const QuickActionFAB = ({ onLogCall, onCreateActivity }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleAction = (action) => {
    handleClose();
    if (action === 'log-call' && onLogCall) {
      onLogCall();
    } else if (action === 'create-activity' && onCreateActivity) {
      onCreateActivity();
    }
  };

  // Quick action menu items
  const actions = [
    {
      icon: <PhoneIcon />,
      name: 'Log Call',
      action: 'log-call'
    },
    {
      icon: <EventIcon />,
      name: 'Create Activity',
      action: 'create-activity'
    }
  ];

  // Only render on mobile devices
  if (!isMobile) {
    return null;
  }

  return (
    <SpeedDial
      ariaLabel="Quick actions"
      sx={{
        position: 'fixed',
        bottom: 80, // 64px bottom nav + 16px margin
        right: 16,
        zIndex: theme.zIndex.speedDial,
        display: { xs: 'flex', md: 'none' },
        '& .MuiSpeedDial-fab': {
          width: 56,
          height: 56,
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          '&:hover': {
            backgroundColor: theme.palette.primary.dark
          }
        }
      }}
      icon={<AddIcon />}
      openIcon={<CloseIcon />}
      onClose={handleClose}
      onOpen={handleOpen}
      open={open}
      direction="up"
    >
      {actions.map((action) => (
        <SpeedDialAction
          key={action.action}
          icon={action.icon}
          tooltipTitle={action.name}
          tooltipOpen
          onClick={() => handleAction(action.action)}
          sx={{
            '& .MuiSpeedDialAction-fab': {
              minWidth: 44,
              minHeight: 44,
              width: 44,
              height: 44
            }
          }}
        />
      ))}
    </SpeedDial>
  );
};

QuickActionFAB.propTypes = {
  onLogCall: PropTypes.func,
  onCreateActivity: PropTypes.func
};

QuickActionFAB.defaultProps = {
  onLogCall: null,
  onCreateActivity: null
};

export default QuickActionFAB;
