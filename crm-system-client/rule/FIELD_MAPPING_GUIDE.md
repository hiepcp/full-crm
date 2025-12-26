# Hướng dẫn Sử dụng Field Mapping System

Tài liệu hướng dẫn sử dụng hệ thống mapping field names - Client giữ nguyên camelCase, Server xử lý toàn bộ mapping.

## Tổng quan

Hệ thống này đơn giản hóa việc xử lý field names:
- **Client**: Giữ nguyên camelCase, không cần convert
- **Server**: Xử lý toàn bộ mapping thông qua **HashSet với case-insensitive comparison**

### Luồng xử lý

```
Client (camelCase: createdOn, ownerId, name)
    ↓ (GỬI NGUYÊN TRẠNG - không convert)
API Controller
    ↓ FieldMapper.MapFieldName() 
    ↓ (HashSet case-insensitive match: createdOn → CreatedOn)
Repository (PascalCase: CreatedOn, OwnerId, Name)
    ↓
Database (PascalCase columns)
```

### Ưu điểm

✅ **Client đơn giản**: Không cần function convert, viết code tự nhiên  
✅ **Server tập trung**: Tất cả mapping logic ở một chỗ (HashSet)  
✅ **Cực kỳ đơn giản**: Chỉ cần list tên cột database (PascalCase), không cần list các variant  
✅ **Hỗ trợ nhiều format tự động**: camelCase, lowercase, UPPERCASE, snake_case đều match được  
✅ **Type-safe**: HashSet validate tự động với StringComparer.OrdinalIgnoreCase

## Phía Client

### 1. Utility: `fieldMapper.js`

**Vị trí:** `src/utils/fieldMapper.js`

**Chức năng:** Chỉ build filter payload, GỬI NGUYÊN field names (camelCase)

#### Function chính:

**`buildFilterPayload(filterModel, extraFilters)`**

```javascript
import { buildFilterPayload } from '@utils/fieldMapper';

// Gửi NGUYÊN field names (camelCase) lên server
const payload = buildFilterPayload(
  { items: [{ field: 'name', operator: 'contains', value: 'ABC' }] },
  { type: 'Client', country: 'Vietnam' }
);

// Output - GỬI NGUYÊN camelCase:
// [
//   { column: 'name', operator: 'like', value: 'ABC' },
//   { column: 'type', operator: '=', value: 'Client' },
//   { column: 'country', operator: '=', value: 'Vietnam' }
// ]
```

**`mapOperatorToApi(operator)`** - Map operator DataGrid sang API

```javascript
mapOperatorToApi('contains')    // → 'like'
mapOperatorToApi('equals')      // → '='
mapOperatorToApi('startsWith')  // → 'startsWith'
```

### 2. Hook chung: `useDataGridData`

**Vị trí:** `src/presentation/hooks/useDataGridData.js`

Hook generic có thể dùng cho **BẤT KỲ ENTITY NÀO**. Gửi field names NGUYÊN TRẠNG (camelCase) lên API.

#### Cách sử dụng:

```javascript
import useDataGridData from '@presentation/hooks/useDataGridData';
import customersApi from '@infrastructure/api/customersApi';

export default function useCustomersData({ initialFilterColumn = 'name' } = {}) {
  return useDataGridData({
    fetchFunction: customersApi.getAllPaging,
    initialFilterColumn,      // 'name' - giữ nguyên camelCase
    initialPageSize: 10,
    initialSortField: 'id',   // 'id' - giữ nguyên
    initialSortOrder: 'asc',
  });
}

// Hook tự động gửi:
// - sortField: 'createdOn' (camelCase)
// - filters: [{ column: 'name', operator: 'like', value: 'ABC' }]
```

#### Tham số config:

| Tham số | Mô tả | Mặc định |
|---------|-------|----------|
| `fetchFunction` | Hàm API để gọi (bắt buộc) | - |
| `initialFilterColumn` | Cột filter ban đầu | `'name'` |
| `initialPageSize` | Số record mỗi trang | `10` |
| `initialSortField` | Cột sort mặc định | `'id'` |
| `initialSortOrder` | Thứ tự sort | `'asc'` |

