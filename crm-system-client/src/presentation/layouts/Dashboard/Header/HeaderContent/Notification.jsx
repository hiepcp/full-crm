import React from 'react';
import { useRef, useState, useEffect } from 'react';
// import socketInstance from 'api/socketInstance';

// material-ui
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Avatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

// project import
import MainCard from '@presentation/components/MainCard';
import Transitions from '@presentation/components/@extended/Transitions';

// assets
import { Notifications, CheckCircle, Message } from '@mui/icons-material';

// sx styles
const avatarSX = {
  width: 36,
  height: 36,
  fontSize: '1rem'
};

const actionSX = {
  mt: '6px',
  ml: 1,
  top: 'auto',
  right: 'auto',
  alignSelf: 'flex-start',

  transform: 'none'
};

// ==============================|| HEADER CONTENT - NOTIFICATION ||============================== //

export default function Notification() {
  const theme = useTheme();
  const matchesXs = useMediaQuery(theme.breakpoints.down('md'));

  const anchorRef = useRef(null);
  const [read, setRead] = useState(0);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // useEffect(() => {
  //   // Function to handle new notifications
  //   const handleNotification = (notification) => {
  //     // Convert Pascal Case to camelCase
  //     const normalizedNotification = {
  //       id: notification.Id,
  //       title: notification.Title,
  //       message: notification.Message,
  //       type: notification.Type,
  //       isRead: notification.IsRead,
  //       createdAt: notification.CreatedAt
  //     };

  //     // Check if notification already exists to prevent duplicates
  //     setNotifications(prev => {
  //       const exists = prev.some(n => n.id === normalizedNotification.id);
  //       if (exists) return prev;
  //       return [normalizedNotification, ...prev];
  //     });

  //   };

  //   // Register the event listener
  //   socketInstance.on('notification', handleNotification);

  //   // Cleanup on unmount
  //   return () => {
  //     socketInstance.off('notification', handleNotification);
  //   };
  // }, []);

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event) => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) {
      return;
    }
    setOpen(false);
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    // You can emit an event to server to mark all as read
    // socketInstance.emit('markAllRead');
  };

  const iconBackColorOpen = 'grey.100';

  return (
    <Box sx={{ flexShrink: 0, ml: 0.75 }}>
      <IconButton
        color="secondary"
        variant="light"
        sx={{ color: 'text.primary', bgcolor: open ? iconBackColorOpen : 'transparent' }}
        aria-label="open profile"
        ref={anchorRef}
        aria-controls={open ? 'profile-grow' : undefined}
        aria-haspopup="true"
        onClick={handleToggle}
      >
        <Badge badgeContent={notifications.length} color="primary">
          <Notifications  />
        </Badge>
      </IconButton>
      <Popper
        placement={matchesXs ? 'bottom' : 'bottom-end'}
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        transition
        disablePortal
        popperOptions={{ modifiers: [{ name: 'offset', options: { offset: [matchesXs ? -5 : 0, 9] } }] }}
      >
        {({ TransitionProps }) => (
          <Transitions type="grow" position={matchesXs ? 'top' : 'top-right'} in={open} {...TransitionProps}>
            <Paper sx={{ boxShadow: theme.customShadows.z1, width: '100%', minWidth: 285, maxWidth: { xs: 285, md: 420 } }}>
              <ClickAwayListener onClickAway={handleClose}>
                <MainCard
                  title="Notification"
                  elevation={0}
                  border={false}
                  content={false}
                  secondary={
                    <>
                      {read > 0 && (
                        <Tooltip title="Mark as all read">
                          <IconButton color="success" size="small" onClick={handleMarkAllRead}>
                            <CheckCircle style={{ fontSize: '1.15rem' }} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </>
                  }
                >
                  <List
                    component="nav"
                    sx={{
                      p: 0,
                      '& .MuiListItemButton-root': {
                        py: 0.5,
                        '&.Mui-selected': { bgcolor: 'grey.50', color: 'text.primary' },
                        '& .MuiAvatar-root': avatarSX,
                        '& .MuiListItemSecondaryAction-root': { ...actionSX, position: 'relative' }
                      }
                    }}
                  >
                    {notifications.length === 0 ? (
                      <ListItemButton>
                        <ListItemText
                          primary={
                            <Typography variant="h6" color="textSecondary">
                              No notifications
                            </Typography>
                          }
                        />
                      </ListItemButton>
                    ) : (
                      notifications.map((notification, index) => (
                        <div key={index}>
                          <ListItemButton selected={index < read}>
                            <ListItemAvatar>
                              <Avatar sx={{ color: notification.type === 'success' ? 'success.main' : 'primary.main', 
                                        bgcolor: notification.type === 'success' ? 'success.lighter' : 'primary.lighter' }}>
                                  {notification.icon || <Message />}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Typography variant="h6">
                                  {notification.title}
                                </Typography>
                              }
                              secondary={notification.message}
                            />
                            <ListItemSecondaryAction>
                              <Typography variant="caption" noWrap>
                                {notification.time}
                              </Typography>
                            </ListItemSecondaryAction>
                          </ListItemButton>
                          {index < notifications.length - 1 && <Divider />}
                        </div>
                      ))
                    )}
                    <Divider />
                    <ListItemButton sx={{ textAlign: 'center', py: `${12}px !important` }}>
                      <ListItemText
                        primary={
                          <Typography variant="h6" color="primary">
                            View All
                          </Typography>
                        }
                      />
                    </ListItemButton>
                  </List>
                </MainCard>
              </ClickAwayListener>
            </Paper>
          </Transitions>
        )}
      </Popper>
    </Box>
  );
}
