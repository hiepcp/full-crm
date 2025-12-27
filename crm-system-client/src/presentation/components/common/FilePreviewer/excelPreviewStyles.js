/**
 * Excel Preview Component Styles
 * Material-UI sx prop compatible styles for ExcelPreview component
 */

export const excelPreviewStyles = {
  // Container
  container: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column'
  },

  // Loading state
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: 400,
    gap: 2
  },

  // Warnings
  warningBox: {
    mb: 2
  },

  truncationAlert: {
    mb: 1
  },

  // Sheet tabs
  tabsContainer: {
    mb: 2,
    borderBottom: 1,
    borderColor: 'divider'
  },

  tabs: (isMobile) => ({
    minHeight: isMobile ? 48 : 36,
    '& .MuiTab-root': {
      minHeight: isMobile ? 48 : 36,
      minWidth: isMobile ? 100 : 80,
      fontSize: isMobile ? '0.875rem' : '0.8125rem'
    }
  }),

  // Sheet info
  sheetInfo: {
    mb: 1,
    color: 'text.secondary',
    fontSize: '0.75rem'
  },

  // Grid container
  gridContainer: {
    border: 1,
    borderColor: 'divider',
    borderRadius: 1,
    overflow: 'hidden',
    bgcolor: 'background.paper'
  },

  // Row styles
  row: {
    display: 'flex',
    borderBottom: '1px solid',
    borderColor: 'divider',
    '&:hover': {
      bgcolor: 'action.hover'
    }
  },

  rowNumberCell: {
    px: 1,
    py: 0.5,
    minWidth: '50px',
    maxWidth: '50px',
    borderRight: '1px solid',
    borderColor: 'divider',
    bgcolor: 'grey.50',
    fontWeight: 'bold',
    fontSize: '0.875rem',
    color: 'text.secondary',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },

  dataCell: (isMobile) => ({
    px: 1,
    py: 0.5,
    minWidth: isMobile ? '80px' : '120px',
    maxWidth: isMobile ? '200px' : '300px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    borderRight: '1px solid',
    borderColor: 'grey.200',
    fontSize: '0.875rem'
  }),

  // Header row (first row styling)
  headerRow: {
    bgcolor: 'primary.50',
    fontWeight: 'bold'
  },

  // Error state
  errorContainer: {
    p: 2
  },

  errorAlert: {
    '& .MuiAlert-message': {
      width: '100%'
    }
  },

  // Empty state
  emptyContainer: {
    p: 2
  },

  // Download button
  downloadButton: {
    ml: 'auto'
  }
};

export default excelPreviewStyles;
