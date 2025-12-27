import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Box,
  Typography,
  CircularProgress,
  LinearProgress,
  Button,
  Chip,
  useMediaQuery,
  useTheme,
  Alert,
  AlertTitle
} from '@mui/material';
import {
  Close as CloseIcon,
  NavigateBefore as NavigateBeforeIcon,
  NavigateNext as NavigateNextIcon,
  Download as DownloadIcon,
  InsertDriveFile as FileIcon,
  BrokenImage as BrokenImageIcon
} from '@mui/icons-material';

import { getFileCategory,
  formatFileSize,
  shouldSkipPreview,
  FileCategory
} from '../../../../utils/fileUtils';

// T030: Import ImagePreview component
import ImagePreview from './ImagePreview';

// T045: Import DocumentPreview component
import DocumentPreview from './DocumentPreview';

// T027: Import filesApi and resolveFileUrl for SharePoint file retrieval
import filesApi from '../../../../infrastructure/api/filesApi';
import { resolveFileUrl } from '../../../../utils/filePathUtils';

/**
 * FilePreviewModal - Main container for file preview functionality
 * T006-T016: Modal shell, state management, navigation, keyboard shortcuts,
 * error/loading states, responsive behavior, and accessibility
 *
 * @param {Object} props - Component props
 * @param {boolean} props.open - Controls modal visibility
 * @param {Function} props.onClose - Callback when modal closes
 * @param {Array} props.files - Array of attachment objects
 * @param {Object|null} props.currentFile - Currently selected file
 * @param {number} [props.initialIndex=0] - Starting index in files array
 * @param {string} [props.maxWidth='lg'] - MUI Dialog max width
 * @param {boolean} [props.fullScreen] - Force fullscreen mode
 * @param {Function} [props.onFileChange] - Callback when file changes
 * @param {Function} [props.onDownload] - Callback for download action
 * @param {Function} [props.onError] - Callback when preview fails
 */
