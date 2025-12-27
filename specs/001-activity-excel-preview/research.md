# Research: Technology Decisions for Excel Preview

**Feature**: Activity Excel File Preview
**Date**: 2025-12-25
**Status**: Completed

## Overview

This document captures research findings and technology decisions for implementing Excel file preview in the CRM system. The primary unknowns were: Excel parsing library selection, caching strategy, and rendering approach for large files.

---

## Decision 1: Excel Parsing Library (Frontend)

### Options Evaluated

| Library | Pros | Cons | Decision |
|---------|------|------|----------|
| **SheetJS (xlsx)** | ✅ Most popular (36k+ stars)<br>✅ Supports both .xlsx and .xls<br>✅ Client-side parsing (no server load)<br>✅ Active maintenance<br>✅ MIT license<br>✅ Comprehensive API | ⚠️ Large bundle size (~600KB minified)<br>⚠️ Formula evaluation requires pro version | **SELECTED** |
| **ExcelJS** | ✅ Modern API<br>✅ Good TypeScript support<br>✅ Smaller bundle (~400KB) | ❌ No .xls support (only .xlsx)<br>❌ Slower parsing than SheetJS<br>❌ Less battle-tested | Rejected |
| **jExcel/jSpreadsheet** | ✅ Built-in spreadsheet UI component<br>✅ Interactive grid | ❌ Heavier (~1MB+)<br>❌ Overkill for read-only preview<br>❌ License restrictions | Rejected |
| **Handsontable** | ✅ Professional grid component<br>✅ Excel-like UI | ❌ Commercial license required<br>❌ Very heavy (~2MB+)<br>❌ Designed for editing | Rejected |
| **Server-side parsing (EPPlus, ClosedXML)** | ✅ Reduces frontend bundle<br>✅ Centralized caching | ❌ Increases server load<br>❌ Adds latency<br>❌ Complexity for WebSocket streaming | Rejected (future option) |

### Selected: SheetJS (xlsx) v0.18.5+

**Installation**:
```bash
npm install xlsx
```

**Rationale**:
- Industry standard for client-side Excel parsing
- Handles both .xlsx (Office Open XML) and .xls (Excel 97-2003) formats
- Proven performance with large files (millions of cells)
- MIT license compatible with commercial use
- Can lazy-load to mitigate bundle size impact
- Community support and extensive documentation

**Key API Usage**:
```javascript
import * as XLSX from 'xlsx';

// Parse ArrayBuffer from API
const workbook = XLSX.read(arrayBuffer, { type: 'array' });

// Get sheet names
const sheetNames = workbook.SheetNames;

// Convert sheet to JSON (for rendering)
const worksheet = workbook.Sheets[sheetNames[0]];
const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

// Get cell formatting (limited in free version)
const cellStyle = worksheet['A1'].s;
```

**Performance Considerations**:
- Use Web Workers for parsing files >5MB (prevents UI blocking)
- Lazy load library with React.lazy() for code splitting
- Cache parsed workbook data in component state (avoid re-parsing on sheet switch)

**Limitations**:
- Charts, pivot tables, macros not rendered (display notification)
- Complex formulas shown as values (not evaluated in free version)
- Cell formatting partially supported (colors, bold, italic work; advanced formatting may not)

---

## Decision 2: Caching Strategy

### Options Evaluated

| Approach | Pros | Cons | Decision |
|----------|------|------|----------|
| **Server-side MemoryCache (.NET)** | ✅ Shared across all users<br>✅ Reduces API calls<br>✅ Built-in to .NET<br>✅ LRU eviction | ⚠️ Memory usage on server<br>⚠️ Requires cache invalidation logic | **SELECTED** |
| **Client-side localStorage** | ✅ No server impact<br>✅ Survives page refresh | ❌ Only benefits single user<br>❌ 5-10MB storage limit<br>❌ Not suitable for 20MB files | Rejected |
| **Redis** | ✅ Distributed cache<br>✅ Persistence options | ❌ Infrastructure overhead<br>❌ Overkill for MVP<br>❌ Additional deployment complexity | Future enhancement |
| **No caching** | ✅ Simplest implementation | ❌ Poor performance for repeat access<br>❌ Wastes SharePoint API quota<br>❌ Violates NFR-007 requirement | Rejected |