#### Return values:

```javascript
const {
  data,              // Mảng dữ liệu hiện tại
  total,             // Tổng số records
  loading,           // Trạng thái loading
  error,             // Thông báo lỗi
  paginationModel,   // { page, pageSize }
  setPaginationModel,
  filterModel,       // DataGrid filter model
  setFilterModel,
  sortModel,         // DataGrid sort model
  setSortModel,
  fetchData,         // Function để fetch data
} = useCustomersData();
```

## Phía API (Backend)

### 1. Class chính: `FieldMapper.cs`

**Vị trí:** `src/CRM.Application/Utils/FieldMapper.cs`

**Chức năng:** Map field names từ client (camelCase/lowercase/snake_case/UPPERCASE) sang database columns (PascalCase) bằng case-insensitive comparison

#### HashSet cho Customer (CHỈ CẦN TÊN CỘT DATABASE):

```csharp
private static readonly HashSet<string> CustomerColumns = new(StringComparer.OrdinalIgnoreCase)
{
    "Id",
    "Name",
    "Domain",
    "Phone",
    "Email",
    "BillingAddress",
    "ShippingAddress",
    "Website",
    "Type",
    "OwnerId",
    "VatNumber",
    "Currency",
    "Country",
    "Industry",
    "Notes",
    "PaymentTerms",
    "DeliveryTerms",
    "ContactPerson",
    "CreatedOn",
    "UpdatedOn",
    "CreatedBy",
    "UpdatedBy"
};
```

**Lưu ý quan trọng:**
- Chỉ cần list **TÊN CHÍNH XÁC CỦA CỘT DATABASE** (PascalCase)
- **KHÔNG CẦN** list các variant như "createdon", "created_on", "CREATEDON"
- StringComparer.OrdinalIgnoreCase tự động xử lý case-insensitive matching

#### Các method chính:

**a) `MapFieldName(string clientFieldName, HashSet<string>? allowedColumns = null)`**
```csharp
// Map một field name - TỰ ĐỘNG so sánh case-insensitive
var dbColumn = FieldMapper.MapFieldName("createdOn");    // → "CreatedOn"
var dbColumn = FieldMapper.MapFieldName("createdon");    // → "CreatedOn"
var dbColumn = FieldMapper.MapFieldName("CREATEDON");    // → "CreatedOn"
var dbColumn = FieldMapper.MapFieldName("created_on");   // → "CreatedOn" (nếu không có trong HashSet thì giữ nguyên)

// Cơ chế: Loop qua HashSet, so sánh case-insensitive, return exact column name
```

**b) `ParseOrderBy(string orderBy, HashSet<string>? allowedColumns = null)`**
```csharp
// Client gửi: "createdOn" hoặc "-name" (bất kỳ case nào)
var allowedColumns = FieldMapper.GetCustomerColumns();
var sql = FieldMapper.ParseOrderBy("createdOn,-name", allowedColumns);
// Output: "CreatedOn ASC, Name DESC"

// Hỗ trợ nhiều format:
ParseOrderBy("createdon,-NAME");      // → "CreatedOn ASC, Name DESC"
ParseOrderBy("CREATEDON,-name");      // → "CreatedOn ASC, Name DESC"
```

**c) `GetCustomerColumns()`**
```csharp
// Lấy HashSet để sử dụng (trả về copy)
var columns = FieldMapper.GetCustomerColumns();
```

### 2. Controller Pattern

**Ví dụ:** `CustomerController.cs`

