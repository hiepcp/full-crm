# Data Model: Excel Preview Feature

**Feature**: Activity Excel File Preview
**Date**: 2025-12-25
**Status**: Design Phase

## Overview

This document defines the data structures used for Excel file preview, including frontend component state, cache entries, and API response formats. The feature builds on existing file attachment infrastructure.

---

## 1. Existing Database Entities (No Changes)

### Activity Attachment (activity_attachments table)

**Location**: MySQL database

```sql
CREATE TABLE activity_attachments (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  activity_id BIGINT NOT NULL,
  id_ref VARCHAR(500), -- SharePoint file identifier
  file_name VARCHAR(500),
  file_path VARCHAR(1000),
  file_size BIGINT,
  mime_type VARCHAR(200),
  uploaded_by BIGINT,
  uploaded_at DATETIME,
  created_by BIGINT,
  created_at DATETIME,
  updated_by BIGINT,
  updated_at DATETIME,
  is_deleted BOOLEAN DEFAULT FALSE,

  FOREIGN KEY (activity_id) REFERENCES activities(id),
  INDEX idx_activity (activity_id),
  INDEX idx_id_ref (id_ref)
);
```

**Computed Properties** (C# model):
```csharp
public class ActivityAttachment
{
    public long Id { get; set; }
    public long ActivityId { get; set; }
    public string IdRef { get; set; }  // SharePoint identifier
    public string FileName { get; set; }
    public string FilePath { get; set; }
    public long? FileSize { get; set; }
    public string MimeType { get; set; }

    // Computed properties (not in database)
    public string FileExtension => Path.GetExtension(FileName)?.ToLowerInvariant();
    public bool IsImage => _imageExtensions.Contains(FileExtension);
    public bool IsDocument => _documentExtensions.Contains(FileExtension);
    public bool IsExcel => _excelExtensions.Contains(FileExtension);  // NEW
    public string DisplaySize => FormatFileSize(FileSize);
    public string DisplayName => FileName?.Length > 50 ? FileName.Substring(0, 47) + "..." : FileName;

    private static readonly string[] _excelExtensions = { ".xlsx", ".xls" };  // NEW
    private static readonly string[] _imageExtensions = { ".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".bmp" };
    private static readonly string[] _documentExtensions = { ".pdf", ".txt", ".csv", ".docx", ".doc" };
}
```

**No database changes required** - Existing schema supports Excel files via `IdRef` and metadata fields.

---

## 2. Frontend Data Structures

### 2.1 FileCategory Enum (fileUtils.js)

**Location**: `crm-system-client/src/utils/fileUtils.js`

**Modified Enum**:
```javascript
export const FileCategory = {
  IMAGE: 'IMAGE',
  PDF: 'PDF',
  TEXT: 'TEXT',
  EXCEL: 'EXCEL',  // NEW
  WORD: 'WORD',  // Optional future addition
  UNSUPPORTED: 'UNSUPPORTED'
};

export const FILE_EXTENSIONS = {
  // Images
  png: FileCategory.IMAGE,
  jpg: FileCategory.IMAGE,
  jpeg: FileCategory.IMAGE,
  gif: FileCategory.IMAGE,
  svg: FileCategory.IMAGE,
  webp: FileCategory.IMAGE,
  bmp: FileCategory.IMAGE,

  // PDFs
  pdf: FileCategory.PDF,

  // Text files
  txt: FileCategory.TEXT,
  csv: FileCategory.TEXT,
  log: FileCategory.TEXT,
  md: FileCategory.TEXT,
  json: FileCategory.TEXT,
  xml: FileCategory.TEXT,

  // Excel files (NEW)
  xlsx: FileCategory.EXCEL,
  xls: FileCategory.EXCEL,
  xlsm: FileCategory.EXCEL,  // Macro-enabled (preview with warning)
  xlsb: FileCategory.EXCEL,  // Binary format (may not parse)

  // Word files (future)
  docx: FileCategory.WORD,
  doc: FileCategory.WORD
};

export const MIME_TYPES = {
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': FileCategory.EXCEL, // .xlsx
  'application/vnd.ms-excel': FileCategory.EXCEL, // .xls
  'application/vnd.ms-excel.sheet.macroEnabled.12': FileCategory.EXCEL, // .xlsm
  'application/vnd.ms-excel.sheet.binary.macroEnabled.12': FileCategory.EXCEL, // .xlsb
  // ... existing MIME types
};

/**
 * Get file category from filename or MIME type
 * @param {string} fileName - File name with extension
 * @param {string} mimeType - MIME type from server
 * @returns {string} FileCategory enum value
 */
export function getFileCategory(fileName, mimeType) {
  // Try MIME type first (more reliable)
  if (mimeType && MIME_TYPES[mimeType]) {
    return MIME_TYPES[mimeType];
  }

  // Fallback to file extension
  const extension = fileName?.split('.').pop()?.toLowerCase();
  return FILE_EXTENSIONS[extension] || FileCategory.UNSUPPORTED;
}

/**
 * Check if file should skip preview (too large)
 * @param {number} fileSizeBytes - File size in bytes
 * @param {string} category - FileCategory enum value
 * @returns {boolean} True if file is too large to preview
 */
export function shouldSkipPreview(fileSizeBytes, category) {
  const fileSizeMB = fileSizeBytes / (1024 * 1024);

  // Excel-specific limits (FR-009)
  if (category === FileCategory.EXCEL) {
    return fileSizeMB > 20; // 20MB hard limit
  }

  // General limit for other file types
  return fileSizeMB > 50; // Existing 50MB limit
}
```

---

### 2.2 Excel Workbook Model (Component State)

**Location**: `ExcelPreview.jsx` component state

```javascript
/**
 * Parsed Excel workbook state
 */
const ExcelWorkbookState = {
  // Raw SheetJS workbook object (cached after initial parse)
  workbook: {
    SheetNames: ['Sheet1', 'Sheet2'],  // Array of sheet names
    Sheets: {
      'Sheet1': { /* SheetJS worksheet object */ },
      'Sheet2': { /* SheetJS worksheet object */ }
    },
    Props: {
      Title: 'Sales Report Q4',  // Document metadata
      Author: 'John Doe',
      CreatedDate: '2024-01-01',
      ModifiedDate: '2024-12-25'
    },
    Workbook: {
      Views: [{ /* Workbook view settings */ }],
      Sheets: [{ /* Sheet metadata */ }]
    }
  },

  // Parsed sheet data (for rendering)
  parsedSheets: {
    'Sheet1': {
      data: [
        ['Header1', 'Header2', 'Header3'],  // Row 0 (header)
        ['Value1', 'Value2', 'Value3'],     // Row 1
        // ... up to 10,000 rows (FR-010)
      ],
      rowCount: 1234,  // Total rows in sheet
      colCount: 10,    // Total columns in sheet
      isTruncated: false  // True if exceeds 10,000 rows
    },
    'Sheet2': { /* ... */ }
  },

  // UI state
  currentSheetIndex: 0,  // Currently displayed sheet
  zoom: 1.0,  // Zoom level (0.5 to 2.0)
  pan: { x: 0, y: 0 },  // Pan offset for zoomed view
  loading: false,  // Parsing in progress
  error: null,  // Error message if parse failed
  warnings: [  // Unsupported features detected (FR-011)
    'Charts are not supported in preview. Download the file to view all content.',
    'This file contains macros that will not execute in preview mode.'
  ]
};
```

**Component State Definition**:
```typescript
interface ExcelPreviewState {
  workbook: XLSX.WorkBook | null;
  parsedSheets: Map<string, ParsedSheetData>;
  currentSheetIndex: number;
  zoom: number;
  pan: { x: number; y: number };
  loading: boolean;
  error: string | null;
  warnings: string[];
}

interface ParsedSheetData {
  data: any[][];  // 2D array of cell values
  rowCount: number;
  colCount: number;
  isTruncated: boolean;
  formatting?: SheetFormatting;  // Optional cell styles
}

interface SheetFormatting {
  cellStyles: Map<string, CellStyle>;  // Key: "A1", "B2", etc.
  columnWidths: number[];
  rowHeights: number[];
}

interface CellStyle {
  font?: { bold?: boolean; italic?: boolean; color?: string };
  fill?: { color?: string };
  alignment?: { horizontal?: string; vertical?: string };
}
```

---

### 2.3 File Preview Props

**Location**: `FilePreviewModal.jsx` and `ExcelPreview.jsx`

```typescript
/**
 * Props passed to FilePreviewModal
 */
interface FilePreviewModalProps {
  open: boolean;
  onClose: () => void;
  files: FileAttachment[];  // All attachments in activity
  currentFile: FileAttachment;  // Currently previewing
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Props passed to ExcelPreview component
 */
interface ExcelPreviewProps {
  file: FileAttachment;  // File metadata (fileName, size, idRef)
  resolvedUrl?: string;  // Optional: SharePoint download URL
  onDownload: () => void;  // Download button handler
  onError: (error: Error) => void;  // Error callback
}

/**
 * File attachment model (frontend)
 */
interface FileAttachment {
  id: number;
  activityId: number;
  idRef: string;  // SharePoint file identifier
  fileName: string;
  filePath?: string;
  fileSize: number;  // Bytes
  mimeType: string;
  uploadedAt: string;  // ISO date string

  // Computed
  fileExtension: string;
  isImage: boolean;
  isDocument: boolean;
  isExcel: boolean;  // NEW
  displaySize: string;  // "1.2 MB"
  displayName: string;  // Truncated if too long
}
```

---

## 3. Backend Data Structures

### 3.1 Cache Entry Model

**Location**: `ExcelPreviewCacheMiddleware.cs` (in-memory cache)

```csharp
/// <summary>
/// Cache entry for Excel file preview
/// </summary>
public class ExcelPreviewCacheEntry
{
    /// <summary>
    /// File content as byte array
    /// </summary>
    public byte[] Content { get; set; }

    /// <summary>
    /// Content type (MIME type)
    /// </summary>
    public string ContentType { get; set; }

    /// <summary>
    /// Original file name
    /// </summary>
    public string FileName { get; set; }

    /// <summary>
    /// File size in bytes
    /// </summary>
    public long FileSize { get; set; }

    /// <summary>
    /// When cache entry was created
    /// </summary>
    public DateTime CachedAt { get; set; }

    /// <summary>
    /// User who cached this file (for permission isolation)
    /// </summary>
    public long UserId { get; set; }

    /// <summary>
    /// Activity ID (for permission validation)
    /// </summary>
    public long ActivityId { get; set; }

    /// <summary>
    /// IdRef of the file in SharePoint
    /// </summary>
    public string IdRef { get; set; }
}
```

**Cache Key Format**:
```csharp
public static string GenerateCacheKey(string idRef, long userId)
{
    return $"excel_preview_{idRef}_{userId}";
}
```

**Cache Configuration**:
```csharp
public class ExcelPreviewCacheOptions
{
    /// <summary>
    /// Maximum cache size in bytes (default: 100 MB)
    /// </summary>
    public long MaxCacheSizeBytes { get; set; } = 100 * 1024 * 1024;

    /// <summary>
    /// Sliding expiration (default: 15 minutes per FR-017)
    /// </summary>
    public TimeSpan SlidingExpiration { get; set; } = TimeSpan.FromMinutes(15);

    /// <summary>
    /// Compaction percentage when cache full (default: 0.25)
    /// </summary>
    public double CompactionPercentage { get; set; } = 0.25;

    /// <summary>
    /// Enable cache statistics logging
    /// </summary>
    public bool EnableStatistics { get; set; } = true;
}
```

---

### 3.2 Cache Statistics Model

**Location**: Middleware logging (Serilog)

```csharp
/// <summary>
/// Cache statistics for monitoring (NFR-001, NFR-003)
/// </summary>
public class CacheStatistics
{
    public string IdRef { get; set; }
    public long UserId { get; set; }
    public string FileName { get; set; }
    public long FileSizeBytes { get; set; }
    public bool CacheHit { get; set; }
    public long ResponseTimeMs { get; set; }
    public DateTime Timestamp { get; set; }
    public string Operation { get; set; }  // "preview", "download"
}
```

**Logged as**:
```json
{
  "timestamp": "2025-12-25T10:30:00Z",
  "level": "Information",
  "messageTemplate": "Excel preview {Operation}: IdRef={IdRef}, User={UserId}, CacheHit={CacheHit}, ResponseTime={ResponseTimeMs}ms",
  "properties": {
    "Operation": "preview",
    "IdRef": "sharepoint-file-guid",
    "UserId": 123,
    "FileName": "Sales_Report_Q4.xlsx",
    "FileSizeBytes": 5242880,
    "CacheHit": true,
    "ResponseTimeMs": 45,
    "UserEmail": "john.doe@company.com",
    "RequestPath": "/api/files/sharepoint-file-guid/content"
  }
}
```

---

### 3.3 Error Logging Model

**Location**: FileRetrievalService.cs and ExcelPreviewCacheMiddleware.cs

```csharp
/// <summary>
/// Excel preview error details (NFR-002, FR-016)
/// </summary>
public class ExcelPreviewError
{
    public string IdRef { get; set; }
    public long UserId { get; set; }
    public long ActivityId { get; set; }
    public string FileName { get; set; }
    public long FileSizeBytes { get; set; }
    public string FileExtension { get; set; }
    public string ErrorType { get; set; }  // "FileTooLarge", "CorruptedFile", "SharePointError", etc.
    public string ErrorMessage { get; set; }
    public string StackTrace { get; set; }
    public DateTime Timestamp { get; set; }
    public string UserEmail { get; set; }
    public string UserAgent { get; set; }
}
```

**Error Types**:
```csharp
public static class ExcelPreviewErrorType
{
    public const string FileTooLarge = "FILE_TOO_LARGE";  // > 20MB (FR-009)
    public const string CorruptedFile = "CORRUPTED_FILE";  // Invalid Excel format
    public const string PasswordProtected = "PASSWORD_PROTECTED";
    public const string SharePointError = "SHAREPOINT_ERROR";  // SharePoint API failed
    public const string ParsingError = "PARSING_ERROR";  // SheetJS parsing failed (frontend)
    public const string PermissionDenied = "PERMISSION_DENIED";  // User lacks access
    public const string UnsupportedFormat = "UNSUPPORTED_FORMAT";  // Not .xlsx or .xls
}
```

**Logged as**:
```json
{
  "timestamp": "2025-12-25T10:31:00Z",
  "level": "Error",
  "messageTemplate": "Excel preview failed: {ErrorType} for file {FileName}",
  "properties": {
    "ErrorType": "FILE_TOO_LARGE",
    "IdRef": "sharepoint-file-guid",
    "UserId": 123,
    "ActivityId": 456,
    "FileName": "Massive_Dataset.xlsx",
    "FileSizeBytes": 25165824,
    "FileExtension": ".xlsx",
    "ErrorMessage": "File size (24 MB) exceeds maximum allowed (20 MB)",
    "UserEmail": "john.doe@company.com",
    "RequestPath": "/api/files/sharepoint-file-guid/content"
  }
}
```

---

## 4. API Response Models (Existing - No Changes)

### 4.1 GET /api/files/{idRef}/content Response

**Existing endpoint** - No changes to contract

**HTTP Response**:
```http
HTTP/1.1 200 OK
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="Sales_Report_Q4.xlsx"
Content-Length: 5242880
Cache-Control: no-cache
X-Response-Time: 234ms

<binary Excel file content>
```

**Error Responses**:
```http
// File too large (20MB+)
HTTP/1.1 400 Bad Request
Content-Type: application/json
{
  "error": "FILE_TOO_LARGE",
  "message": "File size exceeds maximum allowed for preview (20MB)",
  "fileSizeMB": 24.5
}

// SharePoint retrieval failed
HTTP/1.1 500 Internal Server Error
Content-Type: application/json
{
  "error": "SHAREPOINT_ERROR",
  "message": "Failed to retrieve file from SharePoint",
  "details": "Graph API returned 404"
}

// Permission denied
HTTP/1.1 403 Forbidden
Content-Type: application/json
{
  "error": "PERMISSION_DENIED",
  "message": "User does not have access to this file"
}
```

---

## 5. Validation Rules

### 5.1 Frontend Validation

**File Size Validation** (before fetching):
```javascript
// In ActivityAttachmentList.jsx or FilePreviewModal.jsx
function validateExcelPreview(file) {
  const errors = [];

  // FR-009: 20MB hard limit
  if (file.fileSize > 20 * 1024 * 1024) {
    errors.push({
      type: 'FILE_TOO_LARGE',
      message: 'This file is too large to preview (exceeds 20MB limit). Please download the file to view it.'
    });
  }

  // FR-015: Only .xlsx and .xls
  const validExtensions = ['.xlsx', '.xls', '.xlsm', '.xlsb'];
  if (!validExtensions.includes(file.fileExtension)) {
    errors.push({
      type: 'UNSUPPORTED_FORMAT',
      message: 'This file format is not supported for preview. Only Excel files (.xlsx, .xls) can be previewed.'
    });
  }

  return errors;
}
```

**Post-Fetch Validation** (after ArrayBuffer received):
```javascript
async function validateExcelData(arrayBuffer, fileName) {
  const errors = [];

  // Check magic bytes
  const uint8Array = new Uint8Array(arrayBuffer);
  const header = uint8Array.slice(0, 4);

  const isXlsx = header[0] === 0x50 && header[1] === 0x4B; // PK.. (ZIP)
  const isXls = header[0] === 0xD0 && header[1] === 0xCF; // OLE2

  if (!isXlsx && !isXls) {
    errors.push({
      type: 'INVALID_FORMAT',
      message: 'File appears to be corrupted or is not a valid Excel file.'
    });
  }

  // Check for password protection (encrypted ZIP starts with PK but has different structure)
  if (isXlsx) {
    try {
      XLSX.read(arrayBuffer, { type: 'array', password: null });
    } catch (e) {
      if (e.message.includes('password') || e.message.includes('encrypted')) {
        errors.push({
          type: 'PASSWORD_PROTECTED',
          message: 'This file is password-protected and cannot be previewed. Please download it and open in Excel.'
        });
      }
    }
  }

  return errors;
}
```

---

### 5.2 Backend Validation

**File Size Middleware** (in ExcelPreviewCacheMiddleware):
```csharp
private async Task ValidateFileSize(string idRef)
{
    // Get file metadata from SharePoint
    var fileInfo = await _sharepointService.ReadFileInfoAsync(idRef);

    // FR-009: 20MB hard limit
    const long MAX_FILE_SIZE = 20 * 1024 * 1024;

    if (fileInfo.Size > MAX_FILE_SIZE)
    {
        _logger.LogWarning(
            "Excel preview rejected: File too large. IdRef={IdRef}, Size={Size}MB, User={UserId}",
            idRef,
            fileInfo.Size / (1024.0 * 1024.0),
            _currentUser.Id
        );

        throw new FilePreviewException(
            ExcelPreviewErrorType.FileTooLarge,
            $"File size ({fileInfo.Size / (1024.0 * 1024.0):F1} MB) exceeds maximum allowed (20 MB)"
        );
    }
}
```

---

## 6. State Transitions

### Excel Preview State Machine

```
[Closed Modal]
    |
    v (User clicks preview)
[Opening Modal]
    |
    v
[Fetching File] ---(error)---> [Error State] ---(retry)---> [Fetching File]
    |
    v (success)
[Parsing Excel]
    |
    v
[Rendering Preview] <---(sheet switch)---> [Rendering Preview]
    |
    v (user closes)
[Closed Modal]

[Download Action] (parallel to preview, can occur at any state)
```

**State Definitions**:
1. **Closed Modal**: Modal not visible, no file data loaded
2. **Opening Modal**: Modal visible, showing loading spinner
3. **Fetching File**: Calling `/api/files/{idRef}/content`, awaiting binary response
4. **Parsing Excel**: SheetJS parsing ArrayBuffer, building workbook object
5. **Rendering Preview**: Displaying Excel grid, user can interact (scroll, zoom, switch sheets)
6. **Error State**: Displaying error message with retry or download options
7. **Download Action**: Triggering file download (can occur from any state)

**State Persistence**:
- Parsed workbook cached in component state (prevents re-parsing on sheet switch)
- Cache cleared when modal closes
- Server-side cache persists for 15 minutes across modal open/close

---

## 7. Relationships & Dependencies

### Entity Relationship Diagram

```
┌──────────────────┐
│    Activities    │
└────────┬─────────┘
         │ 1
         │
         │ *
┌────────┴──────────────┐
│ Activity Attachments  │
│ ├─ IdRef (unique)     │
│ ├─ FileName           │
│ ├─ FileSize           │
│ └─ MimeType           │
└────────┬──────────────┘
         │
         │ (IdRef lookup)
         v
┌────────────────────────┐
│  SharePoint Storage    │
│  (external service)    │
└────────┬───────────────┘
         │
         │ (binary content)
         v
┌────────────────────────┐       ┌─────────────────────┐
│  MemoryCache (.NET)    │       │  SheetJS Parser     │
│  ├─ Key: excel_preview_│ ----> │  (frontend)         │
│  │       {idRef}_{uid} │       │  ├─ Workbook object │
│  ├─ Value: byte[]      │       │  ├─ Parsed sheets   │
│  └─ TTL: 15 minutes    │       │  └─ Formatting      │
└────────────────────────┘       └─────────────────────┘
         │                                  │
         │ (logged to)                      │ (displayed in)
         v                                  v
┌────────────────────────┐       ┌─────────────────────┐
│  Serilog Logs          │       │  ExcelPreview       │
│  ├─ Cache hits/misses  │       │  Component (React)  │
│  ├─ Performance metrics│       │  ├─ Sheet tabs      │
│  └─ Error details      │       │  ├─ Virtualized grid│
└────────────────────────┘       │  └─ Download button │
                                 └─────────────────────┘
```

---

## 8. Data Flow Sequence

### Happy Path: Excel Preview

```sequence
User -> ActivityAttachmentList: Click preview icon
ActivityAttachmentList -> FilePreviewModal: Open modal, pass file
FilePreviewModal -> FilePreviewModal: Determine file type (EXCEL)
FilePreviewModal -> ExcelPreview: Render ExcelPreview component
ExcelPreview -> filesApi: GET /api/files/{idRef}/content
filesApi -> FilesController: HTTP GET request
FilesController -> ExcelPreviewCacheMiddleware: Check cache
ExcelPreviewCacheMiddleware -> MemoryCache: TryGetValue(cacheKey)
MemoryCache --> ExcelPreviewCacheMiddleware: Cache MISS
ExcelPreviewCacheMiddleware -> FileRetrievalService: GetFileContentAsync(idRef)
FileRetrievalService -> SharePointService: ReadFileInfoAsync(idRef)
SharePointService -> SharePointAPI: Graph API call
SharePointAPI --> SharePointService: File metadata + download URL
SharePointService -> SharePointAPI: Download file content
SharePointAPI --> SharePointService: Binary file stream
SharePointService --> FileRetrievalService: FileContent stream
FileRetrievalService --> ExcelPreviewCacheMiddleware: byte[]
ExcelPreviewCacheMiddleware -> MemoryCache: Set(cacheKey, content, 15min TTL)
ExcelPreviewCacheMiddleware -> Serilog: Log cache miss + performance
ExcelPreviewCacheMiddleware --> FilesController: FileContentResult
FilesController --> filesApi: Binary response (200 OK)
filesApi --> ExcelPreview: ArrayBuffer
ExcelPreview -> SheetJS: XLSX.read(arrayBuffer)
SheetJS --> ExcelPreview: Workbook object
ExcelPreview -> ExcelPreview: Parse sheets to JSON arrays
ExcelPreview -> ExcelPreview: Detect warnings (charts, macros)
ExcelPreview -> ExcelPreview: Render virtualized grid
ExcelPreview --> User: Display Excel preview with sheet tabs
```

### Cache Hit Scenario

```sequence
User -> ActivityAttachmentList: Click preview (2nd time)
... (same flow until cache check)
ExcelPreviewCacheMiddleware -> MemoryCache: TryGetValue(cacheKey)
MemoryCache --> ExcelPreviewCacheMiddleware: Cache HIT (byte[])
ExcelPreviewCacheMiddleware -> Serilog: Log cache hit + fast response
ExcelPreviewCacheMiddleware --> FilesController: FileContentResult (from cache)
FilesController --> filesApi: Binary response (200 OK) ~50ms
... (same frontend parsing)
```

---

## Summary

**New Data Structures**:
1. Frontend: `FileCategory.EXCEL` enum, ExcelWorkbookState interface
2. Backend: ExcelPreviewCacheEntry class, CacheStatistics logging model
3. Validation: File size and format validation rules

**No Database Changes**: Existing `activity_attachments` table fully supports Excel preview via `IdRef` field.

**Cache Design**: User-isolated, permission-aware, size-limited, time-expired (15 min sliding).

**Data Flow**: SharePoint → Cache → Binary → SheetJS → Parsed JSON → Virtualized Grid

---

**Next**: contracts/ and quickstart.md
