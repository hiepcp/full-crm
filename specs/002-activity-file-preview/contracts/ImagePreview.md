# Component Contract: ImagePreview

**Component**: ImagePreview
**Type**: Presenter Component
**Path**: `crm-system-client/src/presentation/components/common/FilePreviewer/ImagePreview.jsx`

## Purpose

Specialized component for displaying image files with zoom, pan, and reset functionality. Handles mouse drag for panning when zoomed, and provides zoom controls. Designed to be used within FilePreviewModal.

---

## Props API

### Required Props

```typescript
file: Attachment
```
- **Description**: Image file object to display
- **Valid Values**: Attachment object with valid `url` and `mimeType` starting with `image/`
- **Example**:
  ```javascript
  file={{
    id: 'img-123',
    name: 'screenshot.png',
    url: 'https://example.com/files/screenshot.png',
    size: 150000,
    mimeType: 'image/png'
  }}
  ```

```typescript
zoomLevel: number
```
- **Description**: Current zoom level (controlled by parent)
- **Valid Values**: `1` (100%) to `4` (400%)
- **Example**: `zoomLevel={2}` (200% zoom)

```typescript
position: { x: number; y: number }
```
- **Description**: Current pan position in pixels (controlled by parent)
- **Valid Values**: Object with `x` and `y` number properties
- **Example**: `position={{ x: -50, y: 100 }}`

```typescript
onZoomChange: (newZoom: number) => void
```
- **Description**: Callback when user changes zoom level
- **Arguments**: New zoom level (1-4)
- **Example**:
  ```javascript
  onZoomChange={(newZoom) => {
    setZoomLevel(newZoom);
    console.log('Zoom changed to:', newZoom);
  }}
  ```

```typescript
onPositionChange: (newPos: { x: number; y: number }) => void
```
- **Description**: Callback when user pans image
- **Arguments**: New position object
- **Example**:
  ```javascript
  onPositionChange={(newPos) => {
    setPosition(newPos);
  }}
  ```

```typescript
onLoad: () => void
```
- **Description**: Callback when image loads successfully
- **Example**: `onLoad={() => setLoading(false)}`

```typescript
onError: (error: Error) => void
```
- **Description**: Callback when image fails to load
- **Example**:
  ```javascript
  onError={(error) => {
    console.error('Image load failed:', error);
    setError('Unable to load image');
  }}
  ```

---

### Optional Props

```typescript
maxZoom?: number
```
- **Description**: Maximum allowed zoom level
- **Default**: `4` (400%)
- **Valid Values**: `1` to `10`
- **Example**: `maxZoom={6}`

```typescript
minZoom?: number
```
- **Description**: Minimum allowed zoom level
- **Default**: `1` (100%)
- **Valid Values**: `0.5` to `1`
- **Example**: `minZoom={0.5}`

---

## State Management

### Internal State

```typescript
const [dragging, setDragging] = useState<boolean>(false);
const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
const [imageLoaded, setImageLoaded] = useState<boolean>(false);
const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
const [imageError, setImageError] = useState<boolean>(false);
```

### State Descriptions

- **dragging**: Whether user is currently dragging image (for pan)
- **dragStart**: Starting mouse position when drag began
- **imageLoaded**: Whether `<img>` element has finished loading
- **naturalSize**: Original image dimensions from `naturalWidth` and `naturalHeight`
- **imageError**: Whether image failed to load

---

## Behavior Specifications

### Image Loading

```javascript
const handleImageLoad = (e) => {
  const img = e.target;
  setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
  setImageLoaded(true);
  setImageError(false);
  onLoad();
};

const handleImageError = (e) => {
  setImageError(true);
  setImageLoaded(false);
  onError(new Error(`Failed to load image: ${file.url}`));
};
```

### Zoom Controls

**Zoom In**:
```javascript
const handleZoomIn = () => {
  const newZoom = Math.min(zoomLevel + 0.5, maxZoom);
  onZoomChange(newZoom);
};
```