```csharp
using CRMSys.Application.Utils;

[HttpPost("query-domain")]
public async Task<IActionResult> QueryWithDomain(
    [FromQuery] string? sortColumn = null,
    [FromQuery] string sortOrder = "asc",
    [FromBody] CustomerDomainQueryWrapper? body = null)
{
    var request = new CustomerQueryRequest
    {
        Page = page,
        PageSize = pageSize
    };

    // Xử lý sort - client gửi camelCase (vd: "createdOn")
    // Repository sẽ map thành "CreatedOn ASC"
    if (!string.IsNullOrWhiteSpace(sortColumn))
    {
        var field = sortColumn.Trim();  // Giữ nguyên camelCase
        var orderBy = sortOrder.Equals("desc", StringComparison.OrdinalIgnoreCase)
            ? $"-{field}"
            : field;
        request.OrderBy = orderBy;
    }

    // Xử lý filters - client gửi camelCase, map thành PascalCase
    var filters = body?.Request?.Filters;
    if (filters != null && filters.Any())
    {
        foreach (var f in filters)
        {
            var clientColumn = f.Column?.Trim();  // Ví dụ: "createdOn"
            var val = f.Value?.ToString();
            
            // Map sang database column
            var dbColumn = FieldMapper.MapFieldName(clientColumn);  // → "CreatedOn"
            
            switch (dbColumn)
            {
                case "Name":
                    request.Name = val;
                    break;
                case "Email":
                    request.Email = val;
                    break;
                case "Type":
                    request.Type = val;
                    break;
                case "OwnerId":
                    if (long.TryParse(val, out var ownerId))
                        request.OwnerId = ownerId;
                    break;
                // ... các field khác
            }
        }
    }

    var result = await _customerService.QueryAsync(request);
    return Ok(result);
}
```

### 3. Repository Pattern

**Ví dụ:** `CustomerRepository.cs`

```csharp
using CRMSys.Application.Utils;

private string ParseOrderBy(string orderBy)
{
    // Lấy allowed columns cho Customer (HashSet)
    var allowedColumns = FieldMapper.GetCustomerColumns();
    
    // Parse và map: "createdOn" → "CreatedOn ASC"
    return FieldMapper.ParseOrderBy(orderBy, allowedColumns);
}

// Khi gọi:
// Input:  "createdOn,-name"  (camelCase)
// Input:  "createdon,-NAME"  (lowercase/UPPERCASE)
// Output: "CreatedOn ASC, Name DESC"  (PascalCase)
```

## Áp dụng cho Entity mới

### Ví dụ: Thêm Deal Entity

#### 1. Client Side (CỰC KỲ ĐƠN GIẢN)

**Bước 1: Tạo hook cho Deal**

File: `src/presentation/pages/deal/hooks/useDealsData.js`

```javascript
import dealsApi from '@infrastructure/api/dealsApi';
import useDataGridData from '@presentation/hooks/useDataGridData';

export default function useDealsData({ initialFilterColumn = 'title' } = {}) {
  return useDataGridData({
    fetchFunction: dealsApi.getAllPaging,
    initialFilterColumn,        // 'title' - camelCase
    initialPageSize: 10,
    initialSortField: 'createdOn',  // camelCase - GỬI NGUYÊN
    initialSortOrder: 'desc',
  });
}

// XONG! Không cần làm gì thêm ở client
```

**Bước 2: Sử dụng trong component**

File: `src/presentation/pages/deal/index.jsx`

```javascript
import useDealsData from './hooks/useDealsData';
import DealDataGrid from './components/DealDataGrid';

const DealPage = () => {
  const {
    data,
    total,
    loading,
    paginationModel,
    setPaginationModel,
    sortModel,
    setSortModel,
    filterModel,
    setFilterModel,
    fetchData,
  } = useDealsData({ initialFilterColumn: 'title' });

  useEffect(() => {
    // Có thể truyền thêm filters
    fetchData({ stage: 'Negotiation' });
  }, [fetchData, paginationModel, sortModel, filterModel]);

  return (
    <DealDataGrid
      data={data}
      total={total}
      loading={loading}
      paginationModel={paginationModel}
      onPaginationModelChange={setPaginationModel}
      sortModel={sortModel}
      onSortModelChange={setSortModel}
      filterModel={filterModel}
      onFilterModelChange={setFilterModel}
    />
  );
};
```

