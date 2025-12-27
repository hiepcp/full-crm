import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Import email auth components
import { EmailAuthRepository } from '@infrastructure/repositories/EmailAuthRepository';
import { LocalAuthRepository } from '@infrastructure/repositories/LocalAuthRepository';
import { GetEmailConnectionUseCase } from '@application/usecases/auth/GetEmailConnectionUseCase';
import { EmailConnectUseCase } from '@application/usecases/auth/EmailConnectUseCase';
import { DisconnectEmailUseCase } from '@application/usecases/auth/DisconnectEmailUseCase';

// Initialize repositories and use cases
const localRepo = new LocalAuthRepository();
const emailAuthRepo = new EmailAuthRepository(localRepo);
const getEmailConnectionUseCase = new GetEmailConnectionUseCase(emailAuthRepo);
const emailConnectUseCase = new EmailConnectUseCase(emailAuthRepo);
const disconnectEmailUseCase = new DisconnectEmailUseCase(emailAuthRepo);

// Create the context
const EmailConnectionContext = createContext();

// Custom hook to use the email connection context
export const useEmailConnection = () => {
  const context = useContext(EmailConnectionContext);
  if (!context) {
    throw new Error('useEmailConnection must be used within an EmailConnectionProvider');
  }
  return context;
};

// Provider component
export const EmailConnectionProvider = ({ children }) => {
  const [connectionStatus, setConnectionStatus] = useState('unknown'); // unknown, connected, disconnected, connecting, error
  const [connectionInfo, setConnectionInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check connection status on mount and when storage changes
  useEffect(() => {
    checkConnection();

    // Listen for storage changes (in case connection is updated in another tab)
    const handleStorageChange = (e) => {
      if (e.key === 'connectedEmail') {
        checkConnection();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Listen for custom events (for same-tab updates)
  useEffect(() => {
    const handleConnectionChange = () => {
      checkConnection();
    };

    window.addEventListener('emailConnectionChanged', handleConnectionChange);
    return () => window.removeEventListener('emailConnectionChanged', handleConnectionChange);
  }, []);

  const checkConnection = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await getEmailConnectionUseCase.execute();

      if (result.success) {
        if (result.data.isConnected) {
          setConnectionStatus('connected');
          setConnectionInfo(result.data.connectionInfo);
        } else {
          setConnectionStatus('disconnected');
          setConnectionInfo(null);
        }
      } else {
        setConnectionStatus('error');
        setError(result.error);
        setConnectionInfo(null);
      }
    } catch (error) {
      console.error('Error checking email connection:', error);
      setConnectionStatus('error');
      setError(error.message);
      setConnectionInfo(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const connect = useCallback(async () => {
    try {
      setConnectionStatus('connecting');
      setError(null);
      setIsLoading(true);

      const result = await emailConnectUseCase.execute();

      if (result.success) {
        setConnectionStatus('connected');
        setConnectionInfo(result.data);
        setError(null);

        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('emailConnectionChanged'));

        return { success: true, data: result.data };
      } else {
        setConnectionStatus('disconnected');
        setConnectionInfo(null);
        setError(result.error);

        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Error connecting email:', error);
      setConnectionStatus('error');
      setError(error.message);
      setConnectionInfo(null);

      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await disconnectEmailUseCase.execute();

      if (result.success) {
        setConnectionStatus('disconnected');
        setConnectionInfo(null);
        setError(null);

        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('emailConnectionChanged'));

        return { success: true };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Error disconnecting email:', error);
      setError(error.message);

      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshConnection = useCallback(async () => {
    await checkConnection();
  }, [checkConnection]);

  const value = {
    // State
    connectionStatus,
    connectionInfo,
    isLoading,
    error,

    // Actions
    connect,
    disconnect,
    refreshConnection,
    checkConnection,

    // Computed values
    isConnected: connectionStatus === 'connected',
    isDisconnected: connectionStatus === 'disconnected',
    isConnecting: connectionStatus === 'connecting',
    hasError: connectionStatus === 'error',

    // Helper functions
    getConnectedEmail: () => connectionInfo?.email || null,
    getConnectionDate: () => connectionInfo?.connectedAt ? new Date(connectionInfo.connectedAt) : null,
    getProvider: () => connectionInfo?.provider || null
  };

  return (
    <EmailConnectionContext.Provider value={value}>
      {children}
    </EmailConnectionContext.Provider>
  );
};

export default EmailConnectionContext;