**Zoom Out**:
```javascript
const handleZoomOut = () => {
  const newZoom = Math.max(zoomLevel - 0.5, minZoom);
  onZoomChange(newZoom);

  // Reset position if zooming back to 1x
  if (newZoom === 1) {
    onPositionChange({ x: 0, y: 0 });
  }
};
```

**Reset Zoom**:
```javascript
const handleResetZoom = () => {
  onZoomChange(1);
  onPositionChange({ x: 0, y: 0 });
};
```

### Pan (Drag) Behavior

**Mouse Down** (Start Drag):
```javascript
const handleMouseDown = (e) => {
  if (zoomLevel <= 1) return; // No panning when not zoomed

  setDragging(true);
  setDragStart({
    x: e.clientX - position.x,
    y: e.clientY - position.y
  });
  e.preventDefault(); // Prevent text selection
};
```

**Mouse Move** (While Dragging):
```javascript
const handleMouseMove = (e) => {
  if (!dragging || !dragStart) return;

  const newPosition = {
    x: e.clientX - dragStart.x,
    y: e.clientY - dragStart.y
  };

  onPositionChange(newPosition);
};
```

**Mouse Up** (End Drag):
```javascript
const handleMouseUp = () => {
  setDragging(false);
  setDragStart(null);
};
```

### Double-Click to Reset

```javascript
const handleDoubleClick = () => {
  if (zoomLevel === 1) {
    // Zoom to 2x on double-click
    onZoomChange(2);
  } else {
    // Reset zoom on double-click when zoomed
    handleResetZoom();
  }
};
```

### Keyboard Shortcuts

```javascript
useEffect(() => {
  const handleKeyDown = (e) => {
    switch (e.key) {
      case '+':
      case '=':
        handleZoomIn();
        break;
      case '-':
        handleZoomOut();
        break;
      case '0':
        handleResetZoom();
        break;
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [zoomLevel]);
```

---

## UI Layout

```
┌────────────────────────────────────────────────────┐
│                                                    │
│                                                    │
│                  [Image Display]                   │  ← Zoomable/Pannable Image
│                                                    │
│                                                    │
└────────────────────────────────────────────────────┘

            [−]  [Reset]  [+]                         ← Zoom Controls (bottom)
```

---

## Styling

### Image Container

```jsx
<Box
  sx={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    minHeight: '60vh',
    maxHeight: '80vh',
    overflow: zoomLevel > 1 ? 'hidden' : 'visible',
    position: 'relative',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    cursor: zoomLevel > 1 ? (dragging ? 'grabbing' : 'grab') : 'zoom-in'
  }}
  onMouseDown={handleMouseDown}
  onMouseMove={handleMouseMove}
  onMouseUp={handleMouseUp}
  onMouseLeave={handleMouseUp}
  onDoubleClick={handleDoubleClick}
>
  {/* Image element */}
</Box>
```

### Image Element

```jsx
<Box
  component="img"
  src={file.url}
  alt={file.name}
  onLoad={handleImageLoad}
  onError={handleImageError}
  sx={{
    transform: `scale(${zoomLevel}) translate(${position.x / zoomLevel}px, ${position.y / zoomLevel}px)`,
    transition: dragging ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    transformOrigin: 'center center',
    maxWidth: zoomLevel === 1 ? '100%' : 'none',
    maxHeight: zoomLevel === 1 ? '80vh' : 'none',
    width: zoomLevel > 1 ? `${naturalSize?.width}px` : 'auto',
    height: zoomLevel > 1 ? `${naturalSize?.height}px` : 'auto',
    objectFit: 'contain',
    userSelect: 'none',
    pointerEvents: zoomLevel > 1 ? 'none' : 'auto'
  }}
/>
```

### Zoom Controls Toolbar