### Selected: .NET MemoryCache with 15-minute TTL

**Implementation**:
```csharp
using Microsoft.Extensions.Caching.Memory;

// In Program.cs
builder.Services.AddMemoryCache(options =>
{
    options.SizeLimit = 100 * 1024 * 1024; // 100MB max cache size
    options.CompactionPercentage = 0.25; // Evict 25% when full
});

// In ExcelPreviewCacheMiddleware.cs
public class ExcelPreviewCacheMiddleware
{
    private readonly IMemoryCache _cache;

    public async Task InvokeAsync(HttpContext context)
    {
        var cacheKey = $"excel_preview_{idRef}_{userId}"; // Include userId for permission isolation

        if (_cache.TryGetValue(cacheKey, out byte[] cachedContent))
        {
            // Cache hit - serve from memory
            await ServeFromCache(context, cachedContent);
            return;
        }

        // Cache miss - fetch from SharePoint and cache
        var content = await _fileRetrievalService.GetFileContentAsync(idRef);

        var cacheOptions = new MemoryCacheEntryOptions()
            .SetSize(content.Length) // Track size for SizeLimit
            .SetSlidingExpiration(TimeSpan.FromMinutes(15)) // FR-017 requirement
            .RegisterPostEvictionCallback((key, value, reason, state) =>
            {
                _logger.LogInformation("Cache evicted: {Key}, Reason: {Reason}", key, reason);
            });

        _cache.Set(cacheKey, content, cacheOptions);
        await ServeContent(context, content);
    }
}
```

**Rationale**:
- Simple to implement with built-in .NET library
- Sliding expiration (15 minutes) meets FR-017 requirement
- Size-based eviction prevents memory exhaustion
- Per-user cache keys ensure permission isolation (NFR-012)
- Logging captures cache hits/misses for monitoring (NFR-001)

**Cache Key Design**:
```
excel_preview_{idRef}_{userId}
```
- `idRef`: SharePoint file identifier (ensures different files cached separately)
- `userId`: User identifier (ensures permissions respected - NFR-012)

**Security Consideration**:
If user loses access to activity, their cached entry remains for up to 15 minutes. This is acceptable tradeoff vs. checking permissions on every cache hit. For higher security, add permission check on cache retrieval.

---

## Decision 3: Rendering Approach for Large Files

### Challenge

Rendering 20MB Excel files with 100,000+ rows can freeze the browser UI. Need strategy for partial rendering.

### Options Evaluated

| Approach | Pros | Cons | Decision |
|----------|------|------|----------|
| **Row Virtualization (react-window)** | ✅ Renders only visible rows<br>✅ Smooth scrolling<br>✅ Industry standard | ⚠️ Adds dependency<br>⚠️ Complex integration | **SELECTED** |
| **Pagination (show 100 rows/page)** | ✅ Simple implementation<br>✅ No virtualization library | ❌ Poor UX (hard to scan data)<br>❌ Extra navigation controls | Rejected |
| **Truncate to 10,000 rows (FR-010)** | ✅ Prevents performance issues<br>✅ Required by spec | ⚠️ Must combine with another method | **USED WITH** virtualization |
| **Lazy parse (parse on scroll)** | ✅ Faster initial load | ❌ Complex caching logic<br>❌ SheetJS doesn't support streaming | Rejected |

### Selected: Row Virtualization + 10,000 Row Cap

**Dependencies**:
```bash
npm install react-window
npm install react-window-infinite-loader  # For dynamic loading if needed
```

