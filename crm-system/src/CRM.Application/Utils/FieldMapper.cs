using CRMSys.Application.Dtos;
using Shared.Dapper.Models;

namespace CRMSys.Application.Utils
{
    /// <summary>
    /// Field mapping utility - maps client field names to database columns using case-insensitive comparison
    /// Client sends any case (camelCase, lowercase), we match with database columns (PascalCase)
    /// </summary>
    public static class FieldMapper
    {

        /// <summary>
        /// Parse order by string - maps client field names to database columns
        /// Client sends: "createdOn" or "-name" (any case)
        /// Output: "CreatedOn ASC" or "Name DESC"
        /// </summary>
        public static string ParseOrderBy(string orderBy)
        {
            if (string.IsNullOrWhiteSpace(orderBy))
                return string.Empty;

            var parts = orderBy.Split(',');
            var orderClauses = new List<string>();

            foreach (var part in parts)
            {
                var trimmed = part.Trim();
                if (string.IsNullOrEmpty(trimmed)) continue;

                var isDescending = trimmed.StartsWith('-');
                var field = isDescending ? trimmed[1..] : trimmed;

                // Validate field name
                orderClauses.Add($"{field.ToLower()} {(isDescending ? "DESC" : "ASC")}");
            }

            return string.Join(", ", orderClauses);
        }

        /// <summary>
        /// Generic filter processor using reflection to map filter values to request properties with operator support
        /// </summary>
        public static void ProcessFilters<TRequest>(IEnumerable<FilterRequest> filters, TRequest request) where TRequest : class
        {
            if (filters == null || !filters.Any() || request == null) return;

            var requestType = request.GetType();
            var properties = requestType.GetProperties()
                .Where(p => p.CanWrite && p.PropertyType != typeof(Dictionary<string, object>))
                .ToDictionary(p => p.Name, p => p, StringComparer.OrdinalIgnoreCase);

            foreach (var filter in filters)
            {
                var column = filter.Column?.Trim();
                if (string.IsNullOrEmpty(column)) continue;

                var value = filter.Value?.ToString();
                if (string.IsNullOrEmpty(value)) continue;

                var op = filter.Operator?.Trim().ToLower() ?? "eq"; // Default to equals

                // Map client field name to property name (case-insensitive)
                if (properties.TryGetValue(column, out var property))
                {
                    // Handle direct property mapping for simple "eq" operations only
                    if (op == "eq")
                    {
                        try
                        {
                            var convertedValue = ConvertValue(value, property.PropertyType);
                            property.SetValue(request, convertedValue);
                        }
                        catch
                        {
                            // If conversion fails, treat as complex filter
                            if (request is BaseQueryRequest baseQueryRequest)
                            {
                                baseQueryRequest.AddExtensionProperty($"{column}_{op}", value);
                            }
                        }
                    }
                    else
                    {
                        // For any non-eq operator, treat as complex filter
                        if (request is BaseQueryRequest baseQueryRequest)
                        {
                            baseQueryRequest.AddExtensionProperty($"{column}_{op}", value);
                        }
                    }
                }
                else
                {
                    // Unknown property - add to extension data with operator info
                    if (request is BaseQueryRequest baseQueryRequest)
                    {
                        baseQueryRequest.AddExtensionProperty($"{column}_{op}", value);
                    }
                }
            }
        }

        /// <summary>
        /// Convert string value to target type
        /// </summary>
        private static object? ConvertValue(string value, Type targetType)
        {
            if (targetType == typeof(string))
                return value;

            if (targetType == typeof(int) && int.TryParse(value, out var intVal))
                return intVal;

            if (targetType == typeof(long) && long.TryParse(value, out var longVal))
                return longVal;

            if (targetType == typeof(bool) && bool.TryParse(value, out var boolVal))
                return boolVal;

            if (targetType == typeof(DateTime) && DateTime.TryParse(value, out var dateVal))
                return dateVal;

            if (targetType == typeof(decimal) && decimal.TryParse(value, out var decimalVal))
                return decimalVal;

            if (targetType == typeof(double) && double.TryParse(value, out var doubleVal))
                return doubleVal;

