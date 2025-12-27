import { useState, useCallback } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { InsertDriveFile as InsertDriveFileIcon } from '@mui/icons-material';

/**
 * ThumbnailGenerator - Component for displaying image thumbnails
 * T046-T053: Thumbnail rendering, click handling, loading/error states, variants, accessibility
 *
 * @param {Object} props - Component props
 * @param {Object} props.file - File object with url property
 * @param {number} [props.size=64] - Thumbnail size in pixels (width and height)
 * @param {Function} [props.onClick] - Callback when thumbnail is clicked
 * @param {string} [props.variant='square'] - Border style: 'square', 'rounded', 'circular'
 * @param {boolean} [props.showFileName=false] - Show file name below thumbnail
 */
function ThumbnailGenerator({
  file,
  size = 64,
  onClick,
  variant = 'square',
  showFileName = false
}) {
  // T049: Loading state
  const [loading, setLoading] = useState(true);

  // T050: Fallback icon state
  const [error, setError] = useState(false);

  const fileUrl = file?.url || file?.fileUrl || file?.webUrl || file?.downloadUrl;

  // T047: Image load handlers
  const handleImageLoad = useCallback(() => {
    setLoading(false);
    setError(false);
  }, []);

  const handleImageError = useCallback(() => {
    setLoading(false);
    setError(true);
  }, []);

  // T048: Click handler
  const handleClick = useCallback(() => {
    if (onClick && file) {
      onClick(file);
    }
  }, [onClick, file]);

  // T051: Variant styles
  const getBorderRadius = () => {
    switch (variant) {
      case 'circular':
        return '50%';
      case 'rounded':
        return 1;
      case 'square':
      default:
        return 0;
    }
  };

  return (
    <Box
      sx={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0.5
      }}
    >
      <Box
        onClick={handleClick}
        sx={{
          position: 'relative',
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'background.default',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: getBorderRadius(),
          overflow: 'hidden',
          cursor: onClick ? 'pointer' : 'default',
          transition: 'all 0.2s',
          '&:hover': onClick ? {
            borderColor: 'primary.main',
            boxShadow: 1,
            transform: 'scale(1.05)'
          } : {}
        }}
        // T053: Accessibility
        role={onClick ? 'button' : 'img'}
        tabIndex={onClick ? 0 : undefined}
        aria-label={file?.name ? `Thumbnail of ${file.name}` : 'File thumbnail'}
        onKeyDown={(e) => {
          if (onClick && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        {/* T049: Loading state */}
        {loading && !error && (
          <CircularProgress
            size={size * 0.4}
            sx={{
              position: 'absolute',
              color: 'primary.main'
            }}
          />
        )}

        {/* T050: Fallback icon when image fails to load */}
        {error && (
          <InsertDriveFileIcon
            sx={{
              fontSize: size * 0.5,
              color: 'text.disabled'
            }}
          />
        )}

        {/* T047: Thumbnail image with lazy loading */}
        {!error && (
          <Box
            component="img"
            src={fileUrl}
            alt={file?.name || 'Thumbnail'}
            loading="lazy"
            onLoad={handleImageLoad}
            onError={handleImageError}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: loading ? 0 : 1,
              transition: 'opacity 0.3s'
            }}
          />
        )}
      </Box>

      {/* T052: Optional file name display */}
      {showFileName && file?.name && (
        <Typography
          variant="caption"
          sx={{
            maxWidth: size,
            textAlign: 'center',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: 'text.secondary'
          }}
          title={file.name}
        >
          {file.name}
        </Typography>
      )}
    </Box>
  );
}

export default ThumbnailGenerator;
