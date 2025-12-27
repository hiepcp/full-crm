import React from 'react';
import { useNavigate, useLocation, matchPath } from 'react-router-dom';
import PropTypes from 'prop-types';

// material-ui
import { useTheme } from '@mui/material/styles';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Paper from '@mui/material/Paper';
import useMediaQuery from '@mui/material/useMediaQuery';

// ==============================|| MOBILE BOTTOM NAVIGATION ||============================== //

const BottomNav = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));

  // Navigation items: Deals, Activities, Contacts, More
  const navItems = [
    {
      label: 'Deals',
      icon: 'handshake',
      path: '/deals',
      value: 'deals'
    },
    {
      label: 'Activities',
      icon: 'event',
      path: '/activities',
      value: 'activities'
    },
    {
      label: 'Contacts',
      icon: 'contacts',
      path: '/contacts',
      value: 'contacts'
    },
    {
      label: 'More',
      icon: 'menu',
      path: '/',
      value: 'more'
    }
  ];

  // Determine active value based on current location
  const getActiveValue = () => {
    const pathname = location.pathname;

    for (const item of navItems) {
      if (matchPath({ path: item.path, end: false }, pathname)) {
        return item.value;
      }
    }

    // Default to 'more' if no match
    return 'more';
  };

  const activeValue = getActiveValue();

  const handleChange = (event, newValue) => {
    const item = navItems.find(nav => nav.value === newValue);
    if (item) {
      navigate(item.path);
    }
  };

  // Only render on mobile devices
  if (!isMobile) {
    return null;
  }

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: theme.zIndex.appBar,
        display: { xs: 'block', lg: 'none' }
      }}
      elevation={3}
    >
      <BottomNavigation
        value={activeValue}
        onChange={handleChange}
        showLabels
        sx={{
          height: 64,
          '& .MuiBottomNavigationAction-root': {
            minWidth: 'auto',
            padding: '6px 12px 8px',
            color: theme.palette.text.secondary,
            '&.Mui-selected': {
              color: theme.palette.primary.main,
              fontWeight: 600
            }
          },
          '& .MuiBottomNavigationAction-label': {
            fontSize: '0.75rem',
            '&.Mui-selected': {
              fontSize: '0.75rem'
            }
          }
        }}
      >
        {navItems.map((item) => (
          <BottomNavigationAction
            key={item.value}
            label={item.label}
            value={item.value}
            icon={
              <i
                className="material-icons"
                style={{ fontSize: '1.5rem' }}
              >
                {item.icon}
              </i>
            }
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
};

BottomNav.propTypes = {};

export default BottomNav;