**Bước 3: Tạo DataGrid component**

File: `src/presentation/pages/deal/components/DealDataGrid.jsx`

```javascript
import { DataGrid } from '@mui/x-data-grid';

export default function DealDataGrid({
  data,
  total,
  loading,
  paginationModel,
  onPaginationModelChange,
  sortModel,
  onSortModelChange,
  filterModel,
  onFilterModelChange,
}) {
  const columns = [
    {
      field: 'id',
      headerName: 'ID',
      width: 80,
      sortable: true,
    },
    {
      field: 'title',
      headerName: 'Title',
      flex: 1,
      sortable: true,
      filterable: true,
    },
    {
      field: 'amount',
      headerName: 'Amount',
      width: 150,
      sortable: true,
    },
    {
      field: 'stage',
      headerName: 'Stage',
      width: 150,
      sortable: true,
      filterable: true,
    },
    {
      field: 'closeDate',
      headerName: 'Close Date',
      width: 130,
      sortable: true,
    },
  ];

  return (
    <DataGrid
      rows={data}
      columns={columns}
      rowCount={total}
      loading={loading}
      pageSizeOptions={[5, 10, 25, 50]}
      paginationModel={paginationModel}
      paginationMode="server"
      onPaginationModelChange={onPaginationModelChange}
      sortingMode="server"
      sortModel={sortModel}
      onSortModelChange={onSortModelChange}
      filterMode="server"
      filterModel={filterModel}
      onFilterModelChange={onFilterModelChange}
    />
  );
}
```

#### 2. API Side

**Bước 1: Thêm HashSet vào FieldMapper** (CỰC KỲ ĐƠN GIẢN)

File: `src/CRM.Application/Utils/FieldMapper.cs`

```csharp
/// <summary>
/// Deal allowed database columns (PascalCase - exact database column names)
/// CHỈ CẦN LIST TÊN CỘT DATABASE - StringComparer.OrdinalIgnoreCase tự động xử lý case
/// </summary>
private static readonly HashSet<string> DealColumns = new(StringComparer.OrdinalIgnoreCase)
{
    "Id",
    "Title",
    "Amount",
    "Stage",
    "CloseDate",          // CHỈ CẦN 1 ENTRY - tự động match "closedate", "closeDate", "CLOSEDATE"
    "OwnerId",            // Tự động match "ownerid", "ownerId", "owner_id"
    "CustomerId",         // Tự động match "customerid", "customerId", "customer_id"
    "CreatedOn",          // Tự động match "createdon", "createdOn", "CREATEDON"
    "UpdatedOn",
    "CreatedBy",
    "UpdatedBy"
};

/// <summary>
/// Get Deal allowed columns
/// </summary>
public static HashSet<string> GetDealColumns()
{
    return new HashSet<string>(DealColumns, StringComparer.OrdinalIgnoreCase);
}
```

**Ưu điểm so với Dictionary:**
- ✅ **Đơn giản hơn 60%**: Chỉ 10 entries thay vì 28 entries (Dictionary cần list tất cả variant)
- ✅ **Dễ maintain**: Chỉ cần nhớ tên cột database, không cần nhớ các variant
- ✅ **Không bị sót**: StringComparer.OrdinalIgnoreCase tự động handle MỌI case

**Bước 2: Tạo Controller** (Copy pattern từ CustomerController)

File: `src/CRM.Api/Controllers/DealController.cs`

