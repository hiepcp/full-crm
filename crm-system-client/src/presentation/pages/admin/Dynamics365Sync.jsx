import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
  Card,
  CardContent,
  Grid,
  Divider,
} from '@mui/material';
import {
  Sync as SyncIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import dynamics365SyncApi from '@infrastructure/api/dynamics365SyncApi';
import CustomSnackbar from '@presentation/components/CustomSnackbar';

const Dynamics365Sync = () => {
  const [syncStatus, setSyncStatus] = useState(null);
  const [auditLog, setAuditLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  useEffect(() => {
    loadSyncStatus();
    loadAuditLog();

    // Poll for status updates every 5 seconds when syncing
    const interval = setInterval(() => {
      if (syncing) {
        loadSyncStatus();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [syncing, page]);

  const loadSyncStatus = async () => {
    try {
      const response = await dynamics365SyncApi.getStatus();
      if (response.data.success) {
        setSyncStatus(response.data.data);

        // Check if sync is currently running
        if (response.data.data?.status === 'Running') {
          setSyncing(true);
        } else {
          setSyncing(false);
        }
      }
      setError(null);
    } catch (err) {
      setError('Failed to load sync status: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLog = async () => {
    try {
      const response = await dynamics365SyncApi.getAuditLog(page, pageSize);
      if (response.data.success) {
        setAuditLog(response.data.data || []);
      }
    } catch (err) {
      setError('Failed to load audit log: ' + err.message);
    }
  };

  const handleTriggerSync = async () => {
    try {
      setSyncing(true);
      const response = await dynamics365SyncApi.triggerSync();

      if (response.data.success) {
        setSnackbar({
          open: true,
          message: 'Sync started successfully',
          severity: 'success'
        });

        // Reload status and audit log after a short delay
        setTimeout(() => {
          loadSyncStatus();
          loadAuditLog();
        }, 2000);
      }
    } catch (err) {
      setSyncing(false);
      setSnackbar({
        open: true,
        message: 'Failed to trigger sync: ' + err.message,
        severity: 'error'
      });
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    loadSyncStatus();
    loadAuditLog();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString();
  };

  const getSyncStatusColor = (status) => {
    switch (status) {
      case 'Completed':
      case 'Success':
        return 'success';
      case 'Running':
      case 'InProgress':
        return 'info';
      case 'Failed':
      case 'Error':
        return 'error';
      default:
        return 'default';
    }
  };

  const getSyncStatusIcon = (status) => {
    switch (status) {
      case 'Completed':
      case 'Success':
        return <CheckCircleIcon color="success" fontSize="small" />;
      case 'Running':
      case 'InProgress':
        return <CircularProgress size={20} />;
      case 'Failed':
      case 'Error':
        return <ErrorIcon color="error" fontSize="small" />;
      default:
        return <ScheduleIcon color="disabled" fontSize="small" />;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Dynamics 365 Category Sync
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage bidirectional category synchronization between CoreOne CRM and Microsoft Dynamics 365
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={syncing}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={syncing ? <CircularProgress size={20} color="inherit" /> : <SyncIcon />}
            onClick={handleTriggerSync}
            disabled={syncing}
          >
            {syncing ? 'Syncing...' : 'Sync Now'}
          </Button>
        </Stack>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Sync Status Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Current Status
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                {getSyncStatusIcon(syncStatus?.status)}
                <Chip
                  label={syncStatus?.status || 'Unknown'}
                  color={getSyncStatusColor(syncStatus?.status)}
                  size="small"
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Last Sync
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {formatDate(syncStatus?.lastSync)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Next Scheduled Sync
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {formatDate(syncStatus?.nextSync)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Categories Synced
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {syncStatus?.categoriesSynced || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* Audit Log Section */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" gutterBottom>
          Sync Audit Log
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Complete history of all synchronization operations
        </Typography>
      </Box>

      {/* Audit Log Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date/Time</TableCell>
              <TableCell>Direction</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Updated</TableCell>
              <TableCell>Deleted</TableCell>
              <TableCell>Errors</TableCell>
              <TableCell>Trigger Source</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {auditLog.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                    No sync history found. Click "Sync Now" to perform your first synchronization.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              auditLog.map((log) => (
                <TableRow key={log.id} hover>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(log.syncStartedOn)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={log.syncDirection || '-'} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      {getSyncStatusIcon(log.syncStatus)}
                      <Chip
                        label={log.syncStatus || '-'}
                        color={getSyncStatusColor(log.syncStatus)}
                        size="small"
                      />
                    </Stack>
                  </TableCell>
                  <TableCell align="center">
                    <Chip label={log.categoriesCreated || 0} size="small" color="success" />
                  </TableCell>
                  <TableCell align="center">
                    <Chip label={log.categoriesUpdated || 0} size="small" color="info" />
                  </TableCell>
                  <TableCell align="center">
                    <Chip label={log.categoriesDeleted || 0} size="small" color="warning" />
                  </TableCell>
                  <TableCell align="center">
                    {log.errorsEncountered > 0 ? (
                      <Chip label={log.errorsEncountered} size="small" color="error" />
                    ) : (
                      <Chip label="0" size="small" color="default" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {log.triggerSource || '-'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      />
    </Box>
  );
};

export default Dynamics365Sync;
