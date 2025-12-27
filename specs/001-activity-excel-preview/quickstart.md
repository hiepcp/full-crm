# Quickstart Guide: Excel File Preview Development

**Feature**: Activity Excel File Preview
**For**: Developers implementing or testing the Excel preview feature
**Last Updated**: 2025-12-25

---

## Prerequisites

Before starting development, ensure you have:

### Environment Setup (Already configured)
- ✅ Node.js 18+ and npm 9+
- ✅ .NET 8 SDK
- ✅ MySQL database running
- ✅ HTTPS certificates (mkcert) for local domains
- ✅ Hosts file configured (`crm.local.com`, `api-crm.local.com`)
- ✅ Environment variables in `.env` file

### Access Requirements
- ✅ SharePoint test environment with sample Excel files
- ✅ Valid user account with activity access permissions
- ✅ API key for backend authentication

---

## Quick Start (5 Minutes)

### 1. Install Dependencies

**Frontend**:
```bash
cd crm-system-client
npm install xlsx react-window
```

**Backend** (optional - cache middleware):
```bash
cd crm-system/src/CRM.Api
# No new packages needed - uses built-in MemoryCache
dotnet restore
```

### 2. Run Development Servers

**Terminal 1 - Frontend**:
```bash
cd crm-system-client
npm run dev
# Runs on https://crm.local.com:3000
```

**Terminal 2 - Backend**:
```bash
cd crm-system/src/CRM.Api
dotnet run
# Runs on https://api-crm.local.com
```

### 3. Test Excel Preview

1. Navigate to https://crm.local.com:3000
2. Log in with test credentials
3. Go to any Activity detail page
4. Click "Attachments" tab
5. Upload a test Excel file (.xlsx or .xls)
6. Click the preview icon (👁️ eye icon)
7. Modal should open showing Excel spreadsheet

**Expected Result**: Excel content displays in modal with sheet tabs, scrollable grid, and download button.

---

## Development Workflow

### File Structure Overview

```
crm-system-client/src/
├── presentation/components/common/FilePreviewer/
│   ├── FilePreviewModal.jsx           # MODIFY: Route Excel files
│   ├── DocumentPreview.jsx            # MODIFY: Add Excel case
│   └── ExcelPreview.jsx               # CREATE: New component
├── utils/
│   └── fileUtils.js                   # MODIFY: Add EXCEL category
└── infrastructure/api/
    └── filesApi.js                    # USE: getFileContent()

crm-system/src/CRM.Api/
├── Controllers/
│   └── FilesController.cs             # USE: Existing /content endpoint
├── Middleware/
│   └── ExcelPreviewCacheMiddleware.cs # CREATE: Cache layer
└── Program.cs                         # MODIFY: Register middleware
```

### Step-by-Step Implementation

#### Step 1: Update File Utilities

**File**: `crm-system-client/src/utils/fileUtils.js`

```javascript
// Add EXCEL category
export const FileCategory = {
  IMAGE: 'IMAGE',
  PDF: 'PDF',
  TEXT: 'TEXT',
  EXCEL: 'EXCEL',  // ADD THIS
  UNSUPPORTED: 'UNSUPPORTED'
};

// Add Excel extensions
export const FILE_EXTENSIONS = {
  // ... existing extensions
  xlsx: FileCategory.EXCEL,
  xls: FileCategory.EXCEL,
  xlsm: FileCategory.EXCEL,
};

// Update MIME types
export const MIME_TYPES = {
  // ... existing MIME types
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': FileCategory.EXCEL,
  'application/vnd.ms-excel': FileCategory.EXCEL,
};

// Update size check for Excel files
export function shouldSkipPreview(fileSizeBytes, category) {
  const fileSizeMB = fileSizeBytes / (1024 * 1024);

  if (category === FileCategory.EXCEL) {
    return fileSizeMB > 20; // FR-009: 20MB limit for Excel
  }

  return fileSizeMB > 50; // Existing limit
}
```

#### Step 2: Create ExcelPreview Component

**File**: `crm-system-client/src/presentation/components/common/FilePreviewer/ExcelPreview.jsx`