```csharp
using CRMSys.Application.Utils;

[HttpPost("query-domain")]
public async Task<IActionResult> QueryWithDomain(
    [FromQuery] int page = 1,
    [FromQuery] int pageSize = 10,
    [FromQuery] string? sortColumn = null,
    [FromQuery] string sortOrder = "asc",
    [FromBody] DealDomainQueryWrapper? body = null)
{
    var request = new DealQueryRequest
    {
        Page = page,
        PageSize = pageSize
    };

    // Sort - giữ nguyên field từ client (camelCase)
    if (!string.IsNullOrWhiteSpace(sortColumn))
    {
        var field = sortColumn.Trim();
        var orderBy = sortOrder.Equals("desc", StringComparison.OrdinalIgnoreCase)
            ? $"-{field}"
            : field;
        request.OrderBy = orderBy;
    }

    // Filters - map từ bất kỳ case nào sang PascalCase
    var filters = body?.Request?.Filters;
    if (filters != null && filters.Any())
    {
        foreach (var f in filters)
        {
            var clientColumn = f.Column?.Trim();  // Client gửi: "closeDate" (hoặc "closedate", "CLOSEDATE")
            var val = f.Value?.ToString();
            
            // Map sang DB column (case-insensitive)
            var dbColumn = FieldMapper.MapFieldName(clientColumn);
            
            switch (dbColumn)  // Switch với PascalCase
            {
                case "Title":
                    request.Title = val;
                    break;
                case "Stage":
                    request.Stage = val;
                    break;
                case "Amount":
                    if (decimal.TryParse(val, out var amount))
                        request.Amount = amount;
                    break;
                case "CloseDate":  // Đã map từ "closeDate"/"closedate"/"CLOSEDATE" → "CloseDate"
                    if (DateTime.TryParse(val, out var date))
                        request.CloseDate = date;
                    break;
                // ... các field khác
            }
        }
    }

    var result = await _dealService.QueryAsync(request);
    return Ok(result);
}
```

**Bước 3: Tạo Repository**

File: `src/CRM.Infrastructure/Repositories/DealRepository.cs`

```csharp
using CRMSys.Application.Utils;

private string ParseOrderBy(string orderBy)
{
    // Lấy Deal allowed columns (HashSet)
    var allowedColumns = FieldMapper.GetDealColumns();
    
    // Parse: "closeDate,-title" → "CloseDate ASC, Title DESC"
    // Parse: "closedate,-TITLE" → "CloseDate ASC, Title DESC" (tự động handle case)
    return FieldMapper.ParseOrderBy(orderBy, allowedColumns);
}
```

## Quy ước đặt tên