```jsx
<Box
  sx={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 1,
    mt: 2,
    p: 1,
    backgroundColor: 'background.paper',
    borderRadius: 2,
    boxShadow: 1
  }}
>
  <IconButton
    onClick={handleZoomOut}
    disabled={zoomLevel <= minZoom}
    aria-label="Zoom out"
  >
    <ZoomOutIcon />
  </IconButton>

  <Chip
    label={`${Math.round(zoomLevel * 100)}%`}
    size="small"
    onClick={handleResetZoom}
    sx={{ cursor: 'pointer', minWidth: 60 }}
  />

  <IconButton
    onClick={handleZoomIn}
    disabled={zoomLevel >= maxZoom}
    aria-label="Zoom in"
  >
    <ZoomInIcon />
  </IconButton>
</Box>
```

---

## Loading States

### Initial Load

```jsx
{!imageLoaded && !imageError && (
  <Box
    sx={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 2
    }}
  >
    <CircularProgress size={48} />
    <Typography variant="body2" color="text.secondary">
      Loading image...
    </Typography>
  </Box>
)}
```

---

## Error States

### Image Load Failed

```jsx
{imageError && (
  <Box
    sx={{
      textAlign: 'center',
      py: 8,
      px: 4
    }}
  >
    <BrokenImageIcon
      sx={{ fontSize: 64, color: 'error.main', mb: 2 }}
    />
    <Typography variant="h6" gutterBottom>
      Unable to load image
    </Typography>
    <Typography variant="body2" color="text.secondary" gutterBottom>
      The image file could not be loaded. It may be corrupted or no longer available.
    </Typography>
    <Button
      variant="outlined"
      startIcon={<RefreshIcon />}
      onClick={() => {
        setImageError(false);
        setImageLoaded(false);
      }}
      sx={{ mt: 2 }}
    >
      Retry
    </Button>
  </Box>
)}
```

---

## Accessibility

### ARIA Attributes

```jsx
<Box
  role="img"
  aria-label={`Image preview: ${file.name}`}
  aria-describedby="image-zoom-instructions"
>
  <Box
    component="img"
    src={file.url}
    alt={file.name}
    title={`${file.name} - ${formatFileSize(file.size)}`}
  />
</Box>

<Typography
  id="image-zoom-instructions"
  sx={{ srOnly: true }}
>
  Use plus and minus keys to zoom. Click and drag to pan when zoomed. Double-click to toggle zoom.
</Typography>
```

### Keyboard Navigation

| Key | Action | Condition |
|-----|--------|-----------|
| `+` or `=` | Zoom in | `zoomLevel < maxZoom` |
| `-` | Zoom out | `zoomLevel > minZoom` |
| `0` | Reset zoom to 100% | `zoomLevel !== 1` |

### Screen Reader Announcements

```jsx
<Box role="status" aria-live="polite" sx={{ srOnly: true }}>
  {imageLoaded && `Image loaded: ${file.name}`}
  {imageError && `Error loading image: ${file.name}`}
  {zoomLevel !== 1 && `Zoom level: ${Math.round(zoomLevel * 100)}%`}
</Box>
```

---

## Example Usage

### Basic Usage

```jsx
import ImagePreview from '@/presentation/components/common/FilePreviewer/ImagePreview';

function ImagePreviewExample() {
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const imageFile = {
    id: 'img-1',
    name: 'screenshot.png',
    url: 'https://example.com/screenshot.png',
    size: 245760,
    mimeType: 'image/png'
  };

  return (
    <ImagePreview
      file={imageFile}
      zoomLevel={zoom}
      position={pos}
      onZoomChange={setZoom}
      onPositionChange={setPos}
      onLoad={() => console.log('Image loaded')}
      onError={(err) => console.error('Load failed:', err)}
    />
  );
}
```

### With Custom Zoom Limits

```jsx
<ImagePreview
  file={imageFile}
  zoomLevel={zoom}
  position={pos}
  onZoomChange={setZoom}
  onPositionChange={setPos}
  onLoad={() => setLoading(false)}
  onError={(err) => setError(err.message)}
  maxZoom={6}
  minZoom={0.5}
/>
```

