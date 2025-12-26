import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress,
  Stack,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Email as EmailIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  Lock as LockIcon,
  Sync as SyncIcon,
  Cloud as CloudIcon
} from '@mui/icons-material';
import PrimaryButton from '@presentation/components/common/PrimaryButton';

// Import email connection context
import { useEmailConnection } from '@app/contexts/EmailConnectionContext';

// Import repositories
import { LocalAuthRepository } from '@infrastructure/repositories/LocalAuthRepository';
import { EmailAuthRepository } from '@infrastructure/repositories/EmailAuthRepository';

const steps = [
  'Connect Email Account',
  'Grant Permissions',
  'Sync Email Data',
  'Complete Setup'
];

const EmailConnect = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [syncProgress, setSyncProgress] = useState(0);
  const [error, setError] = useState(null);

  // Use email connection context
  const {
    isConnected,
    connectionInfo,
    isConnecting,
    connect,
    disconnect,
    isLoading
  } = useEmailConnection();

  // Update step based on connection status
  useEffect(() => {
    if (isConnected && connectionInfo) {
      setActiveStep(3);
      setError(null);
    } else if (!isConnected && !isConnecting) {
      setActiveStep(0);
    }
  }, [isConnected, connectionInfo, isConnecting]);

  const handleConnectEmail = async () => {
    setError(null);
    setActiveStep(1);

    try {
      const result = await connect();

      if (result.success) {
        setActiveStep(2);
        // Start sync process
        await startEmailSync(result.data);
      } else {
        setError(result.error || 'Authentication failed');
        setActiveStep(0);
      }
    } catch (error) {
      console.error('Error connecting email:', error);
      setError(error.message || 'Failed to connect email account');
      setActiveStep(0);
    }
  };

  const startEmailSync = async (accountInfo) => {
    setActiveStep(2);

    // Simulate sync progress
    const syncInterval = setInterval(() => {
      setSyncProgress(prev => {
        if (prev >= 100) {
          clearInterval(syncInterval);
          setActiveStep(3);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 500);

    try {
      // Use the email repository to sync emails to CRM
      const localRepo = new LocalAuthRepository();
      const emailAuthRepo = new EmailAuthRepository(localRepo);
      await emailAuthRepo.syncEmailsToCRM();

      // Simulate additional processing time
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      console.error('Error syncing emails:', error);
      setError('Failed to sync email data');
      clearInterval(syncInterval);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      setSyncProgress(0);
      setError(null);
    } catch (error) {
      console.error('Error disconnecting email:', error);
      setError('Failed to disconnect email account');
    }
  };

  const handleRetry = () => {
    setError(null);
    handleConnectEmail();
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <EmailIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Connect Your Email Account
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              To take full advantage of Pipeline's email automation for Microsoft cloud-hosted email accounts,
              you must sync with your account's primary email address.
            </Typography>

            {isConnected && connectionInfo && (
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  Currently connected: <strong>{connectionInfo.email}</strong>
                </Typography>
              </Alert>
            )}

            <PrimaryButton
              size="large"
              onClick={handleConnectEmail}
              disabled={isConnecting}
              startIcon={isConnecting ? <CircularProgress size={20} /> : <CloudIcon />}
              sx={{ py: 1.5, px: 4, fontSize: '1.1rem' }}
            >
              {isConnecting ? 'Connecting...' : 'Connect Microsoft Email'}
            </PrimaryButton>

            {error && (
              <Alert severity="error" sx={{ mt: 3 }}>
                {error}
              </Alert>
            )}
          </Box>
        );

      case 1:
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress size={64} sx={{ mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Granting Permissions
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              Please grant the necessary permissions in the popup window to access your email account.
            </Typography>
            <Alert severity="info">
              <Typography variant="body2">
                Email automation is not available for email servers hosted on-premises.
              </Typography>
            </Alert>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <SyncIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Syncing Email Data
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              We're syncing your current inbox and past 60-day history for existing contacts.
              This process may take a few minutes.
            </Typography>

            <Box sx={{ width: '100%', mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Progress</Typography>
                <Typography variant="body2">{Math.round(syncProgress)}%</Typography>
              </Box>
              <Box sx={{
                width: '100%',
                height: 8,
                bgcolor: 'grey.200',
                borderRadius: 4,
                overflow: 'hidden'
              }}>
                <Box sx={{
                  width: `${syncProgress}%`,
                  height: '100%',
                  bgcolor: 'primary.main',
                  borderRadius: 4,
                  transition: 'width 0.5s ease-in-out'
                }} />
              </Box>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </Box>
        );

      case 3:
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Email Sync Complete!
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Your current inbox and past 60-day history for existing contacts has been successfully
              synced with your Pipeline account.
            </Typography>

            <Alert severity="success" sx={{ mb: 3 }}>
              <Typography variant="body2">
                Connected Account: <strong>{connectionInfo?.email}</strong>
              </Typography>
            </Alert>

            <Stack direction="row" spacing={2} justifyContent="center">
              <Button
                variant="outlined"
                onClick={() => window.location.href = '/connect/inbox'}
                startIcon={<EmailIcon />}
              >
                Go to Inbox
              </Button>
              <Button
                variant="outlined"
                onClick={handleDisconnect}
                color="error"
                startIcon={<RefreshIcon />}
              >
                Disconnect
              </Button>
            </Stack>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4, fontWeight: 600 }}>
        Email Integration Setup
      </Typography>

      {/* Connection Status Banner */}
      {isConnected && connectionInfo && activeStep === 3 && (
        <Alert severity="success" sx={{ mb: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <CheckCircleIcon />
            <Typography variant="body2">
              Your email sync is complete! Your current inbox and past 60-day history for existing
              contacts has been successfully synced with your Pipeline account.
            </Typography>
          </Stack>
        </Alert>
      )}

      {/* Error Banner */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          <Typography variant="body2">{error}</Typography>
        </Alert>
      )}

      {/* Stepper */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ pb: '16px !important' }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Card>
        <CardContent>
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Information Cards */}
      <Stack spacing={2} sx={{ mt: 3 }}>
        <Card>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
              <InfoIcon color="primary" />
              <Typography variant="h6">What you'll get with email sync:</Typography>
            </Stack>
            <Box component="ul" sx={{ pl: 4, color: 'text.secondary' }}>
              <li>Automatic email logging to contact records</li>
              <li>Email automation and follow-up reminders</li>
              <li>Two-way email sync with your CRM</li>
              <li>Email templates and tracking</li>
              <li>Contact enrichment from email signatures</li>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
              <LockIcon color="primary" />
              <Typography variant="h6">Permissions Required:</Typography>
            </Stack>
            <Box component="ul" sx={{ pl: 4, color: 'text.secondary' }}>
              <li>Read and send emails</li>
              <li>Access calendar events</li>
              <li>Read contact information</li>
              <li>Full mailbox access for automation</li>
            </Box>
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Note:</strong> Email automation is not available for email servers hosted on-premises.
                Only Microsoft cloud-hosted email accounts are supported.
              </Typography>
            </Alert>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
};

export default EmailConnect;
