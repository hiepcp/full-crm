# Quickstart Guide: Activity File Preview

**Feature**: 002-activity-file-preview
**Date**: 2025-12-23
**For**: Developers integrating file preview functionality

## Purpose

This guide shows you how to quickly integrate the file preview feature into your components. Follow these steps to add preview functionality to any attachment list in the CRM system.

---

## Prerequisites

- Existing component that displays file attachments
- Attachment objects with at least `name` and `url` properties
- React 18.x and Material-UI v5.x installed

---

## Quick Integration (5 Minutes)

### Step 1: Import Components and Utilities

```javascript
import { useState } from 'react';
import FilePreviewModal from '@/presentation/components/common/FilePreviewer/FilePreviewModal';
import { shouldSkipPreview, formatFileSize } from '@/utils/fileUtils';
import { VisibilityIcon } from '@mui/icons-material';
import { IconButton, Snackbar, Alert } from '@mui/material';
```

### Step 2: Add State for Preview Modal

```javascript
function YourComponent() {
  // Existing state...
  const attachments = [...]; // Your attachment list

  // Add preview state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [skipMessage, setSkipMessage] = useState('');

  // ... rest of component
}
```

### Step 3: Add Preview Handler

```javascript
const handlePreviewClick = (file) => {
  // Check if file is too large
  if (shouldSkipPreview(file)) {
    setSkipMessage(
      `File too large to preview (${formatFileSize(file.size)}). Click download to view.`
    );
    return;
  }

  // Open preview
  setSelectedFile(file);
  setPreviewOpen(true);
};
```

### Step 4: Add Preview Button to Your UI

```javascript
// In your attachment rendering code
{attachments.map(file => (
  <Box key={file.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    {/* Your existing file display */}
    <Typography>{file.name}</Typography>

    {/* Add preview button */}
    <IconButton
      size="small"
      onClick={() => handlePreviewClick(file)}
      title="Preview file"
    >
      <VisibilityIcon fontSize="small" />
    </IconButton>
  </Box>
))}
```

### Step 5: Add FilePreviewModal Component

```javascript
return (
  <>
    {/* Your existing component UI */}

    {/* Add file preview modal */}
    <FilePreviewModal
      open={previewOpen}
      files={attachments}
      currentFile={selectedFile}
      onClose={() => setPreviewOpen(false)}
    />

    {/* Optional: Snackbar for "file too large" message */}
    <Snackbar
      open={!!skipMessage}
      autoHideDuration={6000}
      onClose={() => setSkipMessage('')}
    >
      <Alert severity="info" onClose={() => setSkipMessage('')}>
        {skipMessage}
      </Alert>
    </Snackbar>
  </>
);
```

**Done!** You now have file preview functionality.

---

## Complete Example

### Basic Implementation

```jsx
import React, { useState } from 'react';
import { Box, Typography, IconButton, Snackbar, Alert } from '@mui/material';
import { VisibilityIcon, DownloadIcon } from '@mui/icons-material';
import FilePreviewModal from '@/presentation/components/common/FilePreviewer/FilePreviewModal';
import { shouldSkipPreview, formatFileSize } from '@/utils/fileUtils';

function AttachmentList({ attachments = [] }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [skipMessage, setSkipMessage] = useState('');

  const handlePreviewClick = (file) => {
    if (shouldSkipPreview(file)) {
      setSkipMessage(
        `File too large to preview (${formatFileSize(file.size)}). Click download to view.`
      );
      return;
    }

    setSelectedFile(file);
    setPreviewOpen(true);
  };

  const handleDownload = (file) => {
    if (file.url) {
      window.open(file.url, '_blank', 'noopener,noreferrer');
    }
  };

  if (!attachments.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        No attachments
      </Typography>
    );
  }

  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {attachments.map(file => (
          <Box
            key={file.id}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              p: 1,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1
            }}
          >
            <Typography sx={{ flex: 1 }} noWrap>
              {file.name}
            </Typography>

            <Typography variant="caption" color="text.secondary">
              {formatFileSize(file.size)}
            </Typography>

            <IconButton
              size="small"
              onClick={() => handlePreviewClick(file)}
              title="Preview file"
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>

            <IconButton
              size="small"
              onClick={() => handleDownload(file)}
              title="Download file"
            >
              <DownloadIcon fontSize="small" />
            </IconButton>
          </Box>
        ))}
      </Box>

      <FilePreviewModal
        open={previewOpen}
        files={attachments}
        currentFile={selectedFile}
        onClose={() => setPreviewOpen(false)}
      />

      <Snackbar
        open={!!skipMessage}
        autoHideDuration={6000}
        onClose={() => setSkipMessage('')}
      >
        <Alert severity="info" onClose={() => setSkipMessage('')}>
          {skipMessage}
        </Alert>
      </Snackbar>
    </>
  );
}

export default AttachmentList;
```

---

## Advanced Features

### Feature 1: Callback Handlers

Track when files are previewed or downloaded:

