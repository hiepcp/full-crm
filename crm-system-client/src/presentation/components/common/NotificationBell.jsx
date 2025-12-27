import { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import {
  Badge,
  Box,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  Popover,
  Divider,
  Button,
  Chip,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  NotificationsOutlined,
  CheckCircleOutline,
  DeleteOutline,
  DoneAll,
  Circle
} from '@mui/icons-material';
import { useNotifications } from '@app/contexts/NotificationContext';
import { formatDateTime } from '@utils/formatDateTime';

/**
 * NotificationBell Component
 * Displays notification icon with badge and dropdown
 */
const NotificationBell = ({ showBadge = true, iconColor = 'inherit' }) => {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotifications();

  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const bellRef = useRef(null);

  const open = Boolean(anchorEl);

  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAsRead = async (notificationId) => {
    await markAsRead(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleDelete = async (notificationId) => {
    await deleteNotification(notificationId);
  };
/**
   * Handle notification click - navigate to the related entity
   */
  const handleNotificationClick = async (notification) => {
    // Mark as read if not already read
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    // Close the popover
    handleClose();

    // Navigate to the entity
    if (notification.actionUrl) {
      // Use the provided actionUrl
      navigate(notification.actionUrl);
    } else if (notification.entityType && notification.entityId) {
      // Fallback: construct URL from entityType and entityId
      const entityType = notification.entityType.toLowerCase();
      const pathMap = {
        'lead': '/leads',
        'deal': '/deals',
        'contact': '/contacts',
        'company': '/companies',
        'activity': '/activities',
        'task': '/tasks'
      };
      const basePath = pathMap[entityType] || `/${entityType}s`;
      navigate(`${basePath}/${notification.entityId}`);
    }
  };

  
  const filteredNotifications =
    filter === 'unread'
      ? notifications.filter((n) => !n.isRead)
      : notifications;

  /**
   * Get icon based on notification type
   */
  const getNotificationIcon = (type) => {
    const iconMap = {
      'lead_assigned': '👤',
      'lead_updated': '✏️',
      'deal_assigned': '💼',
      'deal_stage_changed': '📊',
      'follow_up_reminder': '⏰',
      'default': '🔔'
    };
    return iconMap[type] || iconMap.default;
  };

  /**
   * Get color based on notification type
   */
  const getNotificationColor = (type) => {
    const colorMap = {
      'lead_assigned': 'primary',
      'lead_updated': 'info',
      'deal_assigned': 'success',
      'deal_stage_changed': 'warning',
      'follow_up_reminder': 'error',
      'default': 'default'
    };
    return colorMap[type] || colorMap.default;
  };

  return (
    <Box>
      <Tooltip title="Notifications">
        <IconButton
          ref={bellRef}
          onClick={handleOpen}
          color={iconColor}
          sx={{
            ml: 1,
            // Ensure minimum touch target size of 44x44px on mobile
            minWidth: { xs: 44, sm: 40 },
            minHeight: { xs: 44, sm: 40 },
            width: { xs: 44, sm: 40 },
            height: { xs: 44, sm: 40 }
          }}
        >
          <Badge badgeContent={showBadge ? unreadCount : 0} color="error">
            <NotificationsOutlined />
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
        PaperProps={{
          sx: {
            width: 400,
            maxHeight: 600,
            mt: 1.5
          }
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: 1,
            borderColor: 'divider'
          }}
        >
          <Typography variant="h6">
            Notifications {unreadCount > 0 && `(${unreadCount})`}
          </Typography>
          
          {unreadCount > 0 && (
            <Tooltip title="Mark all as read">
              <IconButton size="small" onClick={handleMarkAllAsRead}>
                <DoneAll fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {/* Filter tabs */}
        <Box sx={{ p: 1, display: 'flex', gap: 1, borderBottom: 1, borderColor: 'divider' }}>
          <Button
            size="small"
            variant={filter === 'all' ? 'contained' : 'text'}
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            size="small"
            variant={filter === 'unread' ? 'contained' : 'text'}
            onClick={() => setFilter('unread')}
          >
            Unread ({unreadCount})
          </Button>
        </Box>

        {/* Notification list */}
        <List sx={{ p: 0, maxHeight: 400, overflow: 'auto' }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : filteredNotifications.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
              </Typography>
            </Box>
          ) : (
            filteredNotifications.map((notification, index) => (
              <Box key={notification.id}>
                {index > 0 && <Divider />}
                <ListItem
                  sx={{
                    bgcolor: notification.isRead ? 'transparent' : 'action.hover',
                    py: 0.75,
                    '&:hover': {
                      bgcolor: 'action.selected',
                      cursor: 'pointer'
                    },
                    position: 'relative'
                  }}
                  onClick={() => handleNotificationClick(notification)}
                  secondaryAction={
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {!notification.isRead && (
                        <Tooltip title="Mark as read">
                          <IconButton
                            edge="end"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(notification.id);
                            }}
                          >
                            <CheckCircleOutline fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Delete">
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(notification.id);
                          }}
                        >
                          <DeleteOutline fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  }
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: getNotificationColor(notification.type), width: 32, height: 32, fontSize: '0.9rem' }}>
                      {getNotificationIcon(notification.type)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'space-between' }}>
                        <Typography variant="body2" fontWeight="500" sx={{ flex: 1, lineHeight: 1.3 }}>
                          {notification.title}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', whiteSpace: 'nowrap' }}>
                            {formatDateTime(notification.createdAt)}
                          </Typography>
                          {!notification.isRead && (
                            <Circle sx={{ fontSize: 6, color: 'primary.main' }} />
                          )}
                        </Box>
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.secondary"
                          sx={{ display: 'block', mb: 0.3, fontSize: '0.8rem', lineHeight: 1.3 }}
                        >
                          {notification.message}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {notification.referenceType && (
                            <Chip
                              label={notification.referenceType}
                              size="small"
                              sx={{ height: 16, fontSize: '0.65rem' }}
                            />
                          )}
                        </Box>
                      </>
                    }
                    sx={{ pr: 8, my: 0 }}
                  />
                </ListItem>
              </Box>
            ))
          )}
        </List>

        {/* Footer */}
        {filteredNotifications.length > 0 && (
          <Box
            sx={{
              p: 1,
              borderTop: 1,
              borderColor: 'divider',
              textAlign: 'center'
            }}
          >
            <Button 
              size="small" 
              onClick={() => {
                handleClose();
                navigate('/notifications');
              }}
            >
              View All Notifications
            </Button>
          </Box>
        )}
      </Popover>
    </Box>
  );
};

NotificationBell.propTypes = {
  showBadge: PropTypes.bool,
  iconColor: PropTypes.string
};

export default NotificationBell;
