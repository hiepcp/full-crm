# Component Contract: FilePreviewModal

**Component**: FilePreviewModal
**Type**: Container/Manager Component
**Path**: `crm-system-client/src/presentation/components/common/FilePreviewer/FilePreviewModal.jsx`

## Purpose

Main container component that manages file preview state, handles file type routing, and provides modal shell with navigation controls. Delegates actual rendering to specialized components (ImagePreview, DocumentPreview).

---

## Props API

### Required Props

```typescript
open: boolean
```
- **Description**: Controls modal visibility
- **Valid Values**: `true` (modal visible) | `false` (modal hidden)
- **Example**: `open={previewModalOpen}`

```typescript
onClose: () => void
```
- **Description**: Callback invoked when modal should close (user clicks close, presses ESC, or clicks backdrop)
- **Example**: `onClose={() => setPreviewModalOpen(false)}`

```typescript
files: Attachment[]
```
- **Description**: Array of all attachment objects available for preview. Used for multi-file navigation.
- **Valid Values**: Array of normalized attachment objects (see data-model.md)
- **Minimum**: Empty array `[]` (modal shows "No files to preview" message)
- **Example**:
  ```javascript
  files={[
    { id: '1', name: 'report.pdf', url: 'https://...', size: 2400000, mimeType: 'application/pdf' },
    { id: '2', name: 'chart.png', url: 'https://...', size: 150000, mimeType: 'image/png' }
  ]}
  ```

```typescript
currentFile: Attachment | null
```
- **Description**: The file currently being previewed. Modal opens to this file.
- **Valid Values**: Attachment object or `null`
- **Behavior**: If `null`, modal shows error state
- **Example**: `currentFile={selectedAttachment}`

---

### Optional Props

```typescript
initialIndex?: number
```
- **Description**: Starting index in `files` array when modal opens
- **Default**: `0`
- **Valid Values**: `0` to `files.length - 1`
- **Example**: `initialIndex={2}` (opens to 3rd file)

```typescript
maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false
```
- **Description**: Maximum width of modal dialog (MUI Dialog prop)
- **Default**: `'lg'` (1280px)
- **Valid Values**: MUI breakpoint strings or `false` for no max width
- **Example**: `maxWidth="xl"` (1920px)

```typescript
fullScreen?: boolean
```
- **Description**: Force fullscreen mode (overrides responsive behavior)
- **Default**: `true` on mobile (<600px), `false` on desktop
- **Example**: `fullScreen={true}`

```typescript
onFileChange?: (file: Attachment, index: number) => void
```
- **Description**: Callback when user navigates to a different file
- **Arguments**:
  - `file`: The newly selected attachment
  - `index`: Index in `files` array
- **Example**:
  ```javascript
  onFileChange={(file, idx) => {
    console.log('Now viewing:', file.name, 'at index', idx);
  }}
  ```

```typescript
onDownload?: (file: Attachment) => void
```
- **Description**: Callback when user clicks download button
- **Default Behavior**: If not provided, download button opens `file.url` in new tab
- **Example**:
  ```javascript
  onDownload={(file) => {
    trackAnalytics('file_download', { fileName: file.name });
    window.open(file.url, '_blank');
  }}
  ```

```typescript
onError?: (error: Error, file: Attachment) => void
```
- **Description**: Callback when file preview fails to load
- **Example**:
  ```javascript
  onError={(error, file) => {
    console.error('Preview failed for', file.name, ':', error.message);
    showErrorToast(`Cannot preview ${file.name}`);
  }}
  ```

---

## State Management

### Internal State

```typescript
const [currentIndex, setCurrentIndex] = useState<number>(initialIndex || 0);
const [loading, setLoading] = useState<boolean>(true);
const [error, setError] = useState<string | null>(null);
const [zoomLevel, setZoomLevel] = useState<number>(1);
const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
```

### State Updates

- **On file navigation**: Reset `zoomLevel` to 1, `position` to `{x: 0, y: 0}`, `loading` to true, `error` to null
- **On file load success**: Set `loading` to false
- **On file load error**: Set `loading` to false, `error` to error message
- **On zoom/pan change**: Update `zoomLevel` or `position` (images only)

---

## Behavior Specifications

### File Type Routing

```javascript
const fileCategory = getFileCategory(currentFile);

switch (fileCategory) {
  case FileCategory.IMAGE:
    return <ImagePreview {...imageProps} />;
  case FileCategory.PDF:
  case FileCategory.TEXT:
    return <DocumentPreview {...docProps} />;
  case FileCategory.UNSUPPORTED:
    return <UnsupportedFileMessage file={currentFile} onDownload={handleDownload} />;
}
```

### Navigation Logic

