import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  IconButton,
  LinearProgress,
  Alert,
  Divider
} from '@mui/material';
import {
  Close as CloseIcon,
  History as HistoryIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { RestSharePointRepository } from '@infrastructure/repositories/RestSharePointRepository';
import { GetVersionHistoryUseCase } from '@application/usecases/sharepoint';

const VersionHistoryDialog = ({
  open,
  onClose,
  document
}) => {
  const theme = useTheme();

  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sharepointRepository = useMemo(() => new RestSharePointRepository(), []);
  const getVersionHistoryUseCase = useMemo(
    () => new GetVersionHistoryUseCase(sharepointRepository),
    [sharepointRepository]
  );

  useEffect(() => {
    if (open && document?.itemId) {
      loadVersionHistory();
    }
  }, [open, document]);

  const loadVersionHistory = async () => {
    if (!document?.itemId) return;

    try {
      setLoading(true);
      setError(null);
      const result = await getVersionHistoryUseCase.execute(document.itemId);
      setVersions(result || []);
    } catch (err) {
      setError(err.message || 'Failed to load version history');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Unknown';
    }
  };

  const getVersionLabel = (version, index) => {
    if (index === 0) return 'Current';
    return `v${version.id || versions.length - index}`;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HistoryIcon />
            <Typography variant="h6">Version History</Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {document && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Document
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {document.name}
            </Typography>
          </Box>
        )}

        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!loading && versions.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <HistoryIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              No version history available
            </Typography>
          </Box>
        )}

        {!loading && versions.length > 0 && (
          <List disablePadding>
            {versions.map((version, index) => (
              <React.Fragment key={version.id || index}>
                <ListItem
                  sx={{
                    px: 0,
                    py: 2,
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 1
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                    <Chip
                      label={getVersionLabel(version, index)}
                      size="small"
                      color={index === 0 ? 'primary' : 'default'}
                      variant={index === 0 ? 'filled' : 'outlined'}
                    />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatDate(version.lastModifiedDateTime)}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {formatFileSize(version.size)}
                    </Typography>
                  </Box>

                  {version.lastModifiedBy && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, pl: 1 }}>
                      <PersonIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        {version.lastModifiedBy}
                      </Typography>
                    </Box>
                  )}

                  {version.eTag && (
                    <Typography variant="caption" color="text.secondary" sx={{ pl: 1 }}>
                      ETag: {version.eTag}
                    </Typography>
                  )}
                </ListItem>
                {index < versions.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default VersionHistoryDialog;
