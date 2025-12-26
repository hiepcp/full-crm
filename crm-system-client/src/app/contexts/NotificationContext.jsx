import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import notificationHubService from '@infrastructure/services/notificationHubService';
import * as notificationsApi from '@infrastructure/api/notificationsApi';
import { tokenHelper } from '@utils/tokenHelper';

const NotificationContext = createContext(null);

/**
 * NotificationProvider - Manages notification state and SignalR connection
 */
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  /**
   * Check token periodically
   */
  useEffect(() => {
    const checkToken = () => {
      const token = tokenHelper.get();
      setHasToken(!!token);
    };

    // Check immediately
    checkToken();

    // Check every 2 seconds for token changes (after login)
    const interval = setInterval(checkToken, 2000);

    return () => clearInterval(interval);
  }, []);

  /**
   * Load notifications from API
   */
  const loadNotifications = useCallback(async (unreadOnly = false) => {
    try {
      setIsLoading(true);
      const response = await notificationsApi.getNotifications(0, 20, unreadOnly);
      if (response?.success && response?.data) {
        setNotifications(response.data);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Load unread count
   */
  const loadUnreadCount = useCallback(async () => {
    try {
      const response = await notificationsApi.getUnreadCount();
      if (response?.success && typeof response?.data === 'number') {
        setUnreadCount(response.data);
      }
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  }, []);

  /**
   * Mark notification as read
   */
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await notificationsApi.markAsRead(notificationId);
      
      // Update local state
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
      
      // Decrement unread count
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationsApi.markAllAsRead();
      
      // Update local state
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, isRead: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  }, []);

  /**
   * Delete notification
   */
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await notificationsApi.deleteNotification(notificationId);
      
      // Update local state
      setNotifications((prev) => {
        const notification = prev.find((n) => n.id === notificationId);
        if (notification && !notification.isRead) {
          setUnreadCount((count) => Math.max(0, count - 1));
        }
        return prev.filter((notif) => notif.id !== notificationId);
      });
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  }, []);

  /**
   * Handle new notification from SignalR
   */
  const handleNewNotification = useCallback((notification) => {
    // console.log('New notification received:', notification);
    
    // Add to notifications list
    setNotifications((prev) => [notification, ...prev]);
    
    // Increment unread count
    if (!notification.isRead) {
      setUnreadCount((prev) => prev + 1);
    }
    
    // Show browser notification if supported
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title || 'New Notification', {
        body: notification.message,
        icon: '/logo192.png',
        badge: '/logo192.png'
      });
    }
  }, []);

  /**
   * Handle notification read event from SignalR
   */
  const handleNotificationRead = useCallback((notificationId) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notificationId ? { ...notif, isRead: true } : notif
      )
    );
  }, []);

  /**
   * Initialize SignalR connection
   */
  useEffect(() => {
    if (!hasToken) {
      console.warn('NotificationContext: No token available yet, waiting...');
      return;
    }

    const token = tokenHelper.get();
    if (!token) {
      console.warn('NotificationContext: Token check failed');
      return;
    }

    console.log('NotificationContext: Initializing SignalR connection...');

    // Start SignalR connection
    notificationHubService.start().then(() => {
      const connected = notificationHubService.getConnectionStatus();
      setIsConnected(connected);
      console.log('NotificationContext: SignalR connection status:', connected);
      
      // Load initial data
      if (connected) {
        loadNotifications();
        loadUnreadCount();
      }
    }).catch((error) => {
      console.error('NotificationContext: Failed to start SignalR:', error);
    });

    // Register event handlers
    notificationHubService.on('notification', handleNewNotification);
    notificationHubService.on('notificationRead', handleNotificationRead);

    // Request browser notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Cleanup on unmount
    return () => {
      console.log('NotificationContext: Cleaning up SignalR connection');
      notificationHubService.off('notification', handleNewNotification);
      notificationHubService.off('notificationRead', handleNotificationRead);
      notificationHubService.stop();
    };
  }, [hasToken, handleNewNotification, handleNotificationRead, loadNotifications, loadUnreadCount]);

  const value = {
    notifications,
    unreadCount,
    isConnected,
    isLoading,
    loadNotifications,
    loadUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

NotificationProvider.propTypes = {
  children: PropTypes.node.isRequired
};

/**
 * Custom hook to use notifications
 */
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export default NotificationContext;
