import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardHeader,
  CardContent,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Box,
  Chip,
  IconButton,
  Collapse,
  Badge,
  CircularProgress
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  CheckCircleOutline,
  Circle
} from '@mui/icons-material';
import { useNotifications } from '@app/contexts/NotificationContext';
import { formatDateTime } from '@utils/formatDateTime';

/**
 * NotificationCard Component
 * Displays notifications related to a specific entity (e.g., Lead)
 */
const NotificationCard = ({ referenceType, referenceId, title = 'Notifications' }) => {
  const { notifications, isLoading, markAsRead } = useNotifications();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(true);
  const [entityNotifications, setEntityNotifications] = useState([]);

  useEffect(() => {
    if (referenceType && referenceId) {
      const filtered = notifications.filter(
        (n) =>
          n.referenceType?.toLowerCase() === referenceType.toLowerCase() &&
          n.referenceId === referenceId
      );
      setEntityNotifications(filtered);
    }
  }, [notifications, referenceType, referenceId]);

  const handleToggle = () => {
    setExpanded(!expanded);
  };

  const handleMarkAsRead = async (notificationId) => {
    await markAsRead(notificationId);
  };

  /**
   * Handle notification click - navigate to the related entity
   */
  const handleNotificationClick = async (notification) => {
    // Mark as read if not already read
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    // Navigate to the entity (if different from current page)
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
      const targetPath = `${basePath}/${notification.entityId}`;
      
      // Only navigate if it's a different entity
      if (notification.entityId !== referenceId) {
        navigate(targetPath);
      }
    }
  };

  const unreadCount = entityNotifications.filter((n) => !n.isRead).length;

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

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6">{title}</Typography>
            {unreadCount > 0 && (
              <Badge badgeContent={unreadCount} color="error" />
            )}
          </Box>
        }
        action={
          <IconButton onClick={handleToggle}>
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        }
      />
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <CardContent sx={{ pt: 0 }}>
          {entityNotifications.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No notifications for this {referenceType?.toLowerCase() || 'item'}
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {entityNotifications.map((notification, index) => (
                <ListItem
                  key={notification.id}
                  sx={{
                    bgcolor: notification.isRead ? 'transparent' : 'action.hover',
                    borderRadius: 1,
                    mb: index < entityNotifications.length - 1 ? 0.5 : 0,
                    position: 'relative',
                    py: 0.75,
                    '&:hover': {
                      bgcolor: 'action.selected',
                      cursor: notification.actionUrl || (notification.entityType && notification.entityId !== referenceId) 
                        ? 'pointer' 
                        : 'default'
                    }
                  }}
                  onClick={() => handleNotificationClick(notification)}
                  secondaryAction={
                    !notification.isRead && (
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notification.id);
                        }}
                        title="Mark as read"
                      >
                        <CheckCircleOutline fontSize="small" />
                      </IconButton>
                    )
                  }
                >
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        bgcolor: getNotificationColor(notification.type),
                        width: 32,
                        height: 32,
                        fontSize: '0.9rem'
                      }}
                    >
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
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                          {notification.type && (
                            <Chip
                              label={notification.type.replace(/_/g, ' ')}
                              size="small"
                              color={getNotificationColor(notification.type)}
                              sx={{ height: 16, fontSize: '0.65rem', textTransform: 'capitalize' }}
                            />
                          )}
                        </Box>
                      </>
                    }
                    sx={{ pr: 5, my: 0 }}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Collapse>
    </Card>
  );
};

NotificationCard.propTypes = {
  referenceType: PropTypes.string.isRequired,
  referenceId: PropTypes.number.isRequired,
  title: PropTypes.string
};

export default NotificationCard;