**Next File**:
```javascript
const handleNext = () => {
  if (currentIndex < files.length - 1) {
    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);
    resetPreviewState();
    onFileChange?.(files[nextIndex], nextIndex);
  }
};
```

**Previous File**:
```javascript
const handlePrevious = () => {
  if (currentIndex > 0) {
    const prevIndex = currentIndex - 1;
    setCurrentIndex(prevIndex);
    resetPreviewState();
    onFileChange?.(files[prevIndex], prevIndex);
  }
};
```

### Keyboard Shortcuts

| Key | Action | Condition |
|-----|--------|-----------|
| `Escape` | Close modal | Always |
| `ArrowRight` | Next file | `currentIndex < files.length - 1` |
| `ArrowLeft` | Previous file | `currentIndex > 0` |
| `+` or `=` | Zoom in | Image preview only, `zoomLevel < 4` |
| `-` | Zoom out | Image preview only, `zoomLevel > 1` |
| `0` | Reset zoom | Image preview only |

```javascript
useEffect(() => {
  const handleKeyDown = (e) => {
    if (!open) return;

    switch (e.key) {
      case 'Escape':
        onClose();
        break;
      case 'ArrowRight':
        handleNext();
        break;
      case 'ArrowLeft':
        handlePrevious();
        break;
      // Image-specific shortcuts handled by ImagePreview component
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [open, currentIndex]);
```

---

## UI Layout

```
┌─────────────────────────────────────────────────────┐
│ [File name]                              [X] Close  │  ← Header
├─────────────────────────────────────────────────────┤
│                                                     │
│  [<]                                         [>]    │  ← Nav arrows (if multiple files)
│                                                     │
│               [Preview Content]                     │  ← ImagePreview or DocumentPreview
│                                                     │
│                                                     │
├─────────────────────────────────────────────────────┤
│  [Download] [1 of 3]  [Zoom controls if image]     │  ← Footer
└─────────────────────────────────────────────────────┘
```

---

## Error States

### No Files Provided

**Condition**: `files.length === 0`

**Display**:
```jsx
<Box sx={{ textAlign: 'center', py: 8 }}>
  <ErrorOutlineIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
  <Typography variant="h6">No files to preview</Typography>
</Box>
```

### Current File is Null

**Condition**: `currentFile === null`

**Display**:
```jsx
<Alert severity="error">
  Unable to load file. Please try again.
  <Button onClick={onClose}>Close</Button>
</Alert>
```

### File URL Missing

**Condition**: `!currentFile.url`

**Display**:
```jsx
<Alert severity="warning">
  File URL not available. Cannot preview.
  {currentFile.name && <Button onClick={() => window.open(currentFile.name, '_blank')}>Download</Button>}
</Alert>
```

### Unsupported File Type

**Condition**: `getFileCategory(currentFile) === FileCategory.UNSUPPORTED`

**Display**:
```jsx
<Box sx={{ textAlign: 'center', py: 4 }}>
  <InsertDriveFileIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
  <Typography variant="h6">Preview not available</Typography>
  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
    This file type cannot be previewed in the browser.
  </Typography>
  <Button variant="contained" onClick={handleDownload} startIcon={<DownloadIcon />}>
    Download File
  </Button>
</Box>
```

### File Too Large

**Condition**: `shouldSkipPreview(currentFile)` (>50MB)

**Display**:
```jsx
<Alert severity="info">
  This file is too large to preview ({formatFileSize(currentFile.size)}).
  <Button onClick={handleDownload}>Download to view</Button>
</Alert>
```

---

## Loading States

### Initial Load

```jsx
{loading && (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
    <CircularProgress size={60} />
    <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
      Loading {currentFile.name}...
    </Typography>
  </Box>
)}
```

### File Change Loading

```jsx
{loading && (
  <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0 }} />
)}
```

---

## Accessibility

### ARIA Attributes

```jsx
<Dialog
  open={open}
  onClose={onClose}
  aria-labelledby="file-preview-title"
  aria-describedby="file-preview-description"
  role="dialog"
  aria-modal="true"
>
  <DialogTitle id="file-preview-title">
    {currentFile.name}
    <Typography variant="caption" id="file-preview-description" sx={{ ml: 1 }}>
      {getFileCategory(currentFile)} • {formatFileSize(currentFile.size)}
    </Typography>
  </DialogTitle>

  {/* Content */}
</Dialog>
```

### Focus Management

- **On open**: Focus close button
- **On close**: Return focus to trigger element (handled by MUI Dialog)
- **Tab trap**: Focus stays within modal while open (MUI Dialog built-in)

### Screen Reader Announcements

