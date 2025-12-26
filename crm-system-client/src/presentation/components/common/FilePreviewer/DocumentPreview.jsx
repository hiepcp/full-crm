import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Button,
  Alert,
  AlertTitle
} from '@mui/material';
import {
  PictureAsPdf as PictureAsPdfIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

import { FileCategory } from '../../../../utils/fileUtils';
import config from '../../../../config';

/**
 * DocumentPreview - Specialized component for PDF and text file preview
 * T034-T044: PDF iframe rendering, text file fetching/display, error/loading states, accessibility
 *
 * @param {Object} props - Component props
 * @param {Object} props.file - Document file object with url property
 * @param {string} props.resolvedUrl - Resolved file URL (from SharePoint or direct)
 * @param {FileCategory} props.fileCategory - Type of document (PDF or TEXT)
 * @param {Function} props.onLoad - Callback when document loads successfully
 * @param {Function} props.onError - Callback when document fails to load
 * @param {boolean} [props.showToolbar=true] - Show browser PDF toolbar controls (PDF only)
 * @param {boolean} [props.wrapText=true] - Wrap long lines in text files (TXT/CSV only)
 * @param {number} [props.fontSize=14] - Font size for text file display in pixels (TXT/CSV only)
 */
function DocumentPreview({
  file,
  resolvedUrl,
  fileCategory,
  onLoad,
  onError,
  _showToolbar = true,
  wrapText = true,
  fontSize = 14
}) {
  // T036/T039: Loading and error state
  const [contentLoaded, setContentLoaded] = useState(false);
  const [textContent, setTextContent] = useState('');
  const [fetchError, setFetchError] = useState(null);
  const [iframeFailed, setIframeFailed] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);

  const iframeRef = useRef(null);

  // T035: For PDFs with idRef, fetch blob from proxy endpoint to bypass CORS
  // For other files, use resolvedUrl if available, fallback to file.url or file.fileUrl
  useEffect(() => {
    // Cleanup previous blob URL
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [pdfBlobUrl]);

  // Fetch PDF content when file changes
  useEffect(() => {
    console.log('[DocumentPreview] useEffect triggered', {
      fileCategory,
      'file?.idRef': file?.idRef,
      'FileCategory.PDF': FileCategory.PDF,
      'condition': fileCategory === FileCategory.PDF && !!file?.idRef
    });

    if (fileCategory !== FileCategory.PDF || !file?.idRef) {
      setPdfBlobUrl(null);
      return;
    }

    const fetchPdfBlob = async () => {
      try {
        const encodedIdRef = encodeURIComponent(file.idRef);
        const token = localStorage.getItem('accessToken');

        console.log('[DocumentPreview] Fetching PDF blob from:', `${config.API_URL}/files/${encodedIdRef}/content`);

        const response = await fetch(`${config.API_URL}/files/${encodedIdRef}/content`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'XApiKey': config.x_api_key
          }
        });

        console.log('[DocumentPreview] Fetch response:', response.status, response.statusText);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const blob = await response.blob();
        console.log('[DocumentPreview] Blob created:', blob.size, 'bytes, type:', blob.type);
        const blobUrl = URL.createObjectURL(blob);
        console.log('[DocumentPreview] Blob URL created:', blobUrl);
        setPdfBlobUrl(blobUrl);
        console.log('[DocumentPreview] setPdfBlobUrl called with:', blobUrl);
      } catch (error) {
        console.error('[DocumentPreview] Failed to fetch PDF:', error);
        setFetchError(error.message);
      }
    };

    fetchPdfBlob();
  }, [file?.idRef, fileCategory]);

  const fileUrl = (() => {
    console.log('[DocumentPreview] Computing fileUrl', {
      fileCategory,
      pdfBlobUrl,
      'file?.idRef': file?.idRef,
      resolvedUrl
    });

    // If it's a PDF and we have a blob URL, use it
    if (fileCategory === FileCategory.PDF && pdfBlobUrl) {
      console.log('[DocumentPreview] ✅ Using pdfBlobUrl:', pdfBlobUrl);
      return pdfBlobUrl;
    }

    // If it's a PDF and we have an idRef but no blob yet, return null (loading)
    if (fileCategory === FileCategory.PDF && file?.idRef && !pdfBlobUrl) {
      console.log('[DocumentPreview] ⏳ PDF loading, returning null');
      return null;
    }

    // Otherwise use the resolved URL or fallback to file URLs
    const fallbackUrl = resolvedUrl || file?.url || file?.fileUrl || file?.webUrl || file?.downloadUrl;
    console.log('[DocumentPreview] Using fallback URL:', fallbackUrl);
    return fallbackUrl;
  })();

  // Reset state when file changes or resolvedUrl updates
  useEffect(() => {
    setContentLoaded(false);
    setTextContent('');
    setFetchError(null);
    setIframeFailed(false);
  }, [file?.url, file?.id, fileCategory, resolvedUrl]);

  // T035/T036: PDF iframe loading handlers
  useEffect(() => {
    if (fileCategory !== FileCategory.PDF || !iframeRef.current) return;

    const iframe = iframeRef.current;
    let timeoutId;

    const handleLoad = () => {
      setContentLoaded(true);
      setIframeFailed(false);
      if (onLoad) {
        onLoad();
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };

    const handleError = () => {
      setIframeFailed(true);
      setContentLoaded(false);
      if (onError) {
        onError(new Error(`Failed to load PDF: ${fileUrl}`));
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };

    iframe.addEventListener('load', handleLoad);
    iframe.addEventListener('error', handleError);

    // T036: 10-second timeout fallback
    timeoutId = setTimeout(() => {
      if (!contentLoaded) {
        handleError();
      }
    }, 10000);

    return () => {
      iframe.removeEventListener('load', handleLoad);
      iframe.removeEventListener('error', handleError);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [fileCategory, fileUrl, contentLoaded, onLoad, onError]);

  // T039: Fetch text file content
  useEffect(() => {
    if (fileCategory !== FileCategory.TEXT || !fileUrl) return;

    const fetchTextContent = async () => {
      try {
        const response = await fetch(fileUrl);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const text = await response.text();
        setTextContent(text);
        setContentLoaded(true);
        setFetchError(null);

        if (onLoad) {
          onLoad();
        }
      } catch (error) {
        setFetchError(error.message);
        setContentLoaded(false);

        if (onError) {
          onError(error);
        }
      }
    };

    fetchTextContent();
  }, [fileCategory, fileUrl, onLoad, onError]);

  // T037: PDF error state
  if (fileCategory === FileCategory.PDF && iframeFailed) {
    return (
      <Box
        sx={{
          textAlign: 'center',
          py: 8,
          px: 4,
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <PictureAsPdfIcon
          sx={{ fontSize: 64, color: 'error.main', mb: 2 }}
        />
        <Typography variant="h6" gutterBottom>
          Unable to preview PDF
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Your browser cannot display this PDF file or the file is corrupted.
        </Typography>
        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => {
              setIframeFailed(false);
              setContentLoaded(false);
            }}
          >
            Retry
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={() => {
              if (fileUrl) {
                window.open(fileUrl, '_blank', 'noopener,noreferrer');
              }
            }}
          >
            Download PDF
          </Button>
        </Box>
      </Box>
    );
  }

  // T041: Text file error state
  if (fileCategory === FileCategory.TEXT && fetchError) {
    return (
      <Box sx={{ py: 4, px: 2 }}>
        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => {
                setFetchError(null);
                setContentLoaded(false);
              }}
            >
              Retry
            </Button>
          }
        >
          <AlertTitle>Failed to load file</AlertTitle>
          {fetchError}
        </Alert>
      </Box>
    );
  }

  // T038/T042: Loading states
  // For PDFs with blob URL, don't show loading - the blob is ready
  if (!contentLoaded && !iframeFailed && !fetchError) {
    // If it's a PDF and we have a blob URL, don't show loading
    if (fileCategory === FileCategory.PDF && pdfBlobUrl) {
      // Blob is ready, proceed to render
    } else {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            gap: 2
          }}
        >
          <CircularProgress size={48} />
          <Typography variant="body2" color="text.secondary">
            {fileCategory === FileCategory.PDF ? 'Loading PDF...' : 'Fetching file content...'}
          </Typography>
        </Box>
      );
    }
  }

  // T035: Render PDF iframe
  if (fileCategory === FileCategory.PDF) {
    console.log('[DocumentPreview] Rendering PDF iframe with URL:', fileUrl);
    return (
      <Box
        key={fileUrl} // Force re-render when URL changes
        ref={iframeRef}
        component="iframe"
        src={fileUrl}
        title={file?.name || 'PDF document'}
        // T044: Accessibility
        aria-label={`PDF preview of ${file?.name || 'document'}`}
        // Remove sandbox to allow PDF plugins to work
        sx={{
          width: '100%',
          height: '80vh',
          border: 'none',
          backgroundColor: 'background.paper',
          borderRadius: 1,
          boxShadow: 1
        }}
      />
    );
  }

  // T040/T043: Render text file (including CSV)
  if (fileCategory === FileCategory.TEXT) {
    return (
      <Box
        sx={{
          width: '100%',
          maxHeight: '80vh',
          overflow: 'auto',
          backgroundColor: 'background.default',
          p: 3,
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'divider'
        }}
        // T044: Accessibility
        role="article"
        aria-label={`Text file: ${file?.name || 'document'}`}
        tabIndex={0}
      >
        <Typography
          component="pre"
          aria-label="File content"
          sx={{
            fontFamily: '"Fira Code", "Courier New", monospace',
            fontSize: `${fontSize}px`,
            lineHeight: 1.6,
            whiteSpace: wrapText ? 'pre-wrap' : 'pre',
            wordBreak: wrapText ? 'break-word' : 'normal',
            margin: 0,
            color: 'text.primary',
            '& ::selection': {
              backgroundColor: 'primary.light',
              color: 'primary.contrastText'
            }
          }}
        >
          {textContent}
        </Typography>
      </Box>
    );
  }

  return null;
}

export default DocumentPreview;