```javascript
<FilePreviewModal
  open={previewOpen}
  files={attachments}
  currentFile={selectedFile}
  onClose={() => setPreviewOpen(false)}
  onFileChange={(file, index) => {
    console.log('User switched to:', file.name);
    // Track analytics
    trackFileView(file.id);
  }}
  onDownload={(file) => {
    console.log('User downloaded:', file.name);
    // Track download event
    trackDownload(file.id);
    window.open(file.url, '_blank');
  }}
  onError={(error, file) => {
    console.error('Preview failed:', error);
    showErrorToast(`Cannot preview ${file.name}`);
  }}
/>
```

### Feature 2: Custom Modal Size

```javascript
<FilePreviewModal
  open={previewOpen}
  files={attachments}
  currentFile={selectedFile}
  onClose={() => setPreviewOpen(false)}
  maxWidth="xl"  // Extra large modal (1920px)
  fullScreen={false}  // Never go fullscreen, even on mobile
/>
```

### Feature 3: Open Specific File by Index

```javascript
const [selectedIndex, setSelectedIndex] = useState(0);

const openPreviewAtIndex = (index) => {
  if (!shouldSkipPreview(attachments[index])) {
    setSelectedFile(attachments[index]);
    setSelectedIndex(index);
    setPreviewOpen(true);
  }
};

<FilePreviewModal
  open={previewOpen}
  files={attachments}
  currentFile={selectedFile}
  initialIndex={selectedIndex}
  onClose={() => setPreviewOpen(false)}
/>
```

---

## Integration Points

### 1. ActivityFeed Component

**File**: `crm-system-client/src/presentation/components/common/ActivityFeed/ActivityAttachmentList.jsx`

**Changes**:
```jsx
// Add preview icon button to each attachment item
<IconButton
  size="small"
  onClick={(e) => {
    e.stopPropagation(); // Prevent activity card click
    handlePreviewClick(item);
  }}
  title="Preview file"
>
  <VisibilityIcon fontSize="inherit" />
</IconButton>
```

### 2. Deal Detail Page

**File**: `crm-system-client/src/presentation/pages/deals/DealDetail.jsx`

**Add preview to deal attachments section**:
```jsx
import FilePreviewModal from '@/presentation/components/common/FilePreviewer/FilePreviewModal';

// In deal attachments section
<FilePreviewModal
  open={previewOpen}
  files={dealAttachments}
  currentFile={selectedFile}
  onClose={() => setPreviewOpen(false)}
/>
```

### 3. Customer Documents

**File**: `crm-system-client/src/presentation/pages/customers/CustomerDetail.jsx`

**Add preview to customer document uploads**:
```jsx
<FilePreviewModal
  open={documentPreviewOpen}
  files={customerDocuments}
  currentFile={selectedDocument}
  onClose={() => setDocumentPreviewOpen(false)}
/>
```

---

## Utility Functions Reference

### File Type Detection

```javascript
import { getFileCategory, isPreviewable, FileCategory } from '@/utils/fileUtils';

const category = getFileCategory(file);

if (category === FileCategory.IMAGE) {
  console.log('This is an image file');
} else if (category === FileCategory.PDF) {
  console.log('This is a PDF file');
} else if (category === FileCategory.TEXT) {
  console.log('This is a text file');
} else {
  console.log('Unsupported file type');
}

// Or simply:
if (isPreviewable(file)) {
  // Can preview this file
}
```

### Size Checking

```javascript
import { shouldSkipPreview, formatFileSize } from '@/utils/fileUtils';

if (shouldSkipPreview(file)) {
  alert(`File too large: ${formatFileSize(file.size)}`);
  return;
}
```

### File Extension

```javascript
import { getFileExtension } from '@/utils/fileUtils';

const extension = getFileExtension(file.name);
console.log('Extension:', extension); // "pdf", "png", etc.
```

---

## Common Patterns

### Pattern 1: Preview Icon in Table

```jsx
<TableRow>
  <TableCell>{file.name}</TableCell>
  <TableCell>{formatFileSize(file.size)}</TableCell>
  <TableCell>
    <IconButton size="small" onClick={() => handlePreviewClick(file)}>
      <VisibilityIcon fontSize="small" />
    </IconButton>
  </TableCell>
</TableRow>
```

### Pattern 2: Preview on Thumbnail Click

```jsx
import ThumbnailGenerator from '@/presentation/components/common/FilePreviewer/ThumbnailGenerator';

<ThumbnailGenerator
  file={file}
  size={64}
  onClick={(clickedFile) => {
    setSelectedFile(clickedFile);
    setPreviewOpen(true);
  }}
  variant="rounded"
/>
```

### Pattern 3: Preview First, Download Fallback

```jsx
const handleFileAction = (file) => {
  if (isPreviewable(file) && !shouldSkipPreview(file)) {
    // Can preview - open modal
    setSelectedFile(file);
    setPreviewOpen(true);
  } else {
    // Cannot preview - download instead
    window.open(file.url, '_blank');
  }
};
```

---

## Troubleshooting

