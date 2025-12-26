import React, { useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  Typography,
  Stack,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  AttachFile as AttachFileIcon,
  Close as CloseIcon,
  CloudUpload as CloudUploadIcon,
  InsertDriveFile as InsertDriveFileIcon,
} from '@mui/icons-material';

/**
 * Component for file upload and attachment management
 */
const FileUploadSection = ({ uploadedFiles, setUploadedFiles, disabled = false }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [showDropzone, setShowDropzone] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setUploadedFiles(prev => [...prev, ...files]);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setUploadedFiles(prev => [...prev, ...files]);
    }
  };

  const removeFile = (fileToRemove) => {
    setUploadedFiles(prev => prev.filter(file => file !== fileToRemove));
  };

  return (
    <Stack spacing={1}>
      <Typography variant="subtitle2" sx={{ fontWeight: 500, color: 'text.secondary' }}>
        Attachments
      </Typography>

      {!showDropzone && (
        <Button
          variant="outlined"
          startIcon={<AttachFileIcon />}
          onClick={() => setShowDropzone(true)}
          disabled={disabled}
          sx={{ alignSelf: 'flex-start' }}
          size="small"
        >
          Upload a file
        </Button>
      )}

      {showDropzone && (
        <Box
          sx={{
            p: 2,
            border: '2px dashed',
            borderColor: isDragOver ? 'primary.main' : disabled ? 'action.disabled' : 'grey.300',
            backgroundColor: isDragOver ? 'action.hover' : 'transparent',
            borderRadius: 1,
            textAlign: 'center',
            transition: 'background-color 0.2s ease, border-color 0.2s ease',
            position: 'relative',
            opacity: disabled ? 0.5 : 1,
            pointerEvents: disabled ? 'none' : 'auto',
          }}
          onDragOver={disabled ? undefined : handleDragOver}
          onDragLeave={disabled ? undefined : handleDragLeave}
          onDrop={disabled ? undefined : handleDrop}
        >
          <IconButton
            aria-label="close dropzone"
            size="small"
            onClick={() => setShowDropzone(false)}
            sx={{ position: 'absolute', top: 6, right: 6 }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
          <CloudUploadIcon sx={{ fontSize: 40, color: 'action.active', mb: 1 }} />
          <Typography variant="body1" gutterBottom>
            Drag and drop files here
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            or
          </Typography>
          <Button variant="outlined" component="label" size="small" disabled={disabled}>
            Browse Files
            <input type="file" hidden multiple onChange={handleFileSelect} disabled={disabled} />
          </Button>
        </Box>
      )}

      {uploadedFiles.length > 0 && (
        <List dense>
          {uploadedFiles.map((file, index) => (
            <ListItem
              key={index}
              sx={{
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                mb: 0.5,
              }}
              secondaryAction={
                <IconButton edge="end" aria-label="delete" onClick={() => removeFile(file)} disabled={disabled}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              }
            >
              <ListItemIcon sx={{ minWidth: '32px' }}>
                <InsertDriveFileIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography variant="body2" noWrap>
                    {file.name}
                  </Typography>
                }
                secondary={
                  <Typography variant="caption" color="text.secondary">
                    {(file.size / 1024).toFixed(1)} KB
                  </Typography>
                }
              />
            </ListItem>
          ))}
        </List>
      )}
    </Stack>
  );
};

export default FileUploadSection;

