# Data Model: Activity File Preview

**Date**: 2025-12-23
**Feature**: 002-activity-file-preview
**Purpose**: Define component interfaces, props, state management, and data flows

## Overview

This document defines the data structures and component interfaces for the file preview feature. Since this is a frontend-only feature, the "data model" focuses on React component props, state management, and the shape of data passed between components.

---

## 1. Attachment Entity (Existing)

### Source

Attachment objects come from the `normalizeActivityAttachments()` function in [ActivityFeed.jsx:72-106](../../crm-system-client/src/presentation/components/common/ActivityFeed/ActivityFeed.jsx#L72-L106).

### Shape

```typescript
interface Attachment {
  // Identifiers
  id: string | number;              // Unique identifier (attachmentId, sharepointId, or generated)

  // File metadata
  name: string;                      // Display name (from fileName, name, title, originalName, displayName)
  url: string | null;                // Download/preview URL (fileUrl, url, webUrl, downloadUrl, path, filePath)
  size?: number;                     // File size in bytes (fileSize, size, sizeBytes, length, contentLength)
  mimeType?: string;                 // MIME type (mimeType, contentType, fileType)
  source?: string;                   // Source system ('sharepoint', 'local', undefined)
}
```

### Example

```javascript
{
  id: "att-12345",
  name: "customer-proposal.pdf",
  url: "https://sharepoint.example.com/sites/crm/documents/customer-proposal.pdf",
  size: 2457600,  // 2.4 MB
  mimeType: "application/pdf",
  source: "sharepoint"
}
```

---

## 2. File Category Enum

### Purpose

Categorize files to determine which preview component to use.

### Definition

```typescript
enum FileCategory {
  IMAGE = 'image',
  PDF = 'pdf',
  TEXT = 'text',
  UNSUPPORTED = 'unsupported'
}
```

### Mapping Rules

| Category | MIME Types | Extensions |
|----------|------------|-----------|
| IMAGE | `image/png`, `image/jpg`, `image/jpeg`, `image/gif`, `image/svg+xml`, `image/webp`, `image/bmp` | `png`, `jpg`, `jpeg`, `gif`, `svg`, `webp`, `bmp` |
| PDF | `application/pdf` | `pdf` |
| TEXT | `text/plain`, `text/csv` | `txt`, `csv` |
| UNSUPPORTED | All others | All others |

---

## 3. Component Interfaces

### 3.1 FilePreviewModal

**Purpose**: Main container component that manages preview state and delegates rendering to specialized preview components.

**Props**:

```typescript
interface FilePreviewModalProps {
  // Visibility
  open: boolean;                     // Whether modal is visible
  onClose: () => void;               // Callback when modal should close

  // File data
  files: Attachment[];               // All attachments in current context (for navigation)
  currentFile: Attachment | null;    // Currently previewed file
  initialIndex?: number;             // Starting index in files array (default: 0)

  // Optional customization
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;  // MUI Dialog maxWidth (default: 'lg')
  fullScreen?: boolean;              // Force fullscreen on mobile (default: true on mobile)
}
```

**State**:

```typescript
interface FilePreviewModalState {
  currentIndex: number;              // Index of current file in files array
  loading: boolean;                  // Whether file is loading
  error: string | null;              // Error message if load failed
  zoomLevel: number;                 // Current zoom (1 = 100%, 2 = 200%, etc.) - for images only
  position: { x: number; y: number }; // Pan position in pixels - for images only
}
```

**Events Emitted**:

```typescript
onClose: () => void;                 // User closed modal (ESC, click outside, close button)
onFileChange?: (file: Attachment, index: number) => void;  // User navigated to different file
onDownload?: (file: Attachment) => void;  // User clicked download button
onError?: (error: Error, file: Attachment) => void;  // File failed to load
```

**Example Usage**:

```jsx
<FilePreviewModal
  open={previewOpen}
  files={attachments}
  currentFile={selectedFile}
  onClose={() => setPreviewOpen(false)}
  onError={(error, file) => console.error('Preview failed:', error, file)}
/>
```

---

### 3.2 ImagePreview

**Purpose**: Display image with zoom, pan, and navigation controls.

**Props**:

```typescript
interface ImagePreviewProps {
  // File data
  file: Attachment;                  // Image file to display

  // State from parent
  zoomLevel: number;                 // Current zoom level (1-4)
  position: { x: number; y: number }; // Pan position

  // Callbacks
  onZoomChange: (newZoom: number) => void;        // User changed zoom
  onPositionChange: (newPos: { x: number; y: number }) => void;  // User panned image
  onLoad: () => void;                // Image loaded successfully
  onError: (error: Error) => void;   // Image failed to load

  // Optional
  maxZoom?: number;                  // Maximum zoom level (default: 4)
  minZoom?: number;                  // Minimum zoom level (default: 1)
}
```

**State** (internal):

```typescript
interface ImagePreviewState {
  dragging: boolean;                 // Whether user is currently dragging
  dragStart: { x: number; y: number } | null;  // Starting position of drag
  imageLoaded: boolean;              // Whether <img> has loaded
  naturalSize: { width: number; height: number } | null;  // Original image dimensions
}
```

**Example Usage**:

```jsx
<ImagePreview
  file={currentFile}
  zoomLevel={zoomLevel}
  position={position}
  onZoomChange={setZoomLevel}
  onPositionChange={setPosition}
  onLoad={() => setLoading(false)}
  onError={(err) => setError(err.message)}
/>
```

---

### 3.3 DocumentPreview

**Purpose**: Display PDF, TXT, or CSV files.

**Props**:

```typescript
interface DocumentPreviewProps {
  // File data
  file: Attachment;                  // Document file to display
  fileCategory: FileCategory;        // PDF, TEXT (determines rendering method)

  // Callbacks
  onLoad: () => void;                // Document loaded successfully
  onError: (error: Error) => void;   // Document failed to load

  // Optional PDF settings
  showToolbar?: boolean;             // Show browser PDF toolbar (default: true)

  // Optional text settings
  wrapText?: boolean;                // Wrap long lines in text files (default: true)
  fontSize?: number;                 // Font size for text files (default: 14)
}
```

**State** (internal):

```typescript
interface DocumentPreviewState {
  contentLoaded: boolean;            // Whether iframe/content has loaded
  textContent?: string;              // For TEXT files, fetched content
  fetchError?: string;               // Error message from fetch
}
```

**Example Usage**:

```jsx
<DocumentPreview
  file={currentFile}
  fileCategory={FileCategory.PDF}
  onLoad={() => setLoading(false)}
  onError={(err) => setError(err.message)}
  showToolbar={true}
/>
```

---

### 3.4 ThumbnailGenerator

**Purpose**: Display thumbnail previews in activity feed cards.

**Props**:

```typescript
interface ThumbnailGeneratorProps {
  // File data
  file: Attachment;                  // File to generate thumbnail for

  // Display options
  size?: number;                     // Thumbnail size in pixels (default: 64)
  onClick?: (file: Attachment) => void;  // Callback when thumbnail clicked

  // Optional
  showFileName?: boolean;            // Show filename below thumbnail (default: false)
  variant?: 'square' | 'rounded' | 'circular';  // Border style (default: 'rounded')
}
```

**State** (internal):

```typescript
interface ThumbnailGeneratorState {
  imageLoaded: boolean;              // Whether thumbnail image loaded
  showFallback: boolean;             // Whether to show icon instead of image
}
```

**Example Usage**:

```jsx
<ThumbnailGenerator
  file={attachment}
  size={64}
  onClick={(file) => openPreview(file)}
  variant="rounded"
/>
```

---

## 4. Utility Functions (utils/fileUtils.js)

### 4.1 getFileCategory

```typescript
function getFileCategory(file: Attachment): FileCategory
```

**Description**: Determines file category based on MIME type and extension.

**Logic**:
1. Check `mimeType` field first (most reliable)
2. If no MIME type, fall back to file extension from `name`
3. Return `FileCategory` enum value

**Example**:
```javascript
getFileCategory({ name: 'report.pdf', mimeType: 'application/pdf' })
// Returns: FileCategory.PDF

getFileCategory({ name: 'screenshot.png' })
// Returns: FileCategory.IMAGE (MIME fallback to extension)
```

---

### 4.2 isPreviewable

```typescript
function isPreviewable(file: Attachment): boolean
```

**Description**: Returns `true` if file can be previewed (not UNSUPPORTED).

**Example**:
```javascript
isPreviewable({ name: 'doc.pdf' })  // true
isPreviewable({ name: 'video.mp4' }) // false
```

---

### 4.3 shouldSkipPreview

```typescript
function shouldSkipPreview(file: Attachment): boolean
```

**Description**: Returns `true` if file is too large for preview (>50MB).

**Example**:
```javascript
shouldSkipPreview({ size: 100 * 1024 * 1024 })  // true (100 MB)
shouldSkipPreview({ size: 2 * 1024 * 1024 })    // false (2 MB)
```

---

### 4.4 formatFileSize

```typescript
function formatFileSize(bytes: number | undefined): string
```

**Description**: Formats byte count as human-readable string.

**Example**:
```javascript
formatFileSize(1500)          // "1.5 KB"
formatFileSize(2500000)       // "2.4 MB"
formatFileSize(undefined)     // "Unknown size"
```

---

### 4.5 getFileExtension

```typescript
function getFileExtension(filename: string): string
```

**Description**: Extracts lowercase extension from filename.

**Example**:
```javascript
getFileExtension('report.PDF')        // "pdf"
getFileExtension('data.backup.csv')   // "csv"
getFileExtension('noextension')       // ""
```

---

## 5. State Management

### Approach

**Local component state** (React `useState` hooks) - No Redux or global state needed.

**Rationale**:
- Preview state is transient and UI-focused
- No need to persist preview state across navigation
- State is scoped to FilePreviewModal component and children
- Keeps implementation simple and reduces boilerplate

### State Flow

```
ActivityAttachmentList (owner)
  ├─ previewOpen: boolean
  ├─ selectedFile: Attachment | null
  └─ allFiles: Attachment[]
      ↓
  FilePreviewModal (manager)
      ├─ currentIndex: number
      ├─ loading: boolean
      ├─ error: string | null
      ├─ zoomLevel: number
      └─ position: { x, y }
          ↓
      ImagePreview | DocumentPreview (renderer)
          └─ Internal rendering state only
```

---

## 6. Event Flow

### Opening Preview

```
User clicks preview icon on attachment
  → ActivityAttachmentList.handlePreviewClick(file)
  → Check shouldSkipPreview(file)
  → If too large: show snackbar/alert, return
  → setSelectedFile(file)
  → setPreviewOpen(true)
  → FilePreviewModal renders with open=true
  → Modal determines file category
  → Renders appropriate preview component
```

### Navigation Between Files

```
User clicks "Next" arrow in modal
  → FilePreviewModal.handleNext()
  → currentIndex++
  → currentFile = files[currentIndex]
  → Reset zoom/position state
  → Re-render with new file
```

### Closing Preview

```
User clicks close button / ESC / outside modal
  → FilePreviewModal.handleClose()
  → onClose() callback to parent
  → Parent sets previewOpen=false
  → Modal unmounts
```

---

## 7. Error Handling

### Error States

| Scenario | Detection | User Experience |
|----------|-----------|-----------------|
| File URL is null/missing | On modal open | Show error: "File URL not available" + download button (if name exists) |
| Image fails to load (404, CORS) | `<img onError>` | Show error: "Unable to load image" + download button |
| PDF fails to load | `<iframe onError>` timeout | Show error: "Unable to preview PDF" + download button |
| File too large (>50MB) | Before opening modal | Show snackbar: "File too large to preview. Click to download." |
| Unsupported file type | On modal open | Show message: "Preview not available for this file type" + download button |
| Network error (fetch fails for text) | Fetch catch block | Show error: "Network error loading file" + retry button |

### Error State Data

```typescript
interface ErrorState {
  hasError: boolean;
  message: string;
  recoverable: boolean;              // Whether user can retry
  fallbackAction?: 'download' | 'retry';  // What action to offer
}
```

---

## 8. Performance Considerations

### Lazy Loading

```typescript
// Lazy load preview components to reduce initial bundle
const ImagePreview = lazy(() => import('./ImagePreview'));
const DocumentPreview = lazy(() => import('./DocumentPreview'));
```

### Image Optimization

- Use native browser lazy loading: `<img loading="lazy">`
- Thumbnails: CSS `object-fit: cover` for efficient scaling
- Full previews: Load original size, let browser handle scaling

### Caching

- **Browser HTTP cache**: Handles repeated requests to same file URL automatically
- **Component-level cache**: Not needed (browser cache sufficient)
- **Thumbnail caching**: Handled by browser (same img src = cached)

---

## 9. Accessibility

### Keyboard Navigation

| Key | Action |
|-----|--------|
| ESC | Close modal |
| Arrow Right | Next file (if multiple) |
| Arrow Left | Previous file (if multiple) |
| + or = | Zoom in (images only) |
| - | Zoom out (images only) |
| 0 | Reset zoom (images only) |

### Screen Readers

- Modal title announces file name and type
- Alt text on images uses file name
- ARIA labels on zoom/navigation buttons
- Focus trap within modal while open
- Focus returns to trigger element on close

### Example ARIA Attributes

```jsx
<Dialog
  aria-labelledby="file-preview-title"
  aria-describedby="file-preview-description"
  role="dialog"
>
  <DialogTitle id="file-preview-title">
    {file.name} - {fileCategory} Preview
  </DialogTitle>

  <IconButton
    aria-label="Close preview"
    onClick={onClose}
  >
    <CloseIcon />
  </IconButton>
</Dialog>
```

---

## 10. Responsive Behavior

### Desktop (>960px)

- Modal: `maxWidth="lg"` (1280px)
- Image: Centered, max 80vh height
- PDF iframe: Full modal width, 80vh height
- Navigation: Fixed arrows on left/right

### Tablet (600-960px)

- Modal: `maxWidth="md"` (960px)
- Image: Centered, max 70vh height
- Smaller zoom control buttons
- Navigation arrows smaller

### Mobile (<600px)

- Modal: `fullScreen={true}` (covers entire screen)
- Image: Full width, scroll if zoomed
- Touch gestures: Swipe to navigate, pinch to zoom (future)
- Toolbar: Fixed at bottom for better thumb access

---

## Summary

This data model defines:

1. ✅ **Attachment entity shape** (normalized from various API formats)
2. ✅ **Component prop interfaces** for all 4 new components
3. ✅ **State management approach** (local React state, no Redux)
4. ✅ **Utility function signatures** for file operations
5. ✅ **Event flows** for open/navigate/close actions
6. ✅ **Error handling strategy** with specific user experiences
7. ✅ **Performance patterns** (lazy loading, browser caching)
8. ✅ **Accessibility requirements** (keyboard nav, ARIA, screen readers)
9. ✅ **Responsive behavior** across device sizes

**Next**: Create component API contracts with detailed prop validation and examples.