### Issue 1: Preview Modal Not Opening

**Symptom**: Clicking preview button does nothing

**Solutions**:
- Check `selectedFile` is not null
- Check `previewOpen` is being set to `true`
- Verify `files` array is not empty
- Check console for errors

```javascript
console.log('Preview state:', { previewOpen, selectedFile, filesCount: files.length });
```

### Issue 2: PDF Not Displaying

**Symptom**: PDF modal opens but shows blank or error

**Solutions**:
- Verify PDF URL is valid (open in new tab to test)
- Check CORS headers if PDF is from external domain
- Ensure PDF is not password-protected
- Check file size (<50MB)

```javascript
// Test PDF URL
console.log('PDF URL:', file.url);
window.open(file.url, '_blank'); // Does it open?
```

### Issue 3: Images Load Slowly

**Symptom**: Image preview takes long time to display

**Solutions**:
- Images are loaded at full resolution (expected for large files)
- Add loading skeleton while image loads
- Consider image optimization on backend

```javascript
const [imageLoading, setImageLoading] = useState(true);

<FilePreviewModal
  open={previewOpen}
  files={attachments}
  currentFile={selectedFile}
  onClose={() => setPreviewOpen(false)}
  onFileChange={() => setImageLoading(true)} // Reset on file change
/>

{imageLoading && <CircularProgress />}
```

### Issue 4: File Too Large Messages Not Showing

**Symptom**: `shouldSkipPreview()` returns true but no message displays

**Solutions**:
- Ensure Snackbar component is rendered
- Check `skipMessage` state is being set
- Verify file has `size` property

```javascript
console.log('File size check:', {
  fileName: file.name,
  size: file.size,
  shouldSkip: shouldSkipPreview(file)
});
```

---

## Testing Your Integration

### Manual Test Checklist

- [ ] Preview icon appears next to attachments
- [ ] Clicking preview icon opens modal
- [ ] Modal displays correct file
- [ ] Images zoom in/out correctly
- [ ] PDFs scroll and render properly
- [ ] Text files display with correct formatting
- [ ] "File too large" message shows for large files (>50MB)
- [ ] Download button works
- [ ] Navigation arrows work (if multiple files)
- [ ] ESC key closes modal
- [ ] Arrow keys navigate between files
- [ ] Modal works on mobile (fullscreen)
- [ ] Error states display correctly (invalid URL, unsupported type)

### Test Files

Create test files in your local environment:

```javascript
const testFiles = [
  {
    id: 'test-img-1',
    name: 'test-image.png',
    url: 'https://via.placeholder.com/1920x1080.png',
    size: 150000,
    mimeType: 'image/png'
  },
  {
    id: 'test-pdf-1',
    name: 'test-pdf.pdf',
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    size: 13264,
    mimeType: 'application/pdf'
  },
  {
    id: 'test-txt-1',
    name: 'test-text.txt',
    url: 'https://www.gutenberg.org/cache/epub/1/pg1.txt',
    size: 5000,
    mimeType: 'text/plain'
  },
  {
    id: 'test-large-1',
    name: 'large-file.mp4',
    url: 'https://example.com/large-video.mp4',
    size: 100 * 1024 * 1024, // 100 MB
    mimeType: 'video/mp4'
  }
];
```

---

## Performance Tips

### Tip 1: Lazy Load Modal

```javascript
import { lazy, Suspense } from 'react';

const FilePreviewModal = lazy(() =>
  import('@/presentation/components/common/FilePreviewer/FilePreviewModal')
);

// In render:
<Suspense fallback={<CircularProgress />}>
  {previewOpen && (
    <FilePreviewModal
      open={previewOpen}
      files={attachments}
      currentFile={selectedFile}
      onClose={() => setPreviewOpen(false)}
    />
  )}
</Suspense>
```

### Tip 2: Memoize File List

```javascript
import { useMemo } from 'react';

const previewableFiles = useMemo(() =>
  attachments.filter(file => isPreviewable(file) && !shouldSkipPreview(file)),
  [attachments]
);
```

### Tip 3: Debounce Zoom Updates

```javascript
import { debounce } from 'lodash';

const debouncedZoomChange = useMemo(
  () => debounce((newZoom) => {
    trackAnalytics('image_zoom', { level: newZoom });
  }, 500),
  []
);
```

---

## Next Steps

1. ✅ Integrate preview into ActivityAttachmentList
2. ✅ Add preview to deal attachments
3. ✅ Add preview to customer documents
4. ⏭️ Consider adding thumbnail previews (P3)
5. ⏭️ Add analytics tracking for preview usage
6. ⏭️ Monitor performance and optimize if needed

---

## Support

If you encounter issues or have questions:

1. Check [data-model.md](./data-model.md) for component prop details
2. Review [contracts/FilePreviewModal.md](./contracts/FilePreviewModal.md) for full API reference
3. See [research.md](./research.md) for technical decisions and rationale

---

**Version**: 1.0.0
**Last Updated**: 2025-12-23
**Ready for**: Integration and testing
