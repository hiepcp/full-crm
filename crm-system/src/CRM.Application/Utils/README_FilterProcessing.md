# Generic Filter Processing Documentation

## Tổng quan

Hệ thống Generic Filter Processing cho phép xử lý linh hoạt các điều kiện filter với support đầy đủ cho operators, thay thế logic hardcoded switch statements trước đây.

## Kiến trúc

### 1. FieldMapper.ProcessFilters<TRequest>

Method chính xử lý danh sách filters và map vào request object.

```csharp
public static void ProcessFilters<TRequest>(IEnumerable<FilterRequest> filters, TRequest request)
    where TRequest : class
```

**Tham số:**
- `filters`: Danh sách `FilterRequest` chứa column, operator, value
- `request`: Object đích implement `IRequest` và có thể implement `IExtensible`

### 2. ProcessOperatorValue

Xử lý từng operator cụ thể và quyết định cách map value.

```csharp
private static object? ProcessOperatorValue(string op, string value, Type targetType)
```

## Operators được hỗ trợ

### Simple Operators (Set trực tiếp property)

| Operator | Mô tả | Ví dụ |
|----------|-------|-------|
| `eq` / `=` | Equals | `{"column": "status", "operator": "eq", "value": "new"}` |
| Default | Không chỉ định operator | `{"column": "status", "value": "new"}` |

### Complex Operators (Extension Data)

| Operator | Mô tả | Key Format | Ví dụ |
|----------|-------|------------|-------|
| `ne` / `!=` | Not equals | `{column}_ne` | `{"column": "status", "operator": "ne", "value": "cancelled"}` |
| `gt` / `>` | Greater than | `{column}_gt` | `{"column": "score", "operator": "gt", "value": "50"}` |
| `ge` / `>=` | Greater than or equal | `{column}_ge` | `{"column": "score", "operator": "ge", "value": "50"}` |
| `lt` / `<` | Less than | `{column}_lt` | `{"column": "score", "operator": "lt", "value": "100"}` |
| `le` / `<=` | Less than or equal | `{column}_le` | `{"column": "score", "operator": "le", "value": "100"}` |
| `contains` | String contains | `{column}_contains` | `{"column": "name", "operator": "contains", "value": "john"}` |
| `like` | String like (alias of contains) | `{column}_like` | `{"column": "email", "operator": "like", "value": "@company.com"}` |
| `startswith` | String starts with | `{column}_startswith` | `{"column": "name", "operator": "startswith", "value": "Mr."}` |
| `endswith` | String ends with | `{column}_endswith` | `{"column": "email", "operator": "endswith", "value": "@gmail.com"}` |

## Cách hoạt động

### 1. Processing Flow

```
FilterRequest → ProcessFilters → Property Mapping or Extension Data
                                      ↓
                            Simple Operators    Complex Operators
                                   ↓                   ↓
                            Set Property       Add to ExtensionData
```

### 2. Type Conversion

Hệ thống tự động convert string value sang target type:

- `string` → string (no conversion)
- `int` → `int.Parse()`
- `long` → `long.Parse()`
- `bool` → `bool.Parse()`
- `DateTime` → `DateTime.Parse()`
- `decimal` → `decimal.Parse()`
- `double` → `double.Parse()`
- Nullable types → handled automatically

### 3. Extension Data Structure

Complex filters được lưu trong `ExtensionData` với format:

```csharp
// Key format: {column}_{operator}
// Value: string value từ filter
extensionData["score_gt"] = "50";
extensionData["name_contains"] = "john";
extensionData["createdFrom_ge"] = "2024-01-01";
```

### 4. BuildAllFilterExpressions

Chuyển đổi tất cả filters (properties + extension data) thành filter expressions:

```csharp
var expressions = request.BuildAllFilterExpressions();
// Result:
// {
//   "status": { Column: "Status", Operator: "eq", Value: "new", FilterString: "Status = @Status", ParameterName: "Status", ParameterValue: "new" },
//   "score": { Column: "Score", Operator: "gt", Value: "50", FilterString: "score > @score_gt", ParameterName: "score_gt", ParameterValue: "50" },
//   "name": { Column: "name", Operator: "contains", Value: "john", FilterString: "name LIKE CONCAT('%', @name_contains, '%')", ParameterName: "name_contains", ParameterValue: "john" }
// }
```

### 5. BuildComplexFilterExpressions

Chỉ xử lý complex filters từ extension data:

```csharp
var complexExpressions = request.BuildComplexFilterExpressions();
// Chỉ trả về filters từ extension data (operators != "eq")
```

