import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  IconButton,
  Chip,
  CircularProgress,
  Typography,
  Button
} from '@mui/material';
import {
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Refresh as RefreshIcon,
  BrokenImage as BrokenImageIcon
} from '@mui/icons-material';

/**
 * ImagePreview - Specialized component for image file preview with zoom and pan
 * T017-T029: Image display, zoom controls, pan functionality, error/loading states, accessibility
 *
 * @param {Object} props - Component props
 * @param {Object} props.file - Image file object with url property
 * @param {string} props.resolvedUrl - Resolved file URL (from SharePoint or direct)
 * @param {number} props.zoomLevel - Current zoom level (1 = 100%, 2 = 200%, etc.)
 * @param {Object} props.position - Pan position {x, y}
 * @param {Function} props.onZoomChange - Callback when zoom changes
 * @param {Function} props.onPositionChange - Callback when position changes
 * @param {Function} props.onLoad - Callback when image loads successfully
 * @param {Function} props.onError - Callback when image fails to load
 * @param {number} [props.maxZoom=4] - Maximum zoom level
 * @param {number} [props.minZoom=1] - Minimum zoom level
 */
function ImagePreview({
  file,
  resolvedUrl,
  zoomLevel = 1,
  position = { x: 0, y: 0 },
  onZoomChange,
  onPositionChange,
  onLoad,
  onError,
  maxZoom = 4,
  minZoom = 1
}) {
  // T018: Image loading state
  const [imageLoaded, setImageLoaded] = useState(false);
  const [naturalSize, setNaturalSize] = useState(null);
  const [imageError, setImageError] = useState(false);

  // T021: Pan state management
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);

  const imageRef = useRef(null);

  // Reset state when file changes or resolvedUrl updates
  useEffect(() => {
    console.log('[ImagePreview] 🔄 Resetting state due to file/resolvedUrl change');
    console.log('[ImagePreview] New resolvedUrl:', resolvedUrl);
    setImageLoaded(false);
    setImageError(false); // CRITICAL: Reset error when resolvedUrl changes!
    setNaturalSize(null);
  }, [file?.url, file?.id, resolvedUrl]);

  // T018: Image load handlers
  const handleImageLoad = useCallback((e) => {
    const img = e.target;
    setNaturalSize({
      width: img.naturalWidth,
      height: img.naturalHeight
    });
    setImageLoaded(true);
    setImageError(false);

    if (onLoad) {
      onLoad();
    }
  }, [onLoad]);

  const handleImageError = useCallback((_e) => {
    setImageError(true);
    setImageLoaded(false);

    if (onError) {
      onError(new Error(`Failed to load image: ${file?.url || 'unknown'}`));
    }
  }, [file, onError]);

  // T019: Zoom controls
  const handleZoomIn = useCallback(() => {
    const newZoom = Math.min(zoomLevel + 0.5, maxZoom);
    if (onZoomChange) {
      onZoomChange(newZoom);
    }
  }, [zoomLevel, maxZoom, onZoomChange]);

  const handleZoomOut = useCallback(() => {
    const newZoom = Math.max(zoomLevel - 0.5, minZoom);
    if (onZoomChange) {
      onZoomChange(newZoom);
    }

    // T023: Reset position when zooming back to 1x
    if (newZoom === 1 && onPositionChange) {
      onPositionChange({ x: 0, y: 0 });
    }
  }, [zoomLevel, minZoom, onZoomChange, onPositionChange]);

  const handleResetZoom = useCallback(() => {
    if (onZoomChange) {
      onZoomChange(1);
    }
    if (onPositionChange) {
      onPositionChange({ x: 0, y: 0 });
    }
  }, [onZoomChange, onPositionChange]);

  // T022: Mouse drag handlers for panning
  const handleMouseDown = useCallback((e) => {
    if (zoomLevel <= 1) return; // No panning when not zoomed

    setDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
    e.preventDefault(); // Prevent text selection
  }, [zoomLevel, position]);

  const handleMouseMove = useCallback((e) => {
    if (!dragging || !dragStart) return;

    const newPosition = {
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    };

    if (onPositionChange) {
      onPositionChange(newPosition);
    }
  }, [dragging, dragStart, onPositionChange]);

  const handleMouseUp = useCallback(() => {
    setDragging(false);
    setDragStart(null);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (dragging) {
      setDragging(false);
      setDragStart(null);
    }
  }, [dragging]);

  // T024: Double-click zoom toggle
  const handleDoubleClick = useCallback(() => {
    if (zoomLevel === 1) {
      // Zoom to 2x on double-click
      if (onZoomChange) {
        onZoomChange(2);
      }
    } else {
      // Reset zoom on double-click when zoomed
      handleResetZoom();
    }
  }, [zoomLevel, onZoomChange, handleResetZoom]);

  // T025: Keyboard shortcuts for zoom
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case '+':
        case '=':
          e.preventDefault();
          handleZoomIn();
          break;
        case '-':
          e.preventDefault();
          handleZoomOut();
          break;
        case '0':
          e.preventDefault();
          handleResetZoom();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleZoomIn, handleZoomOut, handleResetZoom]);

  // T034: Use resolvedUrl if available, fallback to file.url or file.fileUrl
  const fileUrl = resolvedUrl || file?.url || file?.fileUrl || file?.webUrl || file?.downloadUrl;

  // Debug logging - log every time props change
  useEffect(() => {
    console.log('[ImagePreview] 🔄 Props changed!');
    console.log('[ImagePreview] resolvedUrl:', resolvedUrl);
    console.log('[ImagePreview] file.url:', file?.url);
    console.log('[ImagePreview] Computed fileUrl:', fileUrl);
    console.log('[ImagePreview] Will use:', fileUrl ? 'fileUrl' : 'NO URL');
  }, [fileUrl, resolvedUrl, file]);

  // T026: Image error state
  // Show error only if we've tried to load with the current fileUrl and it failed
  if (imageError) {
    console.log('[ImagePreview] ⚠️ Showing error state (imageError=true)');
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          textAlign: 'center',
          py: 8,
          px: 4
        }}
      >
        <BrokenImageIcon
          sx={{ fontSize: 64, color: 'error.main', mb: 2 }}
        />
        <Typography variant="h6" gutterBottom>
          Unable to load image
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          The image file could not be loaded. It may be corrupted or no longer available.
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => {
            setImageError(false);
            setImageLoaded(false);
          }}
          sx={{ mt: 2 }}
        >
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        width: '100%'
      }}
    >
      {/* T017/T020/T023: Image container with zoom and pan */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          minHeight: '60vh',
          maxHeight: '80vh',
          overflow: zoomLevel > 1 ? 'hidden' : 'visible',
          position: 'relative',
          backgroundColor: 'rgba(0, 0, 0, 0.05)',
          borderRadius: 1,
          cursor: zoomLevel > 1
            ? (dragging ? 'grabbing' : 'grab')
            : 'zoom-in'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onDoubleClick={handleDoubleClick}
        // T029: Accessibility
        role="img"
        aria-label={`Image preview: ${file?.name || 'image'}`}
        aria-describedby="image-zoom-instructions"
      >
        {/* T027: Loading state */}
        {!imageLoaded && !imageError && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2
            }}
          >
            <CircularProgress size={48} />
            <Typography variant="body2" color="text.secondary">
              Loading image...
            </Typography>
          </Box>
        )}

        {/* T020/T023: Image with zoom and pan transforms */}
        <Box
          key={fileUrl} // Force re-render when URL changes
          ref={imageRef}
          component="img"
          src={fileUrl}
          alt={file?.name || 'Preview image'}
          onLoad={handleImageLoad}
          onError={handleImageError}
          sx={{
            // T020: CSS transform for zoom
            transform: `scale(${zoomLevel}) translate(${position.x / zoomLevel}px, ${position.y / zoomLevel}px)`,
            transition: dragging ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            transformOrigin: 'center center',
            maxWidth: zoomLevel === 1 ? '100%' : 'none',
            maxHeight: zoomLevel === 1 ? '80vh' : 'none',
            width: zoomLevel > 1 && naturalSize ? `${naturalSize.width}px` : 'auto',
            height: zoomLevel > 1 && naturalSize ? `${naturalSize.height}px` : 'auto',
            objectFit: 'contain',
            userSelect: 'none',
            pointerEvents: zoomLevel > 1 ? 'none' : 'auto',
            opacity: imageLoaded ? 1 : 0
          }}
        />

        {/* T029: Screen reader instructions */}
        <Typography
          id="image-zoom-instructions"
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
          Use plus and minus keys to zoom. Click and drag to pan when zoomed. Double-click to toggle zoom.
        </Typography>
      </Box>

      {/* T028: Zoom controls toolbar */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 1,
          py: 1
        }}
      >
        <IconButton
          onClick={handleZoomOut}
          disabled={zoomLevel <= minZoom}
          aria-label="Zoom out"
          size="small"
        >
          <ZoomOutIcon />
        </IconButton>

        <Chip
          label={`${Math.round(zoomLevel * 100)}%`}
          size="small"
          onClick={handleResetZoom}
          sx={{
            cursor: 'pointer',
            minWidth: 60,
            '&:hover': {
              backgroundColor: 'action.hover'
            }
          }}
          title="Click to reset zoom"
        />

        <IconButton
          onClick={handleZoomIn}
          disabled={zoomLevel >= maxZoom}
          aria-label="Zoom in"
          size="small"
        >
          <ZoomInIcon />
        </IconButton>
      </Box>
    </Box>
  );
}

export default ImagePreview;
