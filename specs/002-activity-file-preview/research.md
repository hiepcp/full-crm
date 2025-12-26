# Research: Activity File Preview

**Date**: 2025-12-23
**Feature**: 002-activity-file-preview
**Purpose**: Resolve technical decisions for library selection and implementation patterns

## Overview

This document captures research findings and technical decisions for implementing file preview functionality in the CRM activity feed. Two main areas required investigation: PDF viewer library selection and image zoom/preview library selection.

---

## Decision 1: PDF Viewer Library

### Problem Statement

Need to display PDF files inline within a modal dialog with page navigation controls. Options considered: react-pdf, pdfjs-dist (raw), or native `<iframe>` with PDF embed.

### Decision: Native `<iframe>` with PDF.js fallback

**Rationale**:
1. **Zero additional dependencies**: Browser native PDF rendering works in all modern browsers (Chrome, Firefox, Edge, Safari 14+)
2. **Built-in controls**: Browsers provide native zoom, page navigation, print, and download controls
3. **Security**: `<iframe sandbox="">` attribute provides content isolation
4. **Simplicity**: No complex library integration or build configuration
5. **Performance**: Leverages browser-optimized rendering engines
6. **Fallback ready**: Can lazy-load react-pdf or PDF.js only if native rendering fails

**Implementation Approach**:
```jsx
<iframe
  src={pdfUrl}
  title={fileName}
  sandbox="allow-same-origin allow-scripts"
  style={{ width: '100%', height: '80vh', border: 'none' }}
/>
```

**Alternatives Considered**:

| Library | Pros | Cons | Rejected Because |
|---------|------|------|------------------|
| react-pdf | Extensive customization, page-by-page control | 1.2MB bundle size, complex setup, requires PDF.js worker | Bundle size impact for native feature that browsers already provide |
| pdfjs-dist (raw) | Full control, widely used | Requires manual worker setup, no React integration, 1MB+ size | More complex than react-pdf without React wrapper benefits |
| @react-pdf-viewer/core | Modern, good docs | Large bundle, overkill for simple inline display | Adds complexity we don't need for basic preview |

**Known Limitations**:
- Safari < 14 has limited PDF support (acceptable, Safari 14+ is standard)
- No programmatic page navigation with iframe (users use browser controls)
- Custom styling limited (acceptable, browser controls are familiar)

**Fallback Strategy**:
If iframe fails to load (detected via onerror or timeout):
1. Show error message: "Unable to preview PDF in browser"
2. Offer download button
3. Optionally: lazy-load react-pdf as fallback (future enhancement)

---

## Decision 2: Image Zoom/Preview Library

### Problem Statement

Need to display images with zoom controls (zoom in, zoom out, reset, pan) and multi-image navigation. Options: react-medium-image-zoom, react-image-lightbox, react-image-gallery, or custom CSS/React implementation.

### Decision: Custom implementation with CSS transforms + MUI Dialog

**Rationale**:
1. **Zero additional dependencies**: Can implement with native CSS transforms and React state
2. **Full control**: Custom styling to match MUI theme and design system
3. **Lightweight**: ~100 lines of code vs 50-100KB library
4. **MUI integration**: Already using MUI Dialog, IconButton, Box components
5. **Accessibility**: Built-in keyboard support (ESC to close, arrow keys for navigation)
6. **Mobile-friendly**: CSS transforms work smoothly on touch devices

**Implementation Approach**:
```jsx
const [zoomLevel, setZoomLevel] = useState(1);
const [position, setPosition] = useState({ x: 0, y: 0 });

const imageStyle = {
  transform: `scale(${zoomLevel}) translate(${position.x}px, ${position.y}px)`,
  transition: 'transform 0.3s ease',
  maxWidth: '100%',
  maxHeight: '80vh',
  cursor: zoomLevel > 1 ? 'grab' : 'zoom-in'
};

// Zoom controls
<IconButton onClick={() => setZoomLevel(prev => Math.min(prev + 0.5, 4))}>
  <ZoomInIcon />
</IconButton>
```

**Alternatives Considered**:

| Library | Pros | Cons | Rejected Because |
|---------|------|------|------------------|
| react-medium-image-zoom | Popular (1M+ weekly downloads), simple API | Limited customization, no multi-image support | Doesn't support multi-image navigation needed for P1 |
| react-image-lightbox | Feature-rich, multi-image support | 100KB bundle, not maintained since 2021 | Unmaintained, bundle size impact |
| react-image-gallery | Extensive features, thumbnails | 200KB+ bundle, overkill for preview | Way more features than needed (carousel, autoplay, etc.) |
| yet-another-react-lightbox | Modern, maintained, 50KB | Still adds dependency for simple feature | Can implement core features in <100 LOC |

**Feature Implementation**:
- **Zoom**: State-based scale transform (1x to 4x)
- **Pan**: Drag handlers with mouse/touch events (only when zoomed)
- **Navigation**: Left/right arrow buttons + keyboard events
- **Reset**: Double-click or reset button returns to 1x scale
- **Mobile**: Pinch-to-zoom using touch events (future enhancement)

**Code Estimate**: ~150 lines for ImagePreview component with full zoom/pan/navigate functionality.

---

## Decision 3: Thumbnail Generation Strategy

### Problem Statement

Need to display 64x64px thumbnails for images and PDF first pages in the activity feed.

### Decision: CSS-based thumbnails with lazy loading

**Rationale**:
1. **No generation needed**: Use `<img>` with CSS `object-fit: cover` and fixed dimensions
2. **Browser optimization**: Browser handles downscaling efficiently
3. **Lazy loading**: Native `loading="lazy"` attribute defers off-screen images
4. **Fast implementation**: No canvas manipulation or image processing libraries