### 6. Special Filter Transformers

**SpecialFilterRegistry** cho phép customize filter transformation theo từng repository:

```csharp
// Register custom transformer
FieldMapper.SpecialFilterRegistry.RegisterTransformer("MyColumn", filterExpr => {
    return new SpecialFilterResult {
        IsHandled = true,
        SqlCondition = "MyColumn = @MyParam",
        Parameters = new { MyParam = filterExpr.Value }
    };
});

// Transform filter
var result = FieldMapper.TryTransformSpecialFilter(filterExpr);
if (result.IsHandled) {
    sqlBuilder.Where(result.SqlCondition, result.Parameters);
}
```

**SpecialFilterResult Structure:**
```csharp
public class SpecialFilterResult
{
    public string SqlCondition { get; set; }     // SQL WHERE condition
    public object? Parameters { get; set; }      // Parameters object
    public bool IsHandled { get; set; }          // Whether transformation succeeded
}
```

**Common Special Filters (auto-initialized):**
- `Search`: Full-text search across multiple fields
- `TelephoneNo_eq`: Partial match with LIKE
- `ScoreMin/ScoreMax`: Range filters (>=, <=)
- `CreatedFrom/CreatedTo`: Date range filters
- `UpdatedFrom/UpdatedTo`: Date range filters

### 7. Repository Integration

LeadRepository sử dụng generic processing với special filter transformers:

```csharp
static LeadRepository()
{
    // Initialize common special filters for Lead repository
    FieldMapper.InitializeCommonSpecialFilters();
}

private void BuildWhereClause(SqlBuilder sqlBuilder, LeadQueryRequest query)
{
    var filterExpressions = query.BuildAllFilterExpressions();

    foreach (var expr in filterExpressions)
    {
        var filterExpr = expr.Value;

        // Try special filter transformer first
        var specialResult = FieldMapper.TryTransformSpecialFilter(filterExpr);
        if (specialResult.IsHandled)
        {
            sqlBuilder.Where(specialResult.SqlCondition, specialResult.Parameters);
            continue; // Special filter was applied
        }

        // Generic parameterized queries for remaining filters
        var parameters = new ExpandoObject() as IDictionary<string, object>;
        parameters[filterExpr.ParameterName] = filterExpr.ParameterValue;
        sqlBuilder.Where(filterExpr.FilterString, parameters);
    }
}
```

**Filter Processing Flow:**
```
BuildAllFilterExpressions() → TryTransformSpecialFilter() → Generic Parameterized Query
                                      ↓
                        Special Transformer Found? → Transform to SQL + Params
                                      ↓
                                No → Standard SQL Generation
```

**Examples:**
- `Search` → `"(Email LIKE '%@Search%' OR Name LIKE '%@Search%' ...)", { Search = "john" }`
- `TelephoneNo` → `"TelephoneNo LIKE '%@TelephoneNo%'", { TelephoneNo = "123" }`
- `ScoreMin` → `"Score >= @ScoreMin", { ScoreMin = 80 }`
- `score_gt` → `"score > @score_gt", { score_gt = 50 }`
- `Status` → `"Status = @Status", { Status = "new" }`

### 5. Repository Integration

Complex filters được áp dụng trong `LeadRepository.BuildWhereClause`:

```csharp
// Complex filters from extension data
if (query.HasComplexFilters)
{
    var filterExpressions = query.BuildFilterExpressions();
    foreach (var expr in filterExpressions)
    {
        // Use parameterized queries for security
        var parameters = new ExpandoObject() as IDictionary<string, object>;
        parameters[expr.Value.ParameterName] = expr.Value.ParameterValue;
        sqlBuilder.Where(expr.Value.FilterString, parameters);
    }
}
```

## Usage Examples

### Basic Usage - LeadController

```csharp
// In LeadController.QueryWithDomain
var filters = body?.Request?.Filters;
if (filters != null && filters.Any())
{
    // Generic processing replaces hardcoded switch
    FieldMapper.ProcessFilters(filters, request);
}
```

### Request Object Enhancement

```csharp
public class LeadQueryRequest : FieldMapper.IExtensible
{
    // ... existing properties ...

    // New computed properties
    public bool HasComplexFilters => ExtensionData != null &&
        ExtensionData.Any(kvp => kvp.Key.Contains("_"));

    // Get complex filter conditions
    public Dictionary<string, (string Operator, string Value)> GetComplexFilters()
    {
        var complexFilters = new Dictionary<string, (string, string)>();

        if (ExtensionData != null)
        {
            foreach (var kvp in ExtensionData)
            {
                if (kvp.Key.Contains("_"))
                {
                    var parts = kvp.Key.Split('_', 2);
                    if (parts.Length == 2)
                    {
                        complexFilters[parts[0]] = (parts[1], kvp.Value?.ToString() ?? "");
                    }
                }
            }
        }

        return complexFilters;
    }
}
```

