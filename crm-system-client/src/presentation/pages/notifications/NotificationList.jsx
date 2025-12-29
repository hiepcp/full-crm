import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  IconButton,
  Button,
  Chip,
  Tabs,
  Tab,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  CheckCircleOutline,
  DeleteOutline,
  DoneAll,
  Circle,
  ArrowBack
} from '@mui/icons-material';
import { useNotifications } from '@app/contexts/NotificationContext';
import { formatDateTime } from '@utils/formatDateTime';

/**
 * NotificationList Page
 * Full page to view and manage all notifications
 */
const NotificationList = () => {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    loadNotifications
  } = useNotifications();

  const navigate = useNavigate();
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const [groupBy, setGroupBy] = useState('none'); // 'none' | 'entity'

  useEffect(() => {
    // Fetch notifications when component mounts
    loadNotifications();
  }, [loadNotifications]);

  const handleFilterChange = (event, newValue) => {
    setFilter(newValue);
  };

  const handleMarkAsRead = async (notificationId, event) => {
    event.stopPropagation();
    await markAsRead(notificationId);
  };

  const handleDelete = async (notificationId, event) => {
    event.stopPropagation();
    await deleteNotification(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read if not already read
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    // Navigate to the entity
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    } else if (notification.entityType && notification.entityId) {
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

  // Group notifications by entity type
  const groupedNotifications = () => {
    if (groupBy === 'none') {
      return { 'All': filteredNotifications };
    }

    const groups = {
      'Lead': [],
      'Deal': [],
      'Customer': [],
      'Contact': [],
      'Activity': [],
      'Other': []
    };

    filteredNotifications.forEach(notification => {
      const entityType = notification.entityType?.toLowerCase() || '';
      const type = notification.type?.toLowerCase() || '';

      if (entityType.includes('lead') || type.includes('lead')) {
        groups['Lead'].push(notification);
      } else if (entityType.includes('deal') || type.includes('deal')) {
        groups['Deal'].push(notification);
      } else if (entityType.includes('customer') || type.includes('customer')) {
        groups['Customer'].push(notification);
      } else if (entityType.includes('contact') || type.includes('contact')) {
        groups['Contact'].push(notification);
      } else if (entityType.includes('activity') || type.includes('activity')) {
        groups['Activity'].push(notification);
      } else {
        groups['Other'].push(notification);
      }
    });

    // Remove empty groups
    return Object.fromEntries(
      Object.entries(groups).filter(([_, items]) => items.length > 0)
    );
  };

  const getNotificationIcon = (type) => {
    const iconMap = {
      'lead_assigned': '👤',
      'lead_updated': '✏️',
      'deal_assigned': '💼',
      'deal_stage_changed': '📊',
      'follow_up_reminder': '⏰',
      'LEAD_FOLLOW_UP_DUE': '⏰',
      'DEAL_FOLLOW_UP_DUE': '⏰',
      'default': '🔔'
    };
    return iconMap[type] || iconMap.default;
  };

  const getNotificationColor = (type) => {
    const colorMap = {
      'lead_assigned': 'primary',
      'lead_updated': 'info',
      'deal_assigned': 'success',
      'deal_stage_changed': 'warning',
      'follow_up_reminder': 'error',
      'LEAD_FOLLOW_UP_DUE': 'error',
      'DEAL_FOLLOW_UP_DUE': 'error',
      'default': 'default'
    };
    return colorMap[type] || colorMap.default;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Card>
        <CardHeader
          avatar={
            <IconButton onClick={() => navigate(-1)}>
              <ArrowBack />
            </IconButton>
          }
          title={
            <Typography variant="h5">
              Notifications {unreadCount > 0 && `(${unreadCount} unread)`}
            </Typography>
          }
          action={
            unreadCount > 0 && (
              <Button
                startIcon={<DoneAll />}
                onClick={handleMarkAllAsRead}
                variant="outlined"
                size="small"
              >
                Mark All Read
              </Button>
            )
          }
        />

        <Divider />

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={filter} onChange={handleFilterChange} sx={{ px: 2 }}>
            <Tab label="All" value="all" />
            <Tab label={`Unread (${unreadCount})`} value="unread" />
          </Tabs>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1, borderBottom: 1, borderColor: 'divider' }}>
          <Button
            size="small"
            variant={groupBy === 'entity' ? 'contained' : 'outlined'}
            onClick={() => setGroupBy(groupBy === 'none' ? 'entity' : 'none')}
          >
            {groupBy === 'entity' ? 'Show All' : 'Group by Type'}
          </Button>
        </Box>

        <CardContent sx={{ p: 0 }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
              <CircularProgress />
            </Box>
          ) : filteredNotifications.length === 0 ? (
            <Box sx={{ p: 5, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {filter === 'all' 
                  ? "You're all caught up!" 
                  : 'Check back later for updates'}
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {Object.entries(groupedNotifications()).map(([groupName, groupItems]) => (
                <Box key={groupName}>
                  {groupBy === 'entity' && (
                    <Box sx={{ px: 2, py: 1, bgcolor: 'action.hover', borderBottom: 1, borderColor: 'divider' }}>
                      <Typography variant="subtitle2" fontWeight="600">
                        {groupName} ({groupItems.length})
                      </Typography>
                    </Box>
                  )}
                  {groupItems.map((notification, index) => (
                    <Box key={notification.id}>
                      {index > 0 && <Divider />}
                      <ListItem
                        sx={{
                          bgcolor: notification.isRead ? 'transparent' : 'action.hover',
                          py: 1,
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
                              <IconButton
                                edge="end"
                                size="small"
                                onClick={(e) => handleMarkAsRead(notification.id, e)}
                                title="Mark as read"
                              >
                                <CheckCircleOutline fontSize="small" />
                              </IconButton>
                            )}
                            <IconButton
                              edge="end"
                              size="small"
                              onClick={(e) => handleDelete(notification.id, e)}
                              title="Delete"
                            >
                              <DeleteOutline fontSize="small" />
                            </IconButton>
                          </Box>
                        }
                      >
                        <ListItemAvatar>
                          <Avatar
                            sx={{
                              bgcolor: getNotificationColor(notification.type),
                              width: 36,
                              height: 36,
                              fontSize: '0.9rem'
                            }}
                          >
                            {getNotificationIcon(notification.type)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'space-between' }}>
                              <Typography 
                                variant="body2" 
                                fontWeight={notification.isRead ? 400 : 600} 
                                sx={{ flex: 1, lineHeight: 1.3 }}
                              >
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
                            </>
                          }
                          sx={{ pr: 10, my: 0 }}
                        />
                      </ListItem>
                    </Box>
                  ))}
                </Box>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default NotificationList;
