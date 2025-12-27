import React, { useState, useRef, useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  LinearProgress,
  Alert,
  IconButton,
  Paper
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Close as CloseIcon,
  InsertDriveFile as InsertDriveFileIcon
} from '@mui/icons-material';
import { RestSharePointRepository } from '@infrastructure/repositories/RestSharePointRepository';
import { UploadDocumentUseCase } from '@application/usecases/sharepoint';

const DocumentUploadDialog = ({
  open,
  onClose,
  entityType,
  entityId,
  onUploadSuccess
}) => {
  const theme = useTheme();
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const sharepointRepository = useMemo(() => new RestSharePointRepository(), []);
  const uploadUseCase = useMemo(
    () => new UploadDocumentUseCase(sharepointRepository),
    [sharepointRepository]
  );

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      setError(null);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    if (!entityType || !entityId) {
      setError('Entity type and ID are required');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('entityType', entityType);
      formData.append('entityId', entityId);

      const result = await uploadUseCase.execute(formData);

      if (onUploadSuccess) {
        onUploadSuccess(result);
      }

      handleClose();
    } catch (err) {
      setError(err.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setError(null);
    setDragActive(false);
    onClose();
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CloudUploadIcon />
            <Typography variant="h6">Upload Document</Typography>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Paper
          variant="outlined"
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          sx={{
            p: 4,
            textAlign: 'center',
            borderStyle: 'dashed',
            borderWidth: 2,
            borderColor: dragActive ? 'primary.main' : 'divider',
            bgcolor: dragActive ? 'action.hover' : 'background.default',
            cursor: 'pointer',
            transition: 'all 0.2s',
            '&:hover': {
              borderColor: 'primary.main',
              bgcolor: 'action.hover'
            }
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          {!selectedFile ? (
            <Box>
              <CloudUploadIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Drag & drop a file here
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                or click to browse
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Maximum file size: 10MB
              </Typography>
            </Box>
          ) : (
            <Box>
              <InsertDriveFileIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
              <Typography variant="body1" sx={{ fontWeight: 600 }} gutterBottom>
                {selectedFile.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatFileSize(selectedFile.size)}
              </Typography>
              <Button
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFile(null);
                }}
                sx={{ mt: 2 }}
              >
                Remove
              </Button>
            </Box>
          )}
        </Paper>

        {uploading && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Uploading to SharePoint...
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={uploading}>
          Cancel
        </Button>
        <Button
          onClick={handleUpload}
          variant="contained"
          disabled={!selectedFile || uploading}
          startIcon={<CloudUploadIcon />}
        >
          Upload
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DocumentUploadDialog;
