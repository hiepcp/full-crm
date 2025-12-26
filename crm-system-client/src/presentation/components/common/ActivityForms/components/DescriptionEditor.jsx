import React from 'react';
import { Box, Typography, Stack } from '@mui/material';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

/**
 * Component for rich text description editor
 */
const DescriptionEditor = ({ description, setDescription, disabled = false }) => {
  return (
    <Stack spacing={1}>
      <Typography variant="subtitle2" sx={{ fontWeight: 500, color: 'text.secondary' }}>
        Description
      </Typography>
      <Box sx={{
        border: '1px solid',
        borderColor: disabled ? 'action.disabled' : 'divider',
        borderRadius: 1,
        minHeight: '150px',
        opacity: disabled ? 0.5 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
        '& .rdw-editor-wrapper': {
          minHeight: '140px'
        },
        '& .rdw-editor-toolbar': {
          border: 0,
          borderBottom: '1px solid',
          borderColor: 'divider',
          mb: 0,
        },
        '& .rdw-editor-main': {
          p: '0 12px'
        }
      }}>
        <CKEditor
          editor={ClassicEditor}
          data={description}
          disabled={disabled}
          onChange={(event, editor) => {
            const data = editor.getData();
            setDescription(data);
          }}
          config={{
            toolbar: [
              'heading', '|',
              'bold', 'italic', 'link', 'bulletedList', 'numberedList', 'blockQuote', '|',
              'insertTable', 'tableColumn', 'tableRow', 'mergeTableCells', '|',
              'undo', 'redo'
            ],
            table: {
              contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells']
            }
          }}
        />
      </Box>
    </Stack>
  );
};

export default DescriptionEditor;