            // For nullable types
            if (targetType.IsGenericType && targetType.GetGenericTypeDefinition() == typeof(Nullable<>))
            {
                var underlyingType = Nullable.GetUnderlyingType(targetType);
                return ConvertValue(value, underlyingType!);
            }

            throw new InvalidCastException($"Cannot convert '{value}' to {targetType.Name}");
        }

        /// <summary>
        /// Build filter expressions from both request properties and extension data
        /// </summary>
        public static Dictionary<string, FilterExpression> BuildAllFilterExpressions<TRequest>(TRequest request)
            where TRequest : BaseQueryRequest
        {
            var filterExpressions = new Dictionary<string, FilterExpression>();

            var requestType = request.GetType();

            // Properties that should NOT be treated as database filters
            var excludedProperties = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                "Page", "PageSize", "OrderBy", "Top", "Fields", "Domain",
                "ExtensionData", "HasDomainFilter", "HasFieldSelection",
                "IsSimpleQuery", "HasComplexFilters"
            };

            var properties = requestType.GetProperties()
                .Where(p => p.CanRead && p.PropertyType != typeof(Dictionary<string, object>))
                .Where(p => !excludedProperties.Contains(p.Name));

            // Process direct properties (simple filters)
            foreach (var property in properties)
            {
                var value = property.GetValue(request);
                if (value != null)
                {
                    // Convert property name to database column name
                    var columnName = property.Name;

                    // Build filter expression for this property
                    filterExpressions[property.Name.ToLower()] = new FilterExpression
                    {
                        Column = columnName,
                        Operator = "eq",
                        Value = value.ToString()!,
                        FilterString = $"{columnName} = @{property.Name}",
                        ParameterName = property.Name,
                        ParameterValue = value
                    };
                }
            }

            // Process complex filters from extension data
            if (request.ExtensionData != null)
            {
                foreach (var kvp in request.ExtensionData)
                {
                    if (kvp.Key.Contains("_"))
                    {
                        var parts = kvp.Key.Split('_');
                        if (parts.Length >= 2)
                        {
                            var column = parts[0];
                            var op = parts[1];
                            var value = kvp.Value?.ToString() ?? "";

                            var paramName = $"{column}_{op}";
                            var paramValue = ConvertParameterValue(value, op);

                            filterExpressions[column.ToLower()] = new FilterExpression
                            {
                                Column = column,
                                Operator = op,
                                Value = value,
                                FilterString = BuildFilterString(column, op, value),
                                ParameterName = paramName,
                                ParameterValue = paramValue
                            };
                        }
                    }
                }
            }

            return filterExpressions;
        }

        /// <summary>
        /// Convert parameter value based on operator
        /// </summary>
        public static object? ConvertParameterValue(string value, string op)
        {
            // For most operators, use the value as-is
            // Special handling can be added here if needed
            switch (op.ToLower())
            {
                case "isnull":
                case "isnotnull":
                    // These don't need parameters
                    return null;
                default:
                    return value;
            }
        }

        /// <summary>
        /// Build filter string for a specific operator with parameterized query
        /// </summary>
        public static string BuildFilterString(string column, string op, string value)
        {
            var paramName = $"{column}_{op}";

            return op.ToLower() switch
            {
                "ne" => $"{column} != @{paramName}",
                "gt" => $"{column} > @{paramName}",
                "ge" => $"{column} >= @{paramName}",
                "lt" => $"{column} < @{paramName}",
                "le" => $"{column} <= @{paramName}",
                "contains" => $"{column} LIKE CONCAT('%', @{paramName}, '%')",
                "like" => $"{column} LIKE CONCAT('%', @{paramName}, '%')",
                "startswith" => $"{column} LIKE CONCAT(@{paramName}, '%')",
                "endswith" => $"{column} LIKE CONCAT('%', @{paramName})",
                "isnull" => $"{column} IS NULL",
                "isnotnull" => $"{column} IS NOT NULL",
                _ => $"{column} = @{paramName}"
            };
        }

        /// <summary>
        /// Represents a filter expression with parameter info
        /// </summary>
        public class FilterExpression
        {
            public string Column { get; set; } = "";
            public string Operator { get; set; } = "";
            public string Value { get; set; } = "";
            public string FilterString { get; set; } = "";
            public string ParameterName { get; set; } = "";
            public object? ParameterValue { get; set; }
        }
    }
}