**Implementation Pattern**:
```jsx
import { FixedSizeList as List } from 'react-window';

function ExcelPreview({ workbook }) {
  const [currentSheet, setCurrentSheet] = useState(0);
  const sheetData = useMemo(() => {
    const worksheet = workbook.Sheets[workbook.SheetNames[currentSheet]];
    let data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    // FR-010: Limit to 10,000 rows for files exceeding this
    if (data.length > 10000) {
      data = data.slice(0, 10000);
      setShowTruncationWarning(true);
    }

    return data;
  }, [workbook, currentSheet]);

  const Row = ({ index, style }) => (
    <div style={style} className="excel-row">
      {sheetData[index].map((cell, colIndex) => (
        <div key={colIndex} className="excel-cell">{cell}</div>
      ))}
    </div>
  );

  return (
    <div>
      <SheetTabs sheets={workbook.SheetNames} current={currentSheet} onChange={setCurrentSheet} />
      {showTruncationWarning && (
        <Alert severity="warning">
          Showing first 10,000 rows. Download the file to view all content.
        </Alert>
      )}
      <List
        height={600}
        itemCount={sheetData.length}
        itemSize={35}
        width="100%"
      >
        {Row}
      </List>
    </div>
  );
}
```

**Rationale**:
- react-window is lightweight (11KB gzipped) and battle-tested
- Handles 10,000+ rows smoothly (only renders visible ~20 rows)
- Combine with 10,000 row cap for extreme files (FR-010)
- Prevents memory issues on mobile devices

**Alternative for Column Virtualization**:
If files have 100+ columns, also use `react-window-grid` or `react-virtualized-auto-sizer` for 2D virtualization. Start with row-only for MVP.

---

## Decision 4: Mobile/Touch Optimization

### Requirements
- Full responsive support (FR-018)
- Touch gestures (FR-019)
- Modal adapts to screen size (NFR-015)

### Selected Approach

**Material-UI Responsive Modal**:
```jsx
import { useMediaQuery, useTheme } from '@mui/material';

function FilePreviewModal({ open, onClose, file }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={isMobile}  // Full screen on mobile
      maxWidth="lg"           // Large modal on desktop
      fullWidth
    >
      {/* Content */}
    </Dialog>
  );
}
```

**Touch Gestures** (react-use-gesture):
```bash
npm install @use-gesture/react
```

```jsx
import { useGesture } from '@use-gesture/react';

function ExcelPreview() {
  const bind = useGesture({
    onPinch: ({ offset: [scale] }) => {
      // Pinch-to-zoom on mobile
      setZoom(Math.max(0.5, Math.min(2, scale)));
    },
    onDrag: ({ offset: [x, y] }) => {
      // Pan when zoomed
      if (zoom > 1) {
        setPan({ x, y });
      }
    }
  });

  return <div {...bind()}>{ /* Excel grid */ }</div>;
}
```

**Alternative**: Use native CSS touch-action and overflow-scroll for simpler approach without gestures library.

**Decision**: Start with native CSS scrolling. Add gesture library only if user testing shows need.

---

## Decision 5: Error Handling & Unsupported Features

### Approach

**Detection Strategy**:
```javascript
function analyzeWorkbook(workbook) {
  const warnings = [];

  workbook.SheetNames.forEach(sheetName => {
    const worksheet = workbook.Sheets[sheetName];

    // Check for charts (stored in workbook.Sheets[sheetName]['!charts'])
    if (worksheet['!charts'] && worksheet['!charts'].length > 0) {
      warnings.push('Charts are not supported in preview. Download the file to view all content.');
    }

    // Check for macros (workbook.vbaProject exists)
    if (workbook.vbaProject) {
      warnings.push('This file contains macros that will not execute in preview mode.');
    }

    // Check for pivot tables
    if (worksheet['!pivots']) {
      warnings.push('Pivot tables are not fully supported in preview.');
    }

    // Check for external links (workbook.Workbook.ExternalReferences)
    if (workbook.Workbook?.ExternalReferences) {
      warnings.push('External links may not display correctly.');
    }
  });

  return warnings;
}
```