```jsx
<Box role="status" aria-live="polite" sx={{ srOnly: true }}>
  {loading && `Loading ${currentFile.name}`}
  {error && `Error: ${error}`}
  {!loading && !error && `Viewing ${currentFile.name}, file ${currentIndex + 1} of ${files.length}`}
</Box>
```

---

## Example Usage

### Basic Usage

```jsx
import FilePreviewModal from '@/presentation/components/common/FilePreviewer/FilePreviewModal';

function ActivityCard({ activity }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const attachments = normalizeActivityAttachments(activity);

  const handlePreviewClick = (file) => {
    if (shouldSkipPreview(file)) {
      alert(`File too large: ${formatFileSize(file.size)}`);
      return;
    }
    setSelectedFile(file);
    setPreviewOpen(true);
  };

  return (
    <>
      {/* Attachment list with preview buttons */}
      {attachments.map(file => (
        <Button key={file.id} onClick={() => handlePreviewClick(file)}>
          <VisibilityIcon /> Preview
        </Button>
      ))}

      <FilePreviewModal
        open={previewOpen}
        files={attachments}
        currentFile={selectedFile}
        onClose={() => setPreviewOpen(false)}
      />
    </>
  );
}
```

### Advanced Usage with Callbacks

```jsx
<FilePreviewModal
  open={previewOpen}
  files={attachments}
  currentFile={selectedFile}
  initialIndex={selectedIndex}
  maxWidth="xl"
  onClose={handleClosePreview}
  onFileChange={(file, idx) => {
    console.log('Switched to:', file.name);
    trackFileView(file.id);
  }}
  onDownload={(file) => {
    trackDownload(file.id);
    window.open(file.url, '_blank');
  }}
  onError={(error, file) => {
    console.error('Preview error:', error);
    showErrorSnackbar(`Cannot preview ${file.name}: ${error.message}`);
  }}
/>
```

---

## Testing Considerations

### Unit Tests

- Renders correctly with valid props
- Shows error state when `currentFile` is null
- Shows error state when `files` is empty
- Navigation buttons disabled when at first/last file
- Keyboard shortcuts trigger correct actions
- Calls `onClose` when close button clicked
- Calls `onFileChange` when navigating
- Resets zoom/position state when file changes

### Integration Tests

- Opens to correct file when `initialIndex` provided
- Switches between image and document previews correctly
- Downloads file when URL is clicked
- Shows loading state while file loads
- Shows error state when file fails to load

### Manual Testing Checklist

- [ ] Modal opens and closes smoothly
- [ ] Navigation arrows work (next/previous)
- [ ] Keyboard shortcuts work (ESC, arrows, zoom)
- [ ] Mobile: Fullscreen mode on small screens
- [ ] Mobile: Swipe gesture to navigate (if implemented)
- [ ] Downloads work from download button
- [ ] Error states display correctly (missing URL, unsupported type, too large)
- [ ] Loading spinners appear during file load
- [ ] Screen reader announces file changes

---

## Performance

### Lazy Loading

```javascript
const ImagePreview = lazy(() => import('./ImagePreview'));
const DocumentPreview = lazy(() => import('./DocumentPreview'));
```

### Code Splitting

- Modal component: ~5KB
- ImagePreview component: ~3KB (loaded on demand)
- DocumentPreview component: ~2KB (loaded on demand)
- Total initial bundle impact: ~5KB

### Optimization Tips

- Use `React.memo()` for preview components to prevent unnecessary re-renders
- Debounce zoom/pan state updates (100ms) for smooth performance
- Use CSS transforms for zoom/pan (GPU-accelerated)
- Lazy load modal only when first preview is opened

---

## Dependencies

### Required

- `react` (^18.0.0)
- `@mui/material` (^5.0.0)
- `@mui/icons-material` (^5.0.0)

### Optional

None (all features implemented with native browser APIs and existing dependencies)

---

## Migration Guide

### From react-image-lightbox (if used previously)

```diff
- <Lightbox
-   mainSrc={images[photoIndex]}
-   nextSrc={images[(photoIndex + 1) % images.length]}
-   prevSrc={images[(photoIndex + images.length - 1) % images.length]}
-   onCloseRequest={() => setIsOpen(false)}
-   onMovePrevRequest={() => setPhotoIndex((photoIndex + images.length - 1) % images.length)}
-   onMoveNextRequest={() => setPhotoIndex((photoIndex + 1) % images.length)}
- />

+ <FilePreviewModal
+   open={isOpen}
+   files={images}
+   currentFile={images[photoIndex]}
+   initialIndex={photoIndex}
+   onClose={() => setIsOpen(false)}
+   onFileChange={(file, idx) => setPhotoIndex(idx)}
+ />
```

---

**Version**: 1.0.0
**Last Updated**: 2025-12-23
**Status**: Ready for implementation