| Nơi | Convention | Ví dụ |
|-----|------------|-------|
| **Client (JavaScript)** | camelCase | `createdOn`, `ownerId`, `firstName` |
| **API (C#)** | PascalCase | `CreatedOn`, `OwnerId`, `FirstName` |
| **Database** | PascalCase | `CreatedOn`, `OwnerId`, `FirstName` |

**Lưu ý:** Utilities tự động xử lý việc chuyển đổi, không cần chỉnh sửa thủ công.

## Lợi ích của Pattern này

✅ **Không hardcode**: Tự động convert field names, không cần switch case dài  
✅ **Tái sử dụng**: Một hook/utility dùng cho mọi entity  
✅ **Type-safe**: Validation whitelist ở server để bảo mật  
✅ **Nhất quán**: Cùng một pattern cho tất cả entities  
✅ **Dễ bảo trì**: Thay đổi ở một nơi, áp dụng toàn hệ thống  
✅ **Mở rộng dễ dàng**: Thêm entity mới chỉ mất vài phút  

## Checklist khi thêm Entity mới

### Client Side
- [ ] Tạo hook sử dụng `useDataGridData`
- [ ] Truyền `fetchFunction` từ API client
- [ ] Config `initialFilterColumn`, `initialSortField` phù hợp
- [ ] Tạo DataGrid component với columns
- [ ] Sử dụng hook trong page component

### API Side
- [ ] Thêm `Get{Entity}AllowedFields()` vào `FieldValidator.cs`
- [ ] Tạo `{Entity}Controller` với endpoint `query-domain`
- [ ] Xử lý sort: nhận `sortColumn` (PascalCase) từ client
- [ ] Xử lý filters: nhận `column` (PascalCase) từ client
- [ ] Tạo `{Entity}Repository` với `ParseOrderBy()` method
- [ ] Test API với Postman/Swagger

## Ví dụ Request/Response

### Request từ Client (camelCase)

```javascript
// JavaScript gửi - GỬI NGUYÊN camelCase
const response = await customersApi.getAllPaging(
  1,                    // page
  10,                   // pageSize
  'createdOn',          // sortColumn (camelCase - GỬI NGUYÊN)
  'desc',               // sortOrder
  [                     // filters payload
    { column: 'name', operator: 'like', value: 'ABC' },      // camelCase
    { column: 'type', operator: '=', value: 'Client' },      // camelCase
    { column: 'ownerId', operator: '=', value: '123' }       // camelCase
  ]
);
```

### API nhận (camelCase)

```
POST /api/customers/query-domain?page=1&pageSize=10&sortColumn=createdOn&sortOrder=desc

Body:
{
  "request": {
    "filters": [
      { "column": "name", "operator": "like", "value": "ABC" },
      { "column": "type", "operator": "=", "value": "Client" },
      { "column": "ownerId", "operator": "=", "value": "123" }
    ]
  }
}
```

### Server xử lý (Map sang PascalCase - case-insensitive)

```csharp
// Controller map filters (TỰ ĐỘNG handle mọi case)
var dbColumn = FieldMapper.MapFieldName("name");       // → "Name"
var dbColumn = FieldMapper.MapFieldName("NAME");       // → "Name"
var dbColumn = FieldMapper.MapFieldName("ownerId");    // → "OwnerId"
var dbColumn = FieldMapper.MapFieldName("ownerid");    // → "OwnerId"
var dbColumn = FieldMapper.MapFieldName("OWNERID");    // → "OwnerId"

// Repository map sort
var allowedColumns = FieldMapper.GetCustomerColumns();
var sql = FieldMapper.ParseOrderBy("createdOn,-name", allowedColumns);
// → "CreatedOn ASC, Name DESC"

var sql = FieldMapper.ParseOrderBy("CREATEDON,-NAME", allowedColumns);
// → "CreatedOn ASC, Name DESC" (cùng kết quả)
```

### Response trả về

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "name": "ABC Company",
        "type": "Client",
        "email": "contact@abc.com",
        "createdOn": "2025-12-01T10:30:00Z"
      }
    ],
    "totalCount": 45
  },
  "message": "Retrieved page 1 of customers successfully. Total records: 45"
}
```

## Xử lý lỗi thường gặp

### Lỗi 1: Field không được map

**Nguyên nhân:** Field chưa có trong HashSet  
**Giải pháp:** Thêm vào HashSet trong `FieldMapper.cs` (CHỈ CẦN 1 ENTRY - PascalCase)

```csharp
private static readonly HashSet<string> CustomerColumns = new(StringComparer.OrdinalIgnoreCase)
{
    // ... existing fields
    "NewField",  // ✅ CHỈ CẦN 1 ENTRY - tự động match "newfield", "newField", "new_field", "NEWFIELD"
};
```

**Lưu ý:** KHÔNG CẦN thêm các variant như "newfield", "new_field" - StringComparer.OrdinalIgnoreCase tự động xử lý!

### Lỗi 2: Filter không hoạt động

**Nguyên nhân:** Switch case trong Controller chưa xử lý field  
**Giải pháp:** Thêm case mới (dùng PascalCase)

```csharp
var dbColumn = FieldMapper.MapFieldName(clientColumn);

switch (dbColumn)  // PascalCase
{
    // ... existing cases
    case "NewField":  // PascalCase - match với HashSet
        request.NewField = val;
        break;
}
```

### Lỗi 3: Sort không đúng

**Nguyên nhân:** Field trong HashSet viết sai hoặc không khớp database column  
**Giải pháp:** Kiểm tra HashSet và database column name khớp nhau

```csharp
// HashSet (PascalCase - exact database column name)
"CreatedOn"  // ✅ Đúng

// Database column
CreatedOn  // ✅ Khớp

