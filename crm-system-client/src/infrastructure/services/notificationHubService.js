import * as signalR from '@microsoft/signalr';
import config from '@src/config';
import { tokenHelper } from '@utils/tokenHelper';

/**
 * SignalR Notification Hub Service
 * Handles real-time notification push from backend
 */
class NotificationHubService {
  constructor() {
    this.connection = null;
    this.isConnected = false;
    this.listeners = new Map(); // event name -> array of callbacks
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  /**
   * Initialize and start SignalR connection
   */
  async start() {
    if (this.connection && this.isConnected) {
      // console.log('NotificationHub: Already connected');
      return;
    }

    const token = tokenHelper.get();
    if (!token) {
      // console.warn('NotificationHub: No access token available');
      return;
    }

    // Build hub URL (SignalR hub is not under /api prefix)
    // Remove /api if exists in config.API_URL and add /hubs/notifications
    const baseUrl = config.API_URL.replace(/\/api\/?$/, '');
    const hubUrl = `${baseUrl}/hubs/notifications`;
    
    // console.log('NotificationHub: Connecting to', hubUrl);

    // Build connection
    // NOTE: Do NOT add headers - SignalR doesn't support custom headers in negotiate request
    // Backend must skip ApiKey middleware for /hubs/* endpoints
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        // Get fresh token each time (important for token refresh)
        accessTokenFactory: () => {
          const currentToken = tokenHelper.get();
          if (!currentToken) {
            console.warn('NotificationHub: Token not available in accessTokenFactory');
          }
          // console.log('NotificationHub: accessTokenFactory called, token available:', currentToken);
          return currentToken;
        },
        // BEST PRACTICE: Let SignalR automatically negotiate best transport
        // Priority: WebSockets > ServerSentEvents > LongPolling
        // - WebSocket: Full-duplex, real-time, minimal overhead (BEST for notifications)
        // - ServerSentEvents: One-way server push, good fallback
        // - LongPolling: HTTP fallback for restrictive networks
        // SECURITY: accessTokenFactory sends token in Authorization header (secure for all transports)
        skipNegotiation: false // Let SignalR negotiate best transport
        // Transport will be automatically selected based on:
        // 1. Browser capabilities
        // 2. Network conditions  
        // 3. Firewall/proxy restrictions
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          // Exponential backoff: 2s, 4s, 8s, 16s, 32s
          if (retryContext.previousRetryCount < this.maxReconnectAttempts) {
            return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 32000);
          }
          return null; // Stop reconnecting
        }
      })
      // .configureLogging(signalR.LogLevel.Information)
      .build();

    // Setup event handlers
     this.setupEventHandlers();

    try {
      await this.connection.start();
      this.isConnected = true;
      this.reconnectAttempts = 0;
      console.log('NotificationHub: Connected successfully');
    } catch (error) {
      console.error('NotificationHub: Failed to connect:', error);
      this.isConnected = false;
    }
  }

  /**
   * Stop SignalR connection
   */
  async stop() {
    if (this.connection) {
      try {
        await this.connection.stop();
        this.isConnected = false;
        console.log('NotificationHub: Disconnected');
      } catch (error) {
        console.error('NotificationHub: Error stopping connection:', error);
      }
    }
  }

  /**
   * Setup event handlers for connection lifecycle
   */
  setupEventHandlers() {
    this.connection.onreconnecting((error) => {
      console.warn('NotificationHub: Reconnecting...', error);
      this.isConnected = false;
      this.reconnectAttempts++;
    });

    this.connection.onreconnected((connectionId) => {
      console.log('NotificationHub: Reconnected with ID:', connectionId);
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.connection.onclose((error) => {
      console.error('NotificationHub: Connection closed:', error);
      this.isConnected = false;
      
      // Try to reconnect after delay
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        setTimeout(() => this.start(), 5000);
      }
    });

    // Listen to "ReceiveNotification" from backend
    this.connection.on('ReceiveNotification', (notification) => {
      // console.log('NotificationHub: Received notification:', notification);
      this.emit('notification', notification);
    });

    // Listen to "NotificationRead" event
    this.connection.on('NotificationRead', (notificationId) => {
      // console.log('NotificationHub: Notification marked as read:', notificationId);
      this.emit('notificationRead', notificationId);
    });
  }

  /**
   * Register event listener
   * @param {string} eventName - Event name (e.g., 'notification', 'notificationRead')
   * @param {Function} callback - Callback function
   */
  on(eventName, callback) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    this.listeners.get(eventName).push(callback);
  }

  /**
   * Unregister event listener
   * @param {string} eventName - Event name
   * @param {Function} callback - Callback function to remove
   */
  off(eventName, callback) {
    if (this.listeners.has(eventName)) {
      const callbacks = this.listeners.get(eventName);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to all registered listeners
   * @param {string} eventName - Event name
   * @param {*} data - Event data
   */
  emit(eventName, data) {
    if (this.listeners.has(eventName)) {
      this.listeners.get(eventName).forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`NotificationHub: Error in ${eventName} callback:`, error);
        }
      });
    }
  }

  /**
   * Get connection status
   * @returns {boolean} True if connected
   */
  getConnectionStatus() {
    return this.isConnected;
  }
}

// Singleton instance
const notificationHubService = new NotificationHubService();

export default notificationHubService;