---

## Performance Considerations

### Transform Optimization

- Uses CSS `transform: scale()` and `translate()` for GPU-accelerated zooming and panning
- Transitions disabled during drag for smooth 60fps interaction
- `transform-origin: center center` ensures consistent zoom behavior

### Debouncing (Future Enhancement)

```javascript
// Optional: Debounce position updates during drag for smoother state management
const debouncedPositionChange = useMemo(
  () => debounce(onPositionChange, 16), // ~60fps
  [onPositionChange]
);
```

### Memory Management

- Component unmounts cleanly: event listeners removed in `useEffect` cleanup
- Image element released when component unmounts (no explicit cleanup needed)

---

## Browser Compatibility

| Feature | Browser Support |
|---------|----------------|
| CSS Transforms | All modern browsers (Chrome, Firefox, Safari, Edge) |
| Mouse Events | All modern browsers |
| Double-click | All modern browsers |
| Image Loading Events | All modern browsers |

**Minimum Requirements**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

---

## Future Enhancements

### Pinch-to-Zoom (Mobile)

```javascript
const handleTouchStart = (e) => {
  if (e.touches.length === 2) {
    // Calculate initial pinch distance
    const touch1 = e.touches[0];
    const touch2 = e.touches[1];
    const distance = Math.hypot(
      touch2.clientX - touch1.clientX,
      touch2.clientY - touch1.clientY
    );
    setPinchStart(distance);
  }
};

const handleTouchMove = (e) => {
  if (e.touches.length === 2 && pinchStart) {
    const touch1 = e.touches[0];
    const touch2 = e.touches[1];
    const distance = Math.hypot(
      touch2.clientX - touch1.clientX,
      touch2.clientY - touch1.clientY
    );
    const scale = distance / pinchStart;
    const newZoom = Math.min(Math.max(zoomLevel * scale, minZoom), maxZoom);
    onZoomChange(newZoom);
  }
};
```

### Zoom to Point

```javascript
const handleZoomToPoint = (clientX, clientY, newZoom) => {
  // Calculate zoom toward mouse cursor position
  const rect = imageRef.current.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;

  const newPosition = {
    x: x - (x - position.x) * (newZoom / zoomLevel),
    y: y - (y - position.y) * (newZoom / zoomLevel)
  };

  onZoomChange(newZoom);
  onPositionChange(newPosition);
};
```

---

## Testing Checklist

### Unit Tests

- [ ] Renders image with correct src
- [ ] Calls `onLoad` when image loads successfully
- [ ] Calls `onError` when image fails to load
- [ ] Zoom in button increases zoom level
- [ ] Zoom out button decreases zoom level
- [ ] Reset button sets zoom to 1 and position to {0, 0}
- [ ] Zoom buttons disabled at min/max zoom
- [ ] Dragging updates position when zoomed
- [ ] Dragging does nothing when zoom = 1
- [ ] Double-click toggles zoom
- [ ] Keyboard shortcuts work (+, -, 0)

### Integration Tests

- [ ] Works correctly within FilePreviewModal
- [ ] Zoom/position state persists while file is open
- [ ] Zoom/position resets when file changes
- [ ] Loading state shows before image loads
- [ ] Error state shows when image fails to load

### Manual Testing

- [ ] Image scales smoothly when zooming
- [ ] Panning feels responsive (60fps)
- [ ] Cursor changes appropriately (grab/grabbing/zoom-in)
- [ ] Double-click zoom feels natural
- [ ] Keyboard zoom shortcuts work
- [ ] Works on mobile (touch events)
- [ ] SVG images display correctly
- [ ] Very large images (>5000px) perform well
- [ ] Transparent PNG images display correctly
- [ ] Animated GIF images animate correctly

---

**Version**: 1.0.0
**Last Updated**: 2025-12-23
**Status**: Ready for implementation
