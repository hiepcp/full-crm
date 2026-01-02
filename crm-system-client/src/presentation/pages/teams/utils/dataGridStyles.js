/**
 * Common DataGrid styles for consistent UI across the app
 */
export const dataGridStyles = {
  border: 'none',
  '& .MuiDataGrid-columnHeaders': {
    bgcolor: 'grey.50',
    borderBottom: '2px solid',
    borderColor: 'divider',
    fontWeight: 700,
    fontSize: '0.875rem'
  },
  '& .MuiDataGrid-cell': {
    fontSize: '0.875rem',
    py: 1.5,
    display: 'flex',
    alignItems: 'center'
  },
  '& .MuiDataGrid-row': {
    cursor: 'pointer',
    transition: 'all 0.2s',
    '&:hover': {
      bgcolor: 'action.hover',
      transform: 'scale(1.001)'
    }
  },
  '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
    outline: 'none'
  },
  '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within': {
    outline: 'none'
  }
};

/**
 * DataGrid styles without hover effects (for non-clickable grids)
 */
export const dataGridStylesNoHover = {
  ...dataGridStyles,
  '& .MuiDataGrid-row': {
    transition: 'all 0.2s'
  }
};