function FilePreviewModal({
  open,
  onClose,
  files = [],
  currentFile = null,
  initialIndex = 0,
  maxWidth = 'lg',
  fullScreen,
  onFileChange,
  onDownload,
  onError
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isFullScreen = fullScreen !== undefined ? fullScreen : isMobile;

  // T007: Modal state management
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // T028: State for resolved URL (SharePoint file retrieval)
  const [resolvedUrl, setResolvedUrl] = useState(null);
  const [urlLoading, setUrlLoading] = useState(false);

  // Derive current display file from current index
  const currentDisplayFile = files[currentIndex];
  const fileCategory = currentDisplayFile ? getFileCategory(currentDisplayFile) : FileCategory.UNSUPPORTED;
  const isFileTooLarge = currentDisplayFile ? shouldSkipPreview(currentDisplayFile) : false;

  // Initialize current index based on currentFile
  useEffect(() => {
    if (open && currentFile && files.length > 0) {
      const index = files.findIndex(f => f.id === currentFile.id || f === currentFile);
      if (index !== -1) {
        setCurrentIndex(index);
      }
    }
  }, [open, currentFile, files]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!open) {
      setLoading(false);
      setError(null);
      setZoomLevel(1);
      setPosition({ x: 0, y: 0 });
      setResolvedUrl(null);
      setUrlLoading(false);
    }
  }, [open]);

  // T029: Fetch signed URL when currentDisplayFile changes
  useEffect(() => {
    if (!open || !currentDisplayFile) {
      setResolvedUrl(null);
      return;
    }

    console.log('[FilePreviewModal] currentDisplayFile:', currentDisplayFile);
    console.log('[FilePreviewModal] currentDisplayFile.idRef:', currentDisplayFile.idRef);

    const fetchUrl = async () => {
      setUrlLoading(true);
      try {
        const url = await resolveFileUrl(currentDisplayFile, filesApi);
        console.log('[FilePreviewModal] ✅ Resolved URL:', url);
        setResolvedUrl(url);
        console.log('[FilePreviewModal] ✅ Called setResolvedUrl with:', url);
      } catch (err) {
        console.error('Failed to resolve file URL:', err);
        setError(err.message);
      } finally {
        setUrlLoading(false);
      }
    };

    fetchUrl();
  }, [currentDisplayFile, open]);

  // Debug: Log resolvedUrl state changes
  useEffect(() => {
    console.log('[FilePreviewModal] 🔄 resolvedUrl state changed to:', resolvedUrl);
  }, [resolvedUrl]);

  // T009: Navigation controls
  const canNavigatePrevious = currentIndex > 0;
  const canNavigateNext = currentIndex < files.length - 1;

  const handlePrevious = useCallback(() => {
    if (!canNavigatePrevious) return;

    const newIndex = currentIndex - 1;
    setCurrentIndex(newIndex);
    setLoading(true);
    setError(null);
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });

    if (onFileChange) {
      onFileChange(files[newIndex], newIndex);
    }
  }, [currentIndex, canNavigatePrevious, files, onFileChange]);

  const handleNext = useCallback(() => {
    if (!canNavigateNext) return;

    const newIndex = currentIndex + 1;
    setCurrentIndex(newIndex);
    setLoading(true);
    setError(null);
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });

    if (onFileChange) {
      onFileChange(files[newIndex], newIndex);
    }
  }, [currentIndex, canNavigateNext, files, onFileChange]);

  // T010: Keyboard shortcuts handler
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handlePrevious();
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleNext();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, handlePrevious, handleNext, onClose]);

  // T012: Download handler
  const handleDownload = useCallback(() => {
    const file = files[currentIndex];
    if (!file) return;

    if (onDownload) {
      onDownload(file);
    } else {
      // Default behavior: open URL in new tab
      const url = file.url || file.fileUrl || file.webUrl || file.downloadUrl;
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    }
  }, [currentIndex, files, onDownload]);

  // Handle preview errors
  const handlePreviewError = useCallback((errorObj) => {
    setError(errorObj.message || 'Failed to load file');
    setLoading(false);

    if (onError) {
      onError(errorObj, currentDisplayFile);
    }
  }, [currentDisplayFile, onError]);

  // Handle successful load
  const handlePreviewLoad = useCallback(() => {
    setLoading(false);
    setError(null);
  }, []);

  // T013: Error states
  const renderErrorState = () => {
    if (!currentDisplayFile) {
      return (
        <Box sx={{ textAlign: 'center', py: 8, px: 4 }}>
          <FileIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No file selected
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Please select a file to preview
          </Typography>
        </Box>
      );
    }

    const fileUrl = currentDisplayFile.url || currentDisplayFile.fileUrl ||
                    currentDisplayFile.webUrl || currentDisplayFile.downloadUrl;

    if (!fileUrl) {
      return (
        <Box sx={{ textAlign: 'center', py: 8, px: 4 }}>
          <BrokenImageIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            File URL missing
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            This file cannot be previewed because its URL is not available.
          </Typography>
          <Button
            variant="outlined"
            onClick={onClose}
            sx={{ mt: 2 }}
          >
            Close
          </Button>
        </Box>
      );
    }

    if (fileCategory === FileCategory.UNSUPPORTED) {
      return (
        <Box sx={{ textAlign: 'center', py: 8, px: 4 }}>
          <FileIcon sx={{ fontSize: 64, color: 'warning.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Preview not available
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            This file type ({currentDisplayFile.name?.split('.').pop()?.toUpperCase() || 'unknown'}) cannot be previewed.
          </Typography>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleDownload}
            sx={{ mt: 2 }}
          >
            Download File
          </Button>
        </Box>
      );
    }

    if (isFileTooLarge) {
      return (
        <Box sx={{ textAlign: 'center', py: 8, px: 4 }}>
          <Alert severity="info" sx={{ maxWidth: 500, mx: 'auto', mb: 3 }}>
            <AlertTitle>File too large to preview</AlertTitle>
            This file ({formatFileSize(currentDisplayFile.size)}) exceeds the 50MB preview limit.
          </Alert>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleDownload}
          >
            Download File
          </Button>
        </Box>
      );
    }

    if (error) {
      return (
        <Box sx={{ textAlign: 'center', py: 8, px: 4 }}>
          <BrokenImageIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Preview failed
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {error}
          </Typography>
          <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="outlined"
              onClick={() => {
                setError(null);
                setLoading(true);
              }}
            >
              Retry
            </Button>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={handleDownload}
            >
              Download Instead
            </Button>
          </Box>
        </Box>
      );
    }

    return null;
  };

  // T014: Loading state
  const renderLoadingState = () => {
    // T030: Show loading state while fetching URL
    if (!loading && !urlLoading) return null;

    return (
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          zIndex: 1
        }}
      >
        <CircularProgress size={48} />
        <Typography variant="body2" color="text.secondary">
          {urlLoading ? 'Loading file...' : 'Loading preview...'}
        </Typography>
      </Box>
    );
  };

  // T008: Render preview component based on file type
  const renderPreview = () => {
    if (!currentDisplayFile || error || isFileTooLarge || fileCategory === FileCategory.UNSUPPORTED) {
      return renderErrorState();
    }

    // T030: Render ImagePreview for IMAGE category
    // T032: Pass resolvedUrl prop to ImagePreview
    if (fileCategory === FileCategory.IMAGE) {
      // Don't render preview until we have resolvedUrl (prevents showing error with wrong URL)
      if (!resolvedUrl && urlLoading) {
        return null; // Let the loading state show instead
      }

      return (
        <ImagePreview
          file={currentDisplayFile}
          resolvedUrl={resolvedUrl}
          zoomLevel={zoomLevel}
          position={position}
          onZoomChange={setZoomLevel}
          onPositionChange={setPosition}
          onLoad={handlePreviewLoad}
          onError={handlePreviewError}
        />
      );
    }

    // T045: Render DocumentPreview for PDF and TEXT categories
    // T033: Pass resolvedUrl prop to DocumentPreview
    if (fileCategory === FileCategory.PDF || fileCategory === FileCategory.TEXT) {
      return (
        <DocumentPreview
          file={currentDisplayFile}
          resolvedUrl={resolvedUrl}
          fileCategory={fileCategory}
          onLoad={handlePreviewLoad}
          onError={handlePreviewError}
        />
      );
    }

    // Fallback for any unexpected category
    return renderErrorState();
  };

  // T011: Modal header
  const fileName = currentDisplayFile?.name || 'Unknown file';
  const fileSize = currentDisplayFile?.size ? formatFileSize(currentDisplayFile.size) : '';
  const fileCounter = files.length > 0 ? `${currentIndex + 1} / ${files.length}` : '';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullScreen={isFullScreen}
      fullWidth
      // T016: Accessibility
      aria-labelledby="file-preview-title"
      aria-describedby="file-preview-description"
      sx={{
        '& .MuiDialog-paper': {
          backgroundColor: 'background.default'
        }
      }}
    >
      {/* T014: Linear progress for file transitions */}
      {loading && <LinearProgress />}

      {/* T011: Dialog header */}
      <DialogTitle
        id="file-preview-title"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          pb: 1
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="h6"
            component="div"
            noWrap
            sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
          >
            {fileName}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
            {fileSize && (
              <Chip label={fileSize} size="small" variant="outlined" />
            )}
            {fileCounter && (
              <Chip label={fileCounter} size="small" variant="outlined" />
            )}
          </Box>
        </Box>

        <IconButton
          onClick={onClose}
          aria-label="Close preview"
          edge="end"
          size="small"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          p: { xs: 1, sm: 2 },
          minHeight: '60vh'
        }}
      >
        {/* T016: Screen reader description */}
        <Box
          id="file-preview-description"
          sx={{
            position: 'absolute',
            width: 1,
            height: 1,
            margin: -1,
            padding: 0,
            overflow: 'hidden',
            clip: 'rect(0, 0, 0, 0)',
            border: 0
          }}
        >
          <Typography>
            File preview for {fileName}. Use arrow keys to navigate between files. Press Escape to close.
          </Typography>
        </Box>

        {/* Main preview area */}
        <Box sx={{ flex: 1, position: 'relative' }}>
          {renderPreview()}
          {renderLoadingState()}
        </Box>

        {/* T012: Modal footer with navigation and actions */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pt: 2,
            gap: 2,
            flexWrap: { xs: 'wrap', sm: 'nowrap' }
          }}
        >
          {/* T009: Navigation controls */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton
              onClick={handlePrevious}
              disabled={!canNavigatePrevious || files.length <= 1}
              aria-label="Previous file"
              size="small"
            >
              <NavigateBeforeIcon />
            </IconButton>
            <IconButton
              onClick={handleNext}
              disabled={!canNavigateNext || files.length <= 1}
              aria-label="Next file"
              size="small"
            >
              <NavigateNextIcon />
            </IconButton>
          </Box>

          {/* Download button */}
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleDownload}
            disabled={!currentDisplayFile}
            size="small"
          >
            Download
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

export default FilePreviewModal;