**Error Boundary**:
```jsx
class ExcelPreviewErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log to Serilog via API (NFR-002)
    logPreviewError({
      idRef: this.props.idRef,
      error: error.message,
      stack: error.stack
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert severity="error">
          Unable to preview this file. The file may be corrupted or password-protected.
          Try downloading it instead.
          <Button onClick={() => downloadFile(this.props.idRef)}>Download</Button>
        </Alert>
      );
    }
    return this.props.children;
  }
}
```

**File Validation** (before parsing):
```javascript
async function validateExcelFile(arrayBuffer, fileName) {
  // Check file size (FR-009)
  const fileSizeBytes = arrayBuffer.byteLength;
  const fileSizeMB = fileSizeBytes / (1024 * 1024);

  if (fileSizeMB > 20) {
    throw new Error('FILE_TOO_LARGE');
  }

  // Check file signature (magic bytes)
  const uint8Array = new Uint8Array(arrayBuffer);
  const header = uint8Array.slice(0, 4);

  // .xlsx files start with PK (ZIP format): 50 4B 03 04
  // .xls files start with: D0 CF 11 E0 (OLE2 format)
  const isXlsx = header[0] === 0x50 && header[1] === 0x4B;
  const isXls = header[0] === 0xD0 && header[1] === 0xCF;

  if (!isXlsx && !isXls) {
    throw new Error('INVALID_EXCEL_FORMAT');
  }

  return { valid: true, format: isXlsx ? 'xlsx' : 'xls' };
}
```

---

## Best Practices Research

### 1. SheetJS Performance Best Practices

