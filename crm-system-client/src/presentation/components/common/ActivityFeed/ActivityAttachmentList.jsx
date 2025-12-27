import React, { useState } from 'react';
import { Box, Stack, Typography, IconButton, Tooltip, Snackbar, Alert } from '@mui/material';
import {
  InsertDriveFile as InsertDriveFileIcon,
  OpenInNew as OpenInNewIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';

// T031-T033: Import preview utilities and components
import { shouldSkipPreview, formatFileSize as formatFileSizeUtil, isImageFile } from '../../../../utils/fileUtils';
import FilePreviewModal from '../FilePreviewer/FilePreviewModal';

// T054: Import ThumbnailGenerator
import ThumbnailGenerator from '../FilePreviewer/ThumbnailGenerator';

const formatFileSize = (size) => {
  if (size === null || size === undefined || Number.isNaN(size)) return null;
  const num = Number(size);
  if (num < 1024) return `${num} B`;
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
  if (num < 1024 * 1024 * 1024) return `${(num / (1024 * 1024)).toFixed(1)} MB`;
  return `${(num / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const metaText = (item) => {
  const parts = [];
  const size = formatFileSize(item.size);
  if (size) parts.push(size);
  if (item.mimeType) parts.push(item.mimeType);
  if (item.source === 'sharepoint') parts.push('SharePoint');
  return parts.join(' • ');
};

const AttachmentItem = ({ item, variant, onPreview }) => {
  const handleOpen = (e) => {
    e.stopPropagation();
    if (item.url) {
      window.open(item.url, '_blank', 'noopener,noreferrer');
    }
  };

  // T031: Add preview handler
  const handlePreview = (e) => {
    e.stopPropagation();
    if (onPreview) {
      onPreview(item);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        p: variant === 'compact' ? 0.5 : 1,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        bgcolor: 'background.default',
      }}
    >
      {/* T054/T055: Replace file icon with thumbnail for images */}
      {isImageFile(item) ? (
        <ThumbnailGenerator
          file={item}
          size={variant === 'compact' ? 40 : 48}
          onClick={handlePreview}
          variant="rounded"
        />
      ) : (
        <InsertDriveFileIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
      )}

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" noWrap={variant === 'compact'}>
          {item.name || 'Unnamed file'}
        </Typography>
        {metaText(item) && (
          <Typography variant="caption" color="text.secondary">
            {metaText(item)}
          </Typography>
        )}
      </Box>

      {/* T031: Preview icon button */}
      {item.url && (
        <Tooltip title="Preview file">
          <IconButton size="small" onClick={handlePreview}>
            <VisibilityIcon fontSize="inherit" />
          </IconButton>
        </Tooltip>
      )}

      {item.url && (
        <Tooltip title="Open file">
          <IconButton size="small" onClick={handleOpen}>
            <OpenInNewIcon fontSize="inherit" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
};

const ActivityAttachmentList = ({ items = [], variant = 'compact', sx }) => {
  // T032: State management for FilePreviewModal
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  // T033: State for file size warning snackbar
  const [skipMessage, setSkipMessage] = useState('');

  if (!items || items.length === 0) return null;

  // T031: Handle preview click
  const handlePreviewClick = (file) => {
    // T033: Check if file is too large
    if (shouldSkipPreview(file)) {
      setSkipMessage(
        `File too large to preview (${formatFileSizeUtil(file.size)}). Click "Open file" to view.`
      );
      return;
    }

    // T032: Open preview modal
    setSelectedFile(file);
    setPreviewOpen(true);
  };

  return (
    <>
      <Stack spacing={0.75} sx={sx} onClick={(e) => e.stopPropagation()}>
        {items.map((item, index) => (
          <AttachmentItem
            key={item.id || item.url || index}
            item={item}
            variant={variant}
            onPreview={handlePreviewClick}
          />
        ))}
      </Stack>

      {/* T032: File preview modal */}
      <FilePreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        files={items}
        currentFile={selectedFile}
      />

      {/* T033: File too large warning snackbar */}
      <Snackbar
        open={!!skipMessage}
        autoHideDuration={6000}
        onClose={() => setSkipMessage('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity="info"
          onClose={() => setSkipMessage('')}
          sx={{ width: '100%' }}
        >
          {skipMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ActivityAttachmentList;