### Sample API Request

```json
POST /api/leads/query-domain
{
  "request": {
    "filters": [
      {
        "column": "status",
        "operator": "eq",
        "value": "new"
      },
      {
        "column": "score",
        "operator": "gt",
        "value": "50"
      },
      {
        "column": "firstName",
        "operator": "contains",
        "value": "john"
      },
      {
        "column": "createdFrom",
        "operator": "ge",
        "value": "2024-01-01"
      }
    ]
  }
}
```

### Processing Result

Sau khi xử lý, `LeadQueryRequest` sẽ có:

```csharp
// Simple filter - set trực tiếp property
request.Status = "new";

// Complex filters - trong ExtensionData
request.ExtensionData["score_gt"] = "50";
request.ExtensionData["firstName_contains"] = "john";
request.ExtensionData["createdFrom_ge"] = "2024-01-01";

// Helper methods
var hasComplex = request.HasComplexFilters; // true
var complexFilters = request.GetComplexFilters();
// Returns: { "score": ("gt", "50"), "firstName": ("contains", "john"), "createdFrom": ("ge", "2024-01-01") }
```

## Migration Guide

### Từ Hardcoded Switch → Generic Processor

**Before (Hardcoded):**
```csharp
foreach (var f in filters)
{
    var column = f.Column?.Trim();
    var op = f.Operator?.Trim().ToLower();
    var val = f.Value?.ToString();

    switch (column.ToLower())
    {
        case "status":
            request.Status = val;
            break;
        case "scoremin":
            if (int.TryParse(val, out var smin)) request.ScoreMin = smin;
            break;
        // ... 50+ lines of switch cases ...
    }
}
```

**After (Generic):**
```csharp
FieldMapper.ProcessFilters(filters, request);
```

### Backward Compatibility

- ✅ Simple filters không cần operator vẫn hoạt động
- ✅ Default operator là "eq" nếu không chỉ định
- ✅ Extension data fallback cho unknown properties

## Testing

### Unit Test Example

```csharp
[Test]
public void ProcessFilters_WithOperators_ShouldHandleCorrectly()
{
    // Arrange
    var filters = new List<FilterRequest>
    {
        new FilterRequest { Column = "status", Operator = "eq", Value = "new" },
        new FilterRequest { Column = "score", Operator = "gt", Value = "50" },
        new FilterRequest { Column = "name", Operator = "contains", Value = "john" }
    };

    var request = new LeadQueryRequest();

    // Act
    FieldMapper.ProcessFilters(filters, request);

    // Assert
    Assert.AreEqual("new", request.Status);
    Assert.IsTrue(request.HasComplexFilters);

    var complexFilters = request.GetComplexFilters();
    Assert.AreEqual(("gt", "50"), complexFilters["score"]);
    Assert.AreEqual(("contains", "john"), complexFilters["name"]);
}
```

## Performance Considerations

- **Reflection overhead**: Chấp nhận được cho query operations
- **Memory usage**: Extension data chỉ tạo khi cần
- **Type conversion**: Lazy evaluation với error handling

## Future Enhancements

1. **OData Integration**: Sử dụng `ODataOperatorConverter` để generate OData queries
2. **Custom Operators**: Support cho operators tùy chỉnh
3. **Validation**: Validate operator compatibility với data types
4. **Caching**: Cache reflection results cho performance

## Troubleshooting

### Common Issues

1. **FilterRequest not found**: Đảm bảo using `Shared.Dapper.Models`
2. **Type conversion failed**: Check target property types
3. **Extension data not working**: Implement `IExtensible` interface

### Debug Tips

```csharp
// Check if complex filters exist
if (request.HasComplexFilters)
{
    var complexFilters = request.GetComplexFilters();
    foreach (var filter in complexFilters)
    {
        Log.Information("Complex filter: {Column} {Operator} {Value}",
            filter.Key, filter.Value.Operator, filter.Value.Value);
    }
}
```

## Related Components

- `ODataOperatorConverter`: Convert operators sang OData format
- `IExtensible`: Interface cho extension data support
- `FilterRequest`: DTO chứa filter conditions
- LeadQueryRequest: Request object với filter processing