```jsx
import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { FixedSizeList as List } from 'react-window';
import { Box, Tabs, Tab, Alert, CircularProgress, IconButton } from '@mui/material';
import { Download as DownloadIcon, Warning as WarningIcon } from '@mui/icons-material';
import { filesApi } from '@/infrastructure/api/filesApi';

const ExcelPreview = ({ file, onDownload, onError }) => {
  const [workbook, setWorkbook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSheetIndex, setCurrentSheetIndex] = useState(0);
  const [warnings, setWarnings] = useState([]);

  // Load Excel file
  useEffect(() => {
    loadExcelFile();
  }, [file.idRef]);

  const loadExcelFile = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch binary content
      const arrayBuffer = await filesApi.getFileContent(file.idRef);

      // Validate size (FR-009)
      const fileSizeMB = arrayBuffer.byteLength / (1024 * 1024);
      if (fileSizeMB > 20) {
        throw new Error('File size exceeds 20MB limit');
      }

      // Parse with SheetJS
      const wb = XLSX.read(arrayBuffer, { type: 'array' });
      setWorkbook(wb);

      // Detect unsupported features
      detectUnsupportedFeatures(wb);

      setLoading(false);
    } catch (err) {
      console.error('Excel preview error:', err);
      setError(err.message);
      setLoading(false);
      onError?.(err);
    }
  };

  const detectUnsupportedFeatures = (wb) => {
    const detected = [];
    if (wb.vbaProject) {
      detected.push('This file contains macros that will not execute in preview mode.');
    }
    // Add more detection as needed
    setWarnings(detected);
  };

  // Parse current sheet data
  const sheetData = useMemo(() => {
    if (!workbook) return [];

    const sheetName = workbook.SheetNames[currentSheetIndex];
    const worksheet = workbook.Sheets[sheetName];
    let data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    // FR-010: Limit to 10,000 rows
    if (data.length > 10000) {
      data = data.slice(0, 10000);
      if (!warnings.includes('Showing first 10,000 rows')) {
        setWarnings([...warnings, 'Showing first 10,000 rows. Download the file to view all content.']);
      }
    }

    return data;
  }, [workbook, currentSheetIndex]);

  // Row renderer for virtualization
  const Row = ({ index, style }) => (
    <Box style={style} display="flex" borderBottom="1px solid #e0e0e0">
      {sheetData[index]?.map((cell, colIndex) => (
        <Box
          key={colIndex}
          px={1}
          py={0.5}
          minWidth="100px"
          maxWidth="300px"
          overflow="hidden"
          textOverflow="ellipsis"
          whiteSpace="nowrap"
          borderRight="1px solid #f0f0f0"
        >
          {cell}
        </Box>
      ))}
    </Box>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Unable to preview this file. The file may be corrupted or password-protected.
        <IconButton onClick={onDownload} size="small">
          <DownloadIcon /> Download
        </IconButton>
      </Alert>
    );
  }

  return (
    <Box>
      {/* Warnings */}
      {warnings.length > 0 && (
        <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 2 }}>
          {warnings.map((warning, idx) => (
            <div key={idx}>{warning}</div>
          ))}
        </Alert>
      )}

      {/* Sheet tabs */}
      <Tabs value={currentSheetIndex} onChange={(e, newValue) => setCurrentSheetIndex(newValue)}>
        {workbook?.SheetNames.map((name, idx) => (
          <Tab key={idx} label={name} />
        ))}
      </Tabs>

      {/* Virtualized grid */}
      <Box mt={2} border="1px solid #e0e0e0" borderRadius={1}>
        <List
          height={500}
          itemCount={sheetData.length}
          itemSize={40}
          width="100%"
        >
          {Row}
        </List>
      </Box>
    </Box>
  );
};

export default ExcelPreview;
```

#### Step 3: Integrate into FilePreviewModal

**File**: `crm-system-client/src/presentation/components/common/FilePreviewer/FilePreviewModal.jsx`

```jsx
import ExcelPreview from './ExcelPreview';
import { FileCategory, getFileCategory } from '@/utils/fileUtils';

// Inside FilePreviewModal component
const renderPreview = () => {
  const category = getFileCategory(currentFile.fileName, currentFile.mimeType);

  switch (category) {
    case FileCategory.IMAGE:
      return <ImagePreview file={currentFile} resolvedUrl={resolvedUrl} />;
    case FileCategory.PDF:
      return <DocumentPreview file={currentFile} />;
    case FileCategory.TEXT:
      return <DocumentPreview file={currentFile} />;
    case FileCategory.EXCEL:  // ADD THIS
      return <ExcelPreview file={currentFile} onDownload={handleDownload} onError={handleError} />;
    default:
      return <Alert severity="info">Preview not supported for this file type.</Alert>;
  }
};
```

