# Component Contract: DocumentPreview

**Component**: DocumentPreview
**Type**: Presenter Component
**Path**: `crm-system-client/src/presentation/components/common/FilePreviewer/DocumentPreview.jsx`

## Purpose

Specialized component for displaying document files (PDF, TXT, CSV) with appropriate rendering methods. Uses native `<iframe>` for PDFs and formatted text display for plain text files.

---

## Props API

### Required Props

```typescript
file: Attachment
```
- **Description**: Document file object to display
- **Valid Values**: Attachment object with `mimeType` of `application/pdf`, `text/plain`, or `text/csv`
- **Example**:
  ```javascript
  file={{
    id: 'doc-456',
    name: 'contract.pdf',
    url: 'https://example.com/files/contract.pdf',
    size: 2457600,
    mimeType: 'application/pdf'
  }}
  ```

```typescript
fileCategory: FileCategory
```
- **Description**: Type of document (PDF or TEXT)
- **Valid Values**: `FileCategory.PDF` | `FileCategory.TEXT`
- **Example**: `fileCategory={FileCategory.PDF}`

```typescript
onLoad: () => void
```
- **Description**: Callback when document loads successfully
- **Example**: `onLoad={() => setLoading(false)}`

```typescript
onError: (error: Error) => void
```
- **Description**: Callback when document fails to load
- **Example**:
  ```javascript
  onError={(error) => {
    console.error('Document load failed:', error);
    setError('Unable to load document');
  }}
  ```

---

### Optional Props

```typescript
showToolbar?: boolean
```
- **Description**: Show browser PDF toolbar controls (PDF only)
- **Default**: `true`
- **Example**: `showToolbar={false}`

```typescript
wrapText?: boolean
```
- **Description**: Wrap long lines in text files (TXT/CSV only)
- **Default**: `true`
- **Example**: `wrapText={false}`

```typescript
fontSize?: number
```
- **Description**: Font size for text file display in pixels (TXT/CSV only)
- **Default**: `14`
- **Valid Values**: `10` to `24`
- **Example**: `fontSize={16}`

---

## State Management

### Internal State

```typescript
const [contentLoaded, setContentLoaded] = useState<boolean>(false);
const [textContent, setTextContent] = useState<string>('');
const [fetchError, setFetchError] = useState<string | null>(null);
const [iframeFailed, setIframeFailed] = useState<boolean>(false);
```

### State Descriptions

- **contentLoaded**: Whether iframe or text content has loaded
- **textContent**: For TEXT files, the fetched file content
- **fetchError**: Error message from failed fetch (TEXT files only)
- **iframeFailed**: Whether PDF iframe failed to load

---

## Behavior Specifications

### PDF Rendering

**Method**: Native `<iframe>` with browser PDF viewer

```javascript
const PDFViewer = () => {
  const iframeRef = useRef(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      setContentLoaded(true);
      setIframeFailed(false);
      onLoad();
    };

    const handleError = () => {
      setIframeFailed(true);
      setContentLoaded(false);
      onError(new Error(`Failed to load PDF: ${file.url}`));
    };

    iframe.addEventListener('load', handleLoad);
    iframe.addEventListener('error', handleError);

    // Timeout fallback: if iframe doesn't load in 10 seconds, assume error
    const timeout = setTimeout(() => {
      if (!contentLoaded) {
        handleError();
      }
    }, 10000);

    return () => {
      iframe.removeEventListener('load', handleLoad);
      iframe.removeEventListener('error', handleError);
      clearTimeout(timeout);
    };
  }, [file.url]);

  return (
    <Box
      ref={iframeRef}
      component="iframe"
      src={file.url}
      title={file.name}
      sandbox="allow-same-origin allow-scripts allow-downloads"
      sx={{
        width: '100%',
        height: '80vh',
        border: 'none',
        backgroundColor: 'background.paper'
      }}
    />
  );
};
```

---

### Text File Rendering

**Method**: Fetch content and display in `<pre>` element