// ❌ Sai - không khớp database
"CreatedDate"  // HashSet sai, database là CreatedOn
```

**Debug tip:** Nếu sort/filter không work, check:
1. Database column name chính xác là gì? (dùng SQL hoặc EF model)
2. HashSet có entry đó chưa? (chính xác PascalCase)
3. Switch case trong Controller có handle field đó chưa?

## Tổng kết

### So sánh các approach

| Khía cạnh | Cách 1: Client toPascalCase | Cách 2: Dictionary server | **Cách 3: HashSet (HIỆN TẠI)** |
|-----------|----------------------------|---------------------------|-------------------------------|
| **Client complexity** | Phải dùng toPascalCase() | Gửi nguyên camelCase ✅ | Gửi nguyên camelCase ✅ |
| **Server complexity** | Chỉ validate whitelist | Dictionary 50+ entries | **HashSet 20 entries** ✅✅ |
| **Hỗ trợ format** | Chỉ camelCase | camelCase, lowercase | **Mọi case tự động** ✅✅ |
| **Thêm field mới** | Update ở cả 2 bên | Thêm 3-5 variants vào Dictionary | **Chỉ 1 entry vào HashSet** ✅✅ |
| **Debugging** | Khó (map ở 2 nơi) | Dễ (Dictionary) | **Cực kỳ dễ (HashSet)** ✅✅ |
| **Code size** | 100% | 300% | **60%** ✅✅ |
| **Maintainability** | Trung bình | Khá | **Xuất sắc** ✅✅ |

### Pattern HashSet này giúp:

✅ **Client đơn giản nhất có thể**: Viết code camelCase tự nhiên, không cần convert  
✅ **Server CỰC KỲ đơn giản**: Chỉ cần list tên cột database (PascalCase), KHÔNG CẦN list variant  
✅ **Tự động hỗ trợ MỌI format**: camelCase, lowercase, UPPERCASE, snake_case, PascalCase  
✅ **Thêm entity nhanh**: 
   - Client: Copy hook (30 giây)
   - Server: Thêm HashSet (1 phút) + Copy controller pattern (3 phút)  
✅ **Debug cực kỳ dễ dàng**: HashSet chỉ có tên cột database, không bị rối với các variant  
✅ **Code ngắn gọn**: HashSet nhỏ hơn 60% so với Dictionary

### Quy trình thêm entity mới (Deal làm ví dụ):

1. **Client** (30 giây):
   ```javascript
   // Copy useCustomersData.js → useDealsData.js
   // Đổi: customersApi → dealsApi
   // XONG!
   ```

2. **Server** (3 phút):
   ```csharp
   // 1. Thêm DealColumns HashSet vào FieldMapper.cs (1 phút) - CHỈ CẦN LIST TÊN CỘT DATABASE
   // 2. Copy GetCustomerColumns() → GetDealColumns() (30 giây)
   // 3. Copy CustomerController → DealController (1.5 phút)
   // XONG!
   ```

**Không cần tolower, toUpper, toCamel, không cần list variant - StringComparer.OrdinalIgnoreCase lo hết!** 🎯

### Tại sao HashSet tốt hơn Dictionary?

**Dictionary approach (cũ):**
```csharp
// Phải list TẤT CẢ variant - 50+ entries cho 20 cột!
{ "createdOn", "CreatedOn" },
{ "createdon", "CreatedOn" },
{ "created_on", "CreatedOn" },
{ "CREATEDON", "CreatedOn" },
{ "ownerId", "OwnerId" },
{ "ownerid", "OwnerId" },
{ "owner_id", "OwnerId" },
// ... phải list hết các variant
```

**HashSet approach (hiện tại):**
```csharp
// CHỈ CẦN list tên cột database - 20 entries cho 20 cột!
"CreatedOn",  // Tự động match: createdOn, createdon, CREATEDON, created_on
"OwnerId",    // Tự động match: ownerId, ownerid, OWNERID, owner_id
// ... chỉ cần PascalCase
```

**Kết luận:** HashSet + StringComparer.OrdinalIgnoreCase = Code ít nhất, dễ maintain nhất! 🚀