**Source**: [SheetJS Documentation - Performance](https://docs.sheetjs.com/docs/miscellany/performance)

**Key Findings**:
- Use `{ type: 'array' }` when parsing ArrayBuffer (fastest)
- Avoid `sheet_to_html()` for large sheets (slow DOM manipulation)
- Use `sheet_to_json()` with `{ header: 1 }` for raw array format
- For large files, parse in Web Worker to prevent UI blocking
- Cache parsed workbook object (don't re-parse on sheet switch)

**Example Web Worker**:
```javascript
// excelWorker.js
import * as XLSX from 'xlsx';

self.addEventListener('message', (e) => {
  const { arrayBuffer } = e.data;
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  const parsedData = workbook.SheetNames.map(sheetName => ({
    name: sheetName,
    data: XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 })
  }));

  self.postMessage({ workbook: parsedData });
});
```

### 2. Material-UI Modal Best Practices

**Source**: [MUI Dialog Documentation](https://mui.com/material-ui/react-dialog/)

**Key Findings**:
- Always use `aria-labelledby` for accessibility
- Use `fullScreen` prop for mobile (detected via `useMediaQuery`)
- Add `TransitionComponent` for smooth open/close animations
- Use `disableEscapeKeyDown` if you want to force user to close via button
- Enable `disableScrollLock` if modal has its own scrolling area

**Example**:
```jsx
<Dialog
  open={open}
  onClose={onClose}
  maxWidth="lg"
  fullWidth
  fullScreen={isMobile}
  aria-labelledby="excel-preview-title"
  TransitionComponent={Fade}
  disableScrollLock  // Prevent body scroll lock (Excel preview has own scroll)
>
  <DialogTitle id="excel-preview-title">
    {fileName}
  </DialogTitle>
  <DialogContent>
    {/* Excel grid */}
  </DialogContent>
  <DialogActions>
    <Button onClick={downloadFile}>Download</Button>
    <Button onClick={onClose}>Close</Button>
  </DialogActions>
</Dialog>
```

### 3. .NET MemoryCache Best Practices

**Source**: [Microsoft Docs - MemoryCache](https://learn.microsoft.com/en-us/aspnet/core/performance/caching/memory)

**Key Findings**:
- Always set `SizeLimit` to prevent unbounded memory growth
- Use `SetSize()` on each cache entry to track memory usage
- Prefer `SlidingExpiration` over `AbsoluteExpiration` for frequently accessed items
- Use `PostEvictionCallback` for logging and cleanup
- Consider `CompactionPercentage` for aggressive eviction under memory pressure

**Production Monitoring**:
```csharp
// Add cache statistics endpoint
app.MapGet("/api/admin/cache-stats", (IMemoryCache cache) =>
{
    // Reflection to access internal stats (not ideal, but useful for debugging)
    var stats = new
    {
        CurrentSize = cache.Count,
        SizeLimit = cache.GetType().GetProperty("SizeLimit")?.GetValue(cache),
        CacheHitRate = CalculateHitRate() // Implement custom tracking
    };
    return Results.Ok(stats);
});
```

### 4. React Performance for Large Data Grids

**Source**: [React Virtualization Guide](https://react.dev/learn/render-lists#virtualizing-long-lists)

**Key Findings**:
- Always use `useMemo` to cache computed data (e.g., sheet transformation)
- Use `useCallback` for event handlers passed to virtualized rows
- Avoid inline functions in `style` prop (causes re-renders)
- Set explicit `key` prop for rows (use row index)
- Measure actual performance with React DevTools Profiler

**Example**:
```jsx
const ExcelPreview = ({ workbook }) => {
  // ✅ Memoize sheet data to prevent re-parsing
  const sheetData = useMemo(() => {
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  }, [workbook]);

  // ✅ Memoize row renderer
  const Row = useCallback(({ index, style }) => (
    <div style={style} key={index}>
      {sheetData[index].map((cell, i) => (
        <span key={i}>{cell}</span>
      ))}
    </div>
  ), [sheetData]);

  return <List itemCount={sheetData.length} itemSize={35}>{Row}</List>;
};
```

---

## Alternatives Considered and Rejected

### Backend-Heavy Approach

**Rejected**: Parsing Excel on backend (.NET) with EPPlus/ClosedXML, returning JSON to frontend

**Why Rejected**:
- Increases server CPU load (every preview = backend parsing)
- Adds network latency (large JSON response for big files)
- Complicates caching (need to serialize/deserialize parsed data)
- Doesn't leverage modern browser capabilities
- SheetJS client-side parsing is proven and performant

**When to Reconsider**:
- If mobile devices show performance issues with 20MB files
- If security team requires server-side parsing for scanning
- If we add features like server-side formula calculation

### Embedded Excel Viewer (Office Online)

**Rejected**: Using Microsoft Office Online embed for Excel preview

**Why Rejected**:
- Requires Azure AD integration with OneDrive/SharePoint
- Poor customization options (can't control UI)
- Unreliable for non-Microsoft file storage
- Dependency on external service (SLA concerns)
- Complex authentication flow

**When to Reconsider**:
- If full Excel fidelity (charts, macros, formatting) becomes requirement
- If editing capability is added to roadmap

---

## Summary of Technology Decisions

| Component | Technology | Version | Rationale |
|-----------|-----------|---------|-----------|
| **Excel Parsing** | SheetJS (xlsx) | 0.18.5+ | Industry standard, supports .xlsx and .xls, MIT license |
| **Caching** | .NET MemoryCache | Built-in | Simple, built-in, size-based eviction, per-user isolation |
| **Virtualization** | react-window | 1.8.10+ | Lightweight (11KB), handles 10,000+ rows smoothly |
| **Modal** | Material-UI Dialog | 7.3.2 | Already in use, responsive, accessible |
| **Touch Gestures** | Native CSS (MVP) | N/A | Start simple, add @use-gesture/react if needed |
| **Error Handling** | React Error Boundary | Built-in | Standard pattern, integrates with logging |

---

## Next Steps (Phase 1)

1. ✅ **research.md complete** - Technology decisions finalized
2. ⏭️ **data-model.md** - Define cache entry structure, Excel preview data model
3. ⏭️ **contracts/** - Document `/api/files/{idRef}/content` response format
4. ⏭️ **quickstart.md** - Developer setup instructions, testing guide

---

**Research Completed**: 2025-12-25
**Ready for Phase 1**: YES