```javascript
const TextView = () => {
  useEffect(() => {
    const fetchTextContent = async () => {
      try {
        const response = await fetch(file.url);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const text = await response.text();
        setTextContent(text);
        setContentLoaded(true);
        setFetchError(null);
        onLoad();
      } catch (error) {
        setFetchError(error.message);
        setContentLoaded(false);
        onError(error);
      }
    };

    fetchTextContent();
  }, [file.url]);

  if (fetchError) {
    return (
      <Alert severity="error">
        Failed to load file: {fetchError}
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </Alert>
    );
  }

  return (
    <Box
      sx={{
        width: '100%',
        maxHeight: '80vh',
        overflow: 'auto',
        backgroundColor: 'background.default',
        p: 2,
        borderRadius: 1
      }}
    >
      <Typography
        component="pre"
        sx={{
          fontFamily: 'monospace',
          fontSize: `${fontSize}px`,
          whiteSpace: wrapText ? 'pre-wrap' : 'pre',
          wordBreak: wrapText ? 'break-word' : 'normal',
          margin: 0,
          color: 'text.primary'
        }}
      >
        {textContent}
      </Typography>
    </Box>
  );
};
```

---

### CSV Rendering

**Method**: Display as formatted table (future enhancement) or plain text

**Current**: Display as plain text with monospace font (same as TXT)

**Future Enhancement**: Parse CSV and render as MUI Table

```javascript
// Future implementation
const CSVTable = () => {
  const [rows, setRows] = useState([]);
  const [headers, setHeaders] = useState([]);

  useEffect(() => {
    // Parse CSV content
    const lines = textContent.split('\n');
    const parsedHeaders = lines[0].split(',');
    const parsedRows = lines.slice(1).map(line => line.split(','));

    setHeaders(parsedHeaders);
    setRows(parsedRows);
  }, [textContent]);

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            {headers.map((header, idx) => (
              <TableCell key={idx}>{header}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, rowIdx) => (
            <TableRow key={rowIdx}>
              {row.map((cell, cellIdx) => (
                <TableCell key={cellIdx}>{cell}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
```

---

## UI Layout

### PDF Preview

```
┌────────────────────────────────────────────────┐
│ [PDF Viewer - Browser Native Controls]        │
│                                                │
│  Page 1 of 10          [Print] [Download]     │  ← Browser toolbar (if enabled)
│                                                │
│  [Document Content]                            │
│                                                │
│  Lorem ipsum dolor sit amet, consectetur       │
│  adipiscing elit. Sed do eiusmod tempor        │
│                                                │
│              [Scroll]                          │
│                                                │
└────────────────────────────────────────────────┘
```

### Text File Preview

```
┌────────────────────────────────────────────────┐
│                                                │
│  1  // Code file example                      │
│  2  function calculateTotal(items) {           │
│  3    return items.reduce((sum, item) => {    │
│  4      return sum + item.price;              │
│  5    }, 0);                                   │
│  6  }                                          │
│  7                                             │
│                                                │
│              [Scroll]                          │
│                                                │
└────────────────────────────────────────────────┘
```

---

## Styling

### PDF Iframe

```jsx
<Box
  component="iframe"
  src={file.url}
  title={file.name}
  sandbox="allow-same-origin allow-scripts allow-downloads"
  sx={{
    width: '100%',
    height: '80vh',
    border: 'none',
    backgroundColor: 'background.paper',
    borderRadius: 1,
    boxShadow: theme.shadows[2]
  }}
/>
```

### Text Display

```jsx
<Box
  sx={{
    width: '100%',
    maxHeight: '80vh',
    overflow: 'auto',
    backgroundColor: 'background.default',
    p: 3,
    borderRadius: 1,
    border: '1px solid',
    borderColor: 'divider'
  }}
>
  <Typography
    component="pre"
    sx={{
      fontFamily: '"Fira Code", "Courier New", monospace',
      fontSize: `${fontSize}px`,
      lineHeight: 1.6,
      whiteSpace: wrapText ? 'pre-wrap' : 'pre',
      wordBreak: wrapText ? 'break-word' : 'normal',
      margin: 0,
      color: 'text.primary',
      '& ::selection': {
        backgroundColor: 'primary.light',
        color: 'primary.contrastText'
      }
    }}
  >
    {textContent}
  </Typography>
</Box>
```