#### Step 4: Backend Cache Middleware (Optional for MVP)

**File**: `crm-system/src/CRM.Api/Middleware/ExcelPreviewCacheMiddleware.cs`

```csharp
using Microsoft.Extensions.Caching.Memory;

public class ExcelPreviewCacheMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IMemoryCache _cache;
    private readonly ILogger<ExcelPreviewCacheMiddleware> _logger;

    public ExcelPreviewCacheMiddleware(RequestDelegate next, IMemoryCache cache, ILogger<ExcelPreviewCacheMiddleware> logger)
    {
        _next = next;
        _cache = cache;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Only cache for /content endpoint
        if (!context.Request.Path.Value.Contains("/content"))
        {
            await _next(context);
            return;
        }

        var idRef = context.Request.RouteValues["idRef"]?.ToString();
        var userId = context.User.FindFirst("sub")?.Value; // Get user ID from JWT

        var cacheKey = $"excel_preview_{idRef}_{userId}";

        // Check cache
        if (_cache.TryGetValue(cacheKey, out byte[] cachedContent))
        {
            _logger.LogInformation("Cache HIT for IdRef={IdRef}, User={UserId}", idRef, userId);
            context.Response.Headers.Add("X-Cache-Hit", "true");
            await context.Response.Body.WriteAsync(cachedContent);
            return;
        }

        _logger.LogInformation("Cache MISS for IdRef={IdRef}, User={UserId}", idRef, userId);
        context.Response.Headers.Add("X-Cache-Hit", "false");

        // Call next middleware (FilesController)
        await _next(context);

        // TODO: Capture response and cache it (requires response buffering)
    }
}
```

**Register in Program.cs**:
```csharp
// In Program.cs, before app.UseAuthentication()
app.UseMiddleware<ExcelPreviewCacheMiddleware>();
```

---

## Testing Guide

### Manual Testing Checklist

#### ✅ Basic Functionality
- [ ] Small Excel file (\u003c1MB) previews successfully
- [ ] Multi-sheet workbook shows all sheet tabs
- [ ] Sheet navigation works (clicking different tabs)
- [ ] Grid is scrollable vertically
- [ ] Download button works from preview modal
- [ ] Close button closes modal

#### ✅ File Size Limits (FR-009, FR-010)
- [ ] File >20MB shows error message (refuse preview)
- [ ] File with >10,000 rows shows truncation warning
- [ ] File 10MB-20MB loads with partial preview

#### ✅ Format Support (FR-015)
- [ ] .xlsx files (Office Open XML) preview correctly
- [ ] .xls files (Excel 97-2003) preview correctly
- [ ] .xlsm files (macro-enabled) show macro warning
- [ ] Non-Excel files (.pdf, .docx) don't use Excel preview

#### ✅ Error Handling (FR-008)
- [ ] Corrupted Excel file shows error message
- [ ] Password-protected file shows appropriate error
- [ ] Network error shows retry/download option
- [ ] Missing file (404) shows clear error

#### ✅ Unsupported Features (FR-011)
- [ ] File with charts shows warning message
- [ ] File with macros shows warning message
- [ ] File with pivot tables shows warning (if detected)
- [ ] File with formulas shows values or syntax

#### ✅ Mobile/Touch (FR-018, FR-019)
- [ ] Modal is full-screen on mobile devices
- [ ] Grid is scrollable with touch gestures
- [ ] Sheet tabs are tappable with finger
- [ ] Download button remains accessible

#### ✅ Performance (NFR-004, NFR-005, NFR-006)
- [ ] Small file (\u003c5MB) previews in \u003c3 seconds
- [ ] Large file (10-20MB) previews in \u003c5 seconds
- [ ] Sheet navigation responds in \u003c1 second
- [ ] Second preview of same file faster (cache hit)