**Implementation Approach**:
```jsx
<Box
  component="img"
  src={imageUrl}
  alt={fileName}
  loading="lazy"
  sx={{
    width: 64,
    height: 64,
    objectFit: 'cover',
    borderRadius: 1,
    cursor: 'pointer'
  }}
  onClick={() => openPreview(imageUrl)}
/>
```

**PDF Thumbnail Strategy**:
- **P3 requirement**: First-page PDF thumbnails
- **Implementation**: Defer to Phase 1 design (may use PDF.js `getPage(1)` + canvas rendering)
- **Alternative**: Show generic PDF icon instead (simpler, still useful)
- **Decision**: Start with PDF icon, add first-page rendering as enhancement

**Alternatives Considered**:
- Server-side thumbnail generation: Requires backend changes (out of scope)
- Canvas-based client generation: Adds complexity, not needed for images
- Blurhash/placeholder: Nice-to-have, defer to future enhancement

---

## Decision 4: File Type Detection Pattern

### Problem Statement

Need to determine if a file is previewable based on extension and MIME type.

### Decision: Utility function with MIME type + extension fallback

**Implementation**:
```javascript
// utils/fileUtils.js

export const FILE_CATEGORIES = {
  IMAGE: 'image',
  PDF: 'pdf',
  TEXT: 'text',
  UNSUPPORTED: 'unsupported'
};

export const getFileCategory = (file) => {
  const mimeType = file.mimeType || file.contentType || '';
  const extension = (file.name || file.fileName || '').split('.').pop().toLowerCase();

  // Check MIME type first (most reliable)
  if (mimeType.startsWith('image/')) {
    const imageTypes = ['png', 'jpg', 'jpeg', 'gif', 'svg+xml', 'webp', 'bmp'];
    if (imageTypes.some(type => mimeType.includes(type))) {
      return FILE_CATEGORIES.IMAGE;
    }
  }

  if (mimeType === 'application/pdf' || extension === 'pdf') {
    return FILE_CATEGORIES.PDF;
  }

  if (mimeType.startsWith('text/') || ['txt', 'csv'].includes(extension)) {
    return FILE_CATEGORIES.TEXT;
  }

  // Fallback to extension if MIME type unavailable
  const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp'];
  if (imageExtensions.includes(extension)) {
    return FILE_CATEGORIES.IMAGE;
  }

  return FILE_CATEGORIES.UNSUPPORTED;
};

export const isPreviewable = (file) => {
  const category = getFileCategory(file);
  return category !== FILE_CATEGORIES.UNSUPPORTED;
};

export const formatFileSize = (bytes) => {
  if (!bytes) return 'Unknown size';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

export const shouldSkipPreview = (file) => {
  const maxSize = 50 * 1024 * 1024; // 50MB
  return file.size && file.size > maxSize;
};
```

**Rationale**:
- Centralized logic in reusable utility functions
- MIME type priority (more reliable than extension)
- Extension fallback for files without MIME type
- Size limit check for performance

---

## Decision 5: Component Architecture Pattern

### Problem Statement

How to structure the preview feature for reusability and maintainability.

### Decision: Container/Presenter pattern with modal manager

**Component Hierarchy**:
```
FilePreviewModal (Container)
├── ImagePreview (Presenter)
├── DocumentPreview (Presenter)
│   ├── PDFViewer (Presenter)
│   └── TextView (Presenter)
└── Navigation Controls (Shared)
```

**Rationale**:
- **FilePreviewModal**: Manages state (current file, zoom, navigation), provides modal shell
- **Specialized previews**: Each file type has dedicated component for rendering
- **Reusable**: Can be used from ActivityFeed, or future deal/customer file lists
- **Testable**: Each component has clear props and responsibilities
- **Lazy loading**: Code-split DocumentPreview and ImagePreview to reduce initial bundle

**Integration Pattern**:
```jsx
// In ActivityAttachmentList.jsx
const [previewFile, setPreviewFile] = useState(null);
const [previewOpen, setPreviewOpen] = useState(false);

const handlePreviewClick = (file) => {
  if (shouldSkipPreview(file)) {
    // Show "file too large" message and offer download
    return;
  }
  setPreviewFile(file);
  setPreviewOpen(true);
};

return (
  <>
    {/* Existing attachment list with preview icons */}
    <FilePreviewModal
      open={previewOpen}
      files={allAttachments}
      currentFile={previewFile}
      onClose={() => setPreviewOpen(false)}
    />
  </>
);
```

---

## Summary of Technical Decisions

| Decision | Choice | Impact |
|----------|--------|--------|
| PDF Viewer | Native `<iframe>` | Zero dependencies, browser-optimized |
| Image Zoom | Custom CSS transforms | ~150 LOC, full control, MUI integrated |
| Thumbnails | CSS `object-fit` + lazy loading | Fast, no generation needed |
| File Type Detection | Utility functions with MIME + extension | Centralized, reusable logic |
| Architecture | Container/Presenter with modal manager | Clean separation, lazy-loadable |

**Total Additional Dependencies**: **0** (all native browser + existing MUI)

**Bundle Impact**: ~5-10KB (new component code only)

**Implementation Risk**: **Low** - All decisions use proven web platform features and existing project patterns.

---

## Next Steps

1. **Phase 1 Design**: Create detailed component contracts (props, events, state)
2. **Phase 1 Design**: Document data model (attachment object shape, state management)
3. **Phase 1 Design**: Write quickstart guide for integrating preview into new components
4. **Phase 2 Tasks**: Break down implementation into atomic tasks
