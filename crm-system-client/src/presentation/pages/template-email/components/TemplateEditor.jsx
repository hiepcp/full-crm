import React from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { Box, Paper } from '@mui/material';

// Custom Upload Adapter for image upload
class MyUploadAdapter {
  constructor(loader) {
    this.loader = loader;
  }

  upload() {
    return this.loader.file.then(
      (file) =>
        new Promise((resolve, reject) => {
          // Convert image to base64 and resize if needed
          const reader = new FileReader();
          reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              
              // Define medium size threshold
              const maxWidth = 600;
              let width = img.width;
              let height = img.height;
              
              // Only resize if width > medium (600px)
              if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
              }
              
              // Set canvas dimensions
              canvas.width = width;
              canvas.height = height;
              
              // Draw resized image
              ctx.drawImage(img, 0, 0, width, height);
              
              // Convert to base64
              const resizedBase64 = canvas.toDataURL(file.type || 'image/jpeg', 0.9);
              
              resolve({
                default: resizedBase64
              });
            };
            img.onerror = (error) => {
              reject(error);
            };
            img.src = e.target.result;
          };
          reader.onerror = (error) => {
            reject(error);
          };
          reader.readAsDataURL(file);
        })
    );
  }
}

// Plugin to integrate custom adapter
function MyCustomUploadAdapterPlugin(editor) {
  editor.plugins.get('FileRepository').createUploadAdapter = (loader) => {
    return new MyUploadAdapter(loader);
  };
}

const TemplateEditor = ({ value, onChange, placeholder = 'Enter email body...' }) => {
  // Process content to auto-resize large images
  const processContent = (content) => {
    if (!content) return content;

    // Create a temporary div to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;

    // Find all images
    const images = tempDiv.querySelectorAll('img');
    images.forEach((img) => {
      // Check if image has inline style with width or if it's a base64 image
      const currentWidth = img.style.width;
      const hasWidth = currentWidth && currentWidth !== '';
      
      // If image doesn't have width set and it's likely a large image (base64), set to medium size
      if (!hasWidth && img.src && img.src.startsWith('data:image')) {
        // Set max-width to medium size (600px) for large images
        img.style.maxWidth = '600px';
        img.style.width = 'auto';
        img.style.height = 'auto';
      } else if (hasWidth) {
        // If already has width, ensure it doesn't exceed medium size
        const widthValue = parseInt(currentWidth);
        if (!isNaN(widthValue) && widthValue > 600) {
          img.style.maxWidth = '600px';
          img.style.width = 'auto';
          img.style.height = 'auto';
        }
      }
    });

    return tempDiv.innerHTML;
  };

  const editorConfiguration = {
    toolbar: {
      items: [
        'heading',
        '|',
        'bold',
        'italic',
        'underline',
        'strikethrough',
        '|',
        'link',
        'bulletedList',
        'numberedList',
        '|',
        'fontSize',
        'fontFamily',
        'fontColor',
        'fontBackgroundColor',
        '|',
        'alignment',
        '|',
        'imageUpload', // This will now work with our custom adapter
        'blockQuote',
        'insertTable',
        '|',
        'undo',
        'redo'
      ]
    },
    image: {
      toolbar: [
        'imageTextAlternative',
        '|',
        'imageStyle:inline',
        'imageStyle:block',
        'imageStyle:side',
        '|',
        'toggleImageCaption',
        'imageResize'
      ],
      resizeOptions: [
        {
          name: 'imageResize:original',
          label: 'Original',
          value: null
        },
        {
          name: 'imageResize:50',
          label: '50%',
          value: '50'
        },
        {
          name: 'imageResize:75',
          label: '75%',
          value: '75'
        }
      ]
    },
    table: {
      contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells', 'tableCellProperties', 'tableProperties']
    },
    placeholder: placeholder,
    extraPlugins: [MyCustomUploadAdapterPlugin] // Add custom upload adapter
  };

  // Store editor instance reference
  const editorRef = React.useRef(null);
  const isInitialMount = React.useRef(true);

  // Only set initial value, don't update on value changes to preserve cursor position
  const [initialValue] = React.useState(processContent(value) || '');

  React.useEffect(() => {
    // Only update editor content if value changes externally (e.g., template switch)
    // and not from user typing (which would cause cursor to jump)
    if (editorRef.current && !isInitialMount.current) {
      const currentData = editorRef.current.getData();
      const processedNewValue = processContent(value);
      
      // Only update if the content is actually different and not just a formatting change
      if (currentData !== processedNewValue && value !== currentData) {
        editorRef.current.setData(processedNewValue || '');
      }
    }
    isInitialMount.current = false;
  }, [value]);

  return (
    <Paper variant="outlined" sx={{ p: 0, overflow: 'hidden' }}>
      <Box
        sx={{
          '& .ck-editor__editable': {
            minHeight: '300px',
            maxHeight: '500px'
          },
          '& .ck-content': {
            fontFamily: 'inherit'
          },
          '& .ck-content img': {
            maxWidth: '600px',
            height: 'auto'
          }
        }}
      >
        <CKEditor
          editor={ClassicEditor}
          config={editorConfiguration}
          data={initialValue}
          onChange={(event, editor) => {
            const data = editor.getData();
            onChange(data);
          }}
          onReady={(editor) => {
            editorRef.current = editor;
            console.log('CKEditor is ready with image upload support');
          }}
        />
      </Box>
    </Paper>
  );
};

export default TemplateEditor;