---

## Loading States

### PDF Loading

```jsx
{!contentLoaded && !iframeFailed && (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      gap: 2
    }}
  >
    <CircularProgress size={48} />
    <Typography variant="body2" color="text.secondary">
      Loading PDF...
    </Typography>
  </Box>
)}
```

### Text Loading

```jsx
{!contentLoaded && !fetchError && (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '40vh',
      gap: 2
    }}
  >
    <CircularProgress size={40} />
    <Typography variant="body2" color="text.secondary">
      Fetching file content...
    </Typography>
  </Box>
)}
```

---

## Error States

### PDF Load Failed

```jsx
{iframeFailed && (
  <Box sx={{ textAlign: 'center', py: 8, px: 4 }}>
    <PictureAsPdfIcon
      sx={{ fontSize: 64, color: 'error.main', mb: 2 }}
    />
    <Typography variant="h6" gutterBottom>
      Unable to preview PDF
    </Typography>
    <Typography variant="body2" color="text.secondary" gutterBottom>
      Your browser cannot display this PDF file.
    </Typography>
    <Button
      variant="contained"
      startIcon={<DownloadIcon />}
      onClick={() => window.open(file.url, '_blank')}
      sx={{ mt: 2 }}
    >
      Download PDF
    </Button>
  </Box>
)}
```

### Text Fetch Failed

```jsx
{fetchError && (
  <Alert
    severity="error"
    action={
      <Button color="inherit" size="small" onClick={retryFetch}>
        Retry
      </Button>
    }
  >
    <AlertTitle>Failed to load file</AlertTitle>
    {fetchError}
  </Alert>
)}
```

---

## Accessibility

### PDF Accessibility

```jsx
<Box
  component="iframe"
  src={file.url}
  title={`PDF document: ${file.name}`}
  aria-label={`PDF preview of ${file.name}`}
  sandbox="allow-same-origin allow-scripts allow-downloads"
/>
```

### Text Accessibility

```jsx
<Box
  role="article"
  aria-label={`Text file: ${file.name}`}
  tabIndex={0}
>
  <Typography
    component="pre"
    aria-label="File content"
  >
    {textContent}
  </Typography>
</Box>
```

---

## Example Usage

### PDF Preview

```jsx
import DocumentPreview from '@/presentation/components/common/FilePreviewer/DocumentPreview';
import { FileCategory } from '@/utils/fileUtils';

function PDFPreviewExample() {
  const pdfFile = {
    id: 'pdf-1',
    name: 'contract.pdf',
    url: 'https://example.com/contract.pdf',
    size: 2457600,
    mimeType: 'application/pdf'
  };

  return (
    <DocumentPreview
      file={pdfFile}
      fileCategory={FileCategory.PDF}
      onLoad={() => console.log('PDF loaded')}
      onError={(err) => console.error('PDF error:', err)}
      showToolbar={true}
    />
  );
}
```

### Text File Preview

```jsx
function TextPreviewExample() {
  const txtFile = {
    id: 'txt-1',
    name: 'log.txt',
    url: 'https://example.com/log.txt',
    size: 45000,
    mimeType: 'text/plain'
  };

  return (
    <DocumentPreview
      file={txtFile}
      fileCategory={FileCategory.TEXT}
      onLoad={() => console.log('Text loaded')}
      onError={(err) => console.error('Text error:', err)}
      wrapText={true}
      fontSize={14}
    />
  );
}
```

---

## Browser Compatibility

