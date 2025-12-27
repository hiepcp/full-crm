import React, { useState, useEffect, useMemo, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { FixedSizeList as List } from 'react-window';
import {
  Box,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  IconButton,
  Typography,
  useMediaQuery,
  useTheme,
  Tooltip,
  Divider
} from '@mui/material';
import {
  Download as DownloadIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

/**
 * ExcelPreview Component
 * Displays Excel files (.xlsx, .xls) with multi-sheet navigation and virtualized grid
 *
 * @param {Object} props
 * @param {Object} props.file - File metadata (idRef, fileName, fileSize, mimeType)
 * @param {Function} props.onDownload - Callback for download button
 * @param {Function} props.onError - Callback for error handling
 */
const ExcelPreview = ({ file, onDownload, onError }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // State management
  const [workbook, setWorkbook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSheetIndex, setCurrentSheetIndex] = useState(0);
  const [warnings, setWarnings] = useState([]);

  // Load Excel file on component mount
  useEffect(() => {
    loadExcelFile();
    // Cleanup on unmount
    return () => {
      setWorkbook(null);
    };
  }, [file.idRef]);

  /**
   * Handle download button click
   * T044: Implement handleDownload() function that calls onDownload prop callback
   */
  const handleDownload = useCallback(() => {
    if (onDownload) {
      onDownload(file);
    }
  }, [onDownload, file]);

  /**
   * Load and parse Excel file
   * Implements T013, T014, T015, T016, T017
   */
  const loadExcelFile = async () => {
    try {
      setLoading(true);
      setError(null);

      // T013: Fetch binary content via filesApi
      // For now, using placeholder - actual API integration needed
      const arrayBuffer = await fetchFileContent(file.idRef);

      // T015: Validate file size (20MB limit - FR-009)
      const fileSizeMB = arrayBuffer.byteLength / (1024 * 1024);
      if (fileSizeMB > 20) {
        throw new Error('File size exceeds 20MB limit');
      }

      // Validate file format (magic bytes)
      validateExcelFormat(arrayBuffer);

      // T014: Parse with SheetJS
      const wb = XLSX.read(arrayBuffer, { type: 'array' });

      if (!wb || !wb.SheetNames || wb.SheetNames.length === 0) {
        throw new Error('No sheets found in workbook');
      }

      setWorkbook(wb);

      // Detect unsupported features (macros, charts, etc.)
      detectUnsupportedFeatures(wb);

      setLoading(false);
    } catch (err) {
      console.error('Excel preview error:', err);
      setError(err.message || 'Unable to preview this file');
      setLoading(false);
      onError?.(err);
    }
  };

  /**
   * Placeholder for file content fetching
   * TODO: Replace with actual filesApi.getFileContent(idRef)
   */
  const fetchFileContent = async (idRef) => {
    // Placeholder - should call: await filesApi.getFileContent(idRef);
    throw new Error('File API not implemented yet - placeholder for testing');
  };

  /**
   * Validate Excel file format using magic bytes
   * T015: File validation
   */
  const validateExcelFormat = (arrayBuffer) => {
    const uint8Array = new Uint8Array(arrayBuffer);
    const header = uint8Array.slice(0, 4);

    // .xlsx files start with PK (ZIP format): 50 4B
    const isXlsx = header[0] === 0x50 && header[1] === 0x4B;
    // .xls files start with: D0 CF (OLE2 format)
    const isXls = header[0] === 0xD0 && header[1] === 0xCF;

    if (!isXlsx && !isXls) {
      throw new Error('Invalid Excel file format. File may be corrupted.');
    }

    // Check for password protection (encrypted files)
    if (isXlsx) {
      try {
        // SheetJS will throw if file is encrypted
        XLSX.read(arrayBuffer, { type: 'array', password: null });
      } catch (e) {
        if (e.message && (e.message.includes('password') || e.message.includes('encrypted'))) {
          throw new Error('This file is password-protected and cannot be previewed. Please download it.');
        }
      }
    }
  };

  /**
   * Detect unsupported Excel features
   * T049, T051-T054 (User Story 3 preview)
   */
  const detectUnsupportedFeatures = (wb) => {
    const detected = [];

    // Check for macros (VBA project)
    if (wb.vbaProject || wb.Workbook?.WBProps?.CodeName) {
      detected.push('This file contains macros that will not execute in preview mode.');
    }

    // Check each sheet for charts and pivot tables
    wb.SheetNames.forEach((sheetName) => {
      const worksheet = wb.Sheets[sheetName];

      // Check for charts
      if (worksheet['!charts'] && worksheet['!charts'].length > 0) {
        detected.push('Charts are not supported in preview. Download the file to view all content.');
      }

      // Check for pivot tables
      if (worksheet['!pivots']) {
        detected.push('Pivot tables are not fully supported in preview.');
      }
    });

    // Check for external links
    if (wb.Workbook?.ExternalReferences) {
      detected.push('External links may not display correctly.');
    }

    // Remove duplicates
    setWarnings([...new Set(detected)]);
  };

  /**
   * Parse current sheet data with memoization
   * T018, T019, T020, T021
   */
  const sheetData = useMemo(() => {
    if (!workbook || !workbook.SheetNames[currentSheetIndex]) {
      return { data: [], rowCount: 0, colCount: 0, isTruncated: false };
    }

    const sheetName = workbook.SheetNames[currentSheetIndex];
    const worksheet = workbook.Sheets[sheetName];

    // T018: Convert sheet to JSON array
    let data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    // T019: Limit to 10,000 rows (FR-010)
    const isTruncated = data.length > 10000;
    if (isTruncated) {
      data = data.slice(0, 10000);
    }

    const rowCount = data.length;
    const colCount = data.length > 0 ? Math.max(...data.map(row => row.length)) : 0;

    return { data, rowCount, colCount, isTruncated };
  }, [workbook, currentSheetIndex]);

  /**
   * Row renderer for virtualized list
   * T026, T027, T028
   */
  const Row = useCallback(({ index, style }) => {
    const rowData = sheetData.data[index] || [];
    const rowHeight = isMobile ? 35 : 40;

    return (
      <Box
        style={{ ...style, height: rowHeight }}
        display="flex"
        borderBottom="1px solid #e0e0e0"
        sx={{ '&:hover': { backgroundColor: '#f5f5f5' } }}
      >
        {/* Row number column */}
        <Box
          px={1}
          py={0.5}
          minWidth="50px"
          maxWidth="50px"
          borderRight="1px solid #d0d0d0"
          bgcolor="#f9f9f9"
          fontWeight="bold"
          fontSize="0.875rem"
          color="text.secondary"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          {index + 1}
        </Box>

        {/* Cell data columns */}
        {Array.from({ length: Math.max(10, sheetData.colCount) }).map((_, colIndex) => (
          <Box
            key={colIndex}
            px={1}
            py={0.5}
            minWidth={isMobile ? "80px" : "120px"}
            maxWidth={isMobile ? "200px" : "300px"}
            overflow="hidden"
            textOverflow="ellipsis"
            whiteSpace="nowrap"
            borderRight="1px solid #f0f0f0"
            fontSize="0.875rem"
            title={rowData[colIndex]?.toString() || ''}
          >
            {rowData[colIndex] !== undefined && rowData[colIndex] !== null
              ? rowData[colIndex].toString()
              : ''}
          </Box>
        ))}
      </Box>
    );
  }, [sheetData, isMobile]);

  // T017: Loading state
  if (loading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        height="400px"
        gap={2}
      >
        <CircularProgress size={48} />
        <Typography variant="body2" color="text.secondary">
          Loading Excel file...
        </Typography>
      </Box>
    );
  }

  // T038, T039: Error state with retry
  if (error) {
    return (
      <Box p={2}>
        <Alert
          severity="error"
          action={
            <Box display="flex" gap={1}>
              <IconButton
                size="small"
                onClick={loadExcelFile}
                title="Retry"
              >
                <RefreshIcon />
              </IconButton>
              {onDownload && (
                <IconButton
                  size="small"
                  onClick={onDownload}
                  title="Download file"
                >
                  <DownloadIcon />
                </IconButton>
              )}
            </Box>
          }
        >
          <Typography variant="body2" fontWeight="medium">
            Unable to preview this file
          </Typography>
          <Typography variant="caption" display="block" mt={0.5}>
            {error}
          </Typography>
        </Alert>
      </Box>
    );
  }

  // T040: Empty file check
  if (!workbook || workbook.SheetNames.length === 0 || sheetData.rowCount === 0) {
    return (
      <Box p={2}>
        <Alert severity="info">
          This Excel file appears to be empty or contains no data.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* T042, T043, T046: Download button in header/toolbar area (top-right) */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
        pb={1}
        borderBottom="1px solid"
        borderColor="divider"
      >
        <Typography variant="h6" component="div" fontSize={isMobile ? '1rem' : '1.125rem'}>
          {file.fileName || 'Excel Preview'}
        </Typography>
        <Tooltip title="Download original Excel file" arrow>
          <IconButton
            onClick={handleDownload}
            color="primary"
            size={isMobile ? 'medium' : 'large'}
            aria-label="Download Excel file"
          >
            <DownloadIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* T021, T055-T058: Warnings for unsupported features and truncation */}
      {(warnings.length > 0 || sheetData.isTruncated) && (
        <Box mb={2}>
          {sheetData.isTruncated && (
            <Alert
              severity="warning"
              icon={<WarningIcon />}
              sx={{ mb: 1 }}
              action={
                onDownload && (
                  <Tooltip title="Download to view all content">
                    <IconButton size="small" onClick={handleDownload} color="inherit">
                      <DownloadIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )
              }
            >
              Showing first 10,000 rows. Download the file to view all content.
            </Alert>
          )}
          {warnings.length > 0 && (
            <Alert
              severity="warning"
              icon={<WarningIcon />}
              action={
                onDownload && (
                  <Tooltip title="Download to view all features">
                    <IconButton size="small" onClick={handleDownload} color="inherit">
                      <DownloadIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )
              }
            >
              {warnings.map((warning, idx) => (
                <Typography key={idx} variant="body2" component="div">
                  • {warning}
                </Typography>
              ))}
            </Alert>
          )}
        </Box>
      )}

      {/* T022, T023, T024, T036: Sheet tabs navigation */}
      <Box mb={2}>
        <Tabs
          value={currentSheetIndex}
          onChange={(e, newValue) => setCurrentSheetIndex(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            minHeight: isMobile ? 48 : 36,
            '& .MuiTab-root': {
              minHeight: isMobile ? 48 : 36,
              minWidth: isMobile ? 100 : 80
            }
          }}
        >
          {workbook.SheetNames.map((name, idx) => (
            <Tab key={idx} label={name} />
          ))}
        </Tabs>
      </Box>

      {/* Sheet info */}
      <Box mb={1}>
        <Typography variant="caption" color="text.secondary">
          {sheetData.rowCount} rows × {sheetData.colCount} columns
        </Typography>
      </Box>

      {/* T025, T028, T029, T035: Virtualized grid with responsive sizing */}
      <Box
        border="1px solid #e0e0e0"
        borderRadius={1}
        overflow="hidden"
        sx={{
          '& .react-window': {
            overflowX: 'auto'
          }
        }}
      >
        <List
          height={isMobile ? 400 : 500}
          itemCount={sheetData.rowCount}
          itemSize={isMobile ? 35 : 40}
          width="100%"
          overscanCount={5}
        >
          {Row}
        </List>
      </Box>
    </Box>
  );
};

export default ExcelPreview;