#### ✅ Security (NFR-009, NFR-010, NFR-011)
- [ ] User without activity access cannot preview file (403)
- [ ] File content not logged in browser console
- [ ] Preview works over HTTPS only

### Sample Test Files

**Location**: `crm-system-client/test-files/excel/`

Create or download these test files:

1. **small-report.xlsx** (100KB, 100 rows, 1 sheet)
   - Simple sales report with headers and numbers
   - Tests basic preview functionality

2. **multi-sheet-budget.xlsx** (500KB, 3 sheets)
   - Budget with Income, Expenses, Summary sheets
   - Tests sheet navigation

3. **large-dataset.xlsx** (10MB, 15,000 rows, 10 columns)
   - Large customer list or transaction log
   - Tests truncation warning and partial preview

4. **formulas.xlsx** (200KB, contains SUM/AVERAGE formulas)
   - Tests formula value display

5. **charts.xlsx** (1MB, contains embedded charts)
   - Tests unsupported feature warning

6. **password-protected.xlsx** (encrypted with password)
   - Tests password-protected error handling

7. **corrupted.xlsx** (intentionally broken file)
   - Rename a .txt file to .xlsx
   - Tests corruption error handling

8. **macro-enabled.xlsm** (contains VBA macros)
   - Tests macro warning message

### Automated Testing (Optional)

**Unit Tests** (Frontend):
```javascript
// fileUtils.test.js
import { getFileCategory, shouldSkipPreview, FileCategory } from './fileUtils';

test('identifies Excel files correctly', () => {
  expect(getFileCategory('report.xlsx')).toBe(FileCategory.EXCEL);
  expect(getFileCategory('data.xls')).toBe(FileCategory.EXCEL);
  expect(getFileCategory('doc.pdf')).not.toBe(FileCategory.EXCEL);
});

test('enforces 20MB size limit for Excel', () => {
  const size20MB = 20 * 1024 * 1024;
  const size21MB = 21 * 1024 * 1024;

  expect(shouldSkipPreview(size20MB, FileCategory.EXCEL)).toBe(false);
  expect(shouldSkipPreview(size21MB, FileCategory.EXCEL)).toBe(true);
});
```

**Integration Tests** (Backend):
```csharp
// ExcelPreviewCacheTests.cs
[Fact]
public async Task CacheMiddleware_CachesExcelFiles()
{
    // Arrange
    var idRef = "test-excel-file";
    var userId = 123;

    // Act
    var response1 = await GetFileContent(idRef, userId);
    var response2 = await GetFileContent(idRef, userId);

    // Assert
    Assert.False(response1.Headers.Contains("X-Cache-Hit"));
    Assert.True(response2.Headers.GetValues("X-Cache-Hit").First() == "true");
}

[Fact]
public async Task FilesController_RejectsFilesOver20MB()
{
    // Arrange
    var largeFileIdRef = "test-25mb-excel";

    // Act
    var response = await GetFileContent(largeFileIdRef, 123);

    // Assert
    Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
}
```

---

## Troubleshooting

### Problem: "Excel file not parsing"

**Symptoms**: Loading spinner stuck, error message "Unable to preview this file"

**Possible Causes**:
1. File is corrupted or password-protected
2. File size exceeds 20MB (check browser network tab)
3. SheetJS library not loaded (check bundle)

**Solutions**:
```bash
# Verify SheetJS is installed
npm list xlsx

# Reinstall if missing
npm install xlsx

# Check file size on backend
# Add logging in FilesController.cs
_logger.LogInformation("File size: {Size} MB", fileSize / (1024.0 * 1024.0));
```

### Problem: "Cache not working"

**Symptoms**: Every preview takes full 2-3 seconds, no "X-Cache-Hit: true" header

**Solutions**:
1. Check middleware is registered in Program.cs:
   ```csharp
   app.UseMiddleware<ExcelPreviewCacheMiddleware>();
   ```

2. Verify MemoryCache is registered:
   ```csharp
   builder.Services.AddMemoryCache();
   ```

3. Check cache key format matches (userId must be consistent)

4. Monitor cache logs:
   ```bash
   dotnet run | grep "Cache HIT\|Cache MISS"
   ```

### Problem: "Slow performance on mobile"

**Symptoms**: Preview takes >10 seconds on tablets/phones