| Feature | Browser Support |
|---------|----------------|
| PDF iframe | Chrome 90+, Firefox 88+, Safari 14+, Edge 90+ (native PDF viewer) |
| Fetch API | All modern browsers |
| Text rendering | All modern browsers |
| Sandbox attribute | All modern browsers |

**Fallback**: If PDF fails, show download button

---

## Security Considerations

### Iframe Sandbox

```html
sandbox="allow-same-origin allow-scripts allow-downloads"
```

**Permissions Granted**:
- `allow-same-origin`: Allows PDF from same origin to access browser features
- `allow-scripts`: Allows PDF.js or browser PDF viewer to run JavaScript
- `allow-downloads`: Allows user to download PDF from browser viewer

**Permissions Denied** (implicit):
- `allow-forms`: Forms in PDF cannot submit
- `allow-modals`: PDF cannot open dialogs
- `allow-popups`: PDF cannot open new windows
- `allow-top-navigation`: PDF cannot navigate parent page

### Content Security Policy

Ensure CSP allows iframe sources:

```http
Content-Security-Policy: frame-src 'self' https://*.sharepoint.com
```

### CORS Considerations

- **Same-origin files**: Work without CORS
- **Cross-origin files** (e.g., SharePoint): Must have `Access-Control-Allow-Origin` header
- **PDF in iframe**: Browser handles CORS automatically
- **Text fetch**: Requires CORS headers for cross-origin

---

## Performance Considerations

### PDF Optimization

- Browser handles PDF rendering (no JavaScript bundle impact)
- Lazy render: Only loads when modal opens
- Timeout: Cancel load after 10 seconds to prevent hanging

### Text File Optimization

- **Small files (<100KB)**: Fetch and display entire content
- **Large files (>100KB)**: Consider streaming or pagination (future enhancement)
- **Syntax highlighting**: Defer to future enhancement (add Prism.js or highlight.js)

---

## Future Enhancements

### Syntax Highlighting for Code Files

```javascript
import Prism from 'prismjs';

useEffect(() => {
  if (textContent && file.name.match(/\.(js|jsx|ts|tsx|py|java|css)$/)) {
    Prism.highlightAll();
  }
}, [textContent]);
```

### CSV Table Rendering

- Parse CSV with `papaparse` library
- Render as MUI DataGrid or Table
- Add column sorting and filtering

### PDF.js Integration (Fallback)

```javascript
import { Document, Page } from 'react-pdf';

// Use if browser native PDF viewer fails
<Document
  file={file.url}
  onLoadSuccess={({ numPages }) => setNumPages(numPages)}
>
  <Page pageNumber={pageNumber} />
</Document>
```

---

## Testing Checklist

### Unit Tests

- [ ] Renders PDF iframe with correct src
- [ ] Calls `onLoad` when PDF loads successfully
- [ ] Calls `onError` when PDF fails to load
- [ ] Fetches text content for TXT files
- [ ] Calls `onLoad` when text loads successfully
- [ ] Calls `onError` when text fetch fails
- [ ] Shows loading state while fetching
- [ ] Shows error state on fetch failure
- [ ] Applies `wrapText` prop correctly
- [ ] Applies `fontSize` prop correctly

### Integration Tests

- [ ] Works correctly within FilePreviewModal
- [ ] PDF toolbar visibility controlled by `showToolbar`
- [ ] Text content scrollable when long
- [ ] Retry button works on fetch failure

### Manual Testing

- [ ] PDFs display with browser native viewer
- [ ] PDF scrolling works smoothly
- [ ] Text files render with correct formatting
- [ ] Long text files scroll smoothly
- [ ] CSV files display as readable text
- [ ] Word wrap works correctly for long lines
- [ ] Font size changes apply immediately
- [ ] Download button works when preview fails
- [ ] Works with SharePoint PDF URLs
- [ ] Works with local file URLs
- [ ] Mobile: PDFs and text scale appropriately

---

**Version**: 1.0.0
**Last Updated**: 2025-12-23
**Status**: Ready for implementation