**Solutions**:
1. Enable Web Worker parsing (for files >5MB):
   ```javascript
   // excelWorker.js
   import * as XLSX from 'xlsx';
   self.addEventListener('message', (e) => {
     const workbook = XLSX.read(e.data, { type: 'array' });
     self.postMessage({ workbook });
   });
   ```

2. Reduce initial render rows:
   ```javascript
   // Limit to first 1000 rows on mobile
   const isMobile = window.innerWidth < 768;
   const maxRows = isMobile ? 1000 : 10000;
   ```

3. Disable animations on modal open (Material-UI):
   ```jsx
   <Dialog TransitionComponent={undefined} disableScrollLock>
   ```

### Problem: "CORS error fetching Excel files"

**Symptoms**: Network error, "CORS policy: No 'Access-Control-Allow-Origin' header"

**Solutions**:
1. Verify frontend origin in backend CORS config:
   ```csharp
   // Program.cs
   app.UseCors("Spa"); // Must allow https://crm.local.com:3000
   ```

2. Check axios is sending credentials:
   ```javascript
   // axiosInstance.js - should already have
   withCredentials: true
   ```

3. Ensure API key header is set:
   ```javascript
   // Should be in axiosInstance defaults
   headers: { 'XApiKey': config.API_KEY }
   ```

---

## Performance Optimization Tips

### Bundle Size Reduction

**SheetJS is large (~600KB)**. Lazy load it:

```javascript
// ExcelPreview.jsx
const ExcelPreview = React.lazy(() => import('./ExcelPreview'));

// In FilePreviewModal.jsx
<Suspense fallback={<CircularProgress />}>
  {category === FileCategory.EXCEL && <ExcelPreview file={file} />}
</Suspense>
```

### Memory Management

**Clear workbook on modal close**:

```javascript
useEffect(() => {
  return () => {
    // Cleanup when modal closes
    setWorkbook(null);
    setSheetData([]);
  };
}, []);
```

### Parsing Optimization

**Cache parsed sheets**:

```javascript
const parsedSheets = useRef(new Map());

const getSheetData = (sheetName) => {
  if (parsedSheets.current.has(sheetName)) {
    return parsedSheets.current.get(sheetName);
  }

  const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
  parsedSheets.current.set(sheetName, data);
  return data;
};
```

---

## Deployment Checklist

Before merging to main branch:

- [ ] All manual tests passed
- [ ] No console errors in browser
- [ ] Excel preview works on Chrome, Firefox, Edge, Safari
- [ ] Mobile responsive layout tested on tablet and phone
- [ ] Backend logs show cache hits/misses correctly
- [ ] Error messages are user-friendly (no stack traces shown)
- [ ] Download button works from preview modal
- [ ] Large files (>10MB) don't crash browser
- [ ] File size limits enforced (20MB hard cap)
- [ ] Code follows project style guide (ESLint passes)
- [ ] No hardcoded values (use constants from fileUtils.js)
- [ ] Git commit messages follow convention

---

## Next Steps After MVP

### Future Enhancements
1. **Backend parsing** - Move SheetJS to server-side (reduce bundle size)
2. **Advanced formatting** - Render cell colors, borders, merged cells
3. **Search functionality** - Find text within Excel sheets
4. **Export to CSV** - Download sheet as CSV from preview
5. **Formula evaluation** - Show calculated values for complex formulas
6. **Chart rendering** - Display embedded charts (with Chart.js)

### Monitoring & Analytics
1. Track preview success rate (NFR-002)
2. Monitor cache hit rate (target >70%)
3. Log slow previews (>5 seconds)
4. Track most-previewed file types

---

## Support & Resources

- **Spec**: [spec.md](./spec.md) - Full feature requirements
- **Research**: [research.md](./research.md) - Technology decisions
- **Data Model**: [data-model.md](./data-model.md) - Cache and data structures
- **API Contract**: [contracts/file-content-api.md](./contracts/file-content-api.md)
- **SheetJS Docs**: https://docs.sheetjs.com/
- **Material-UI Dialog**: https://mui.com/material-ui/react-dialog/
- **react-window**: https://react-window.vercel.app/

**Questions?** Check CLAUDE.md or ask the team!

---

**Last Updated**: 2025-12-25
**Ready for Development**: ✅ YES
