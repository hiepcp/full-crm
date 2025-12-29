namespace CRMSys.Application.Utils
{
    public static class ODataOperatorConverter
    {
        /// <summary>
        /// Converts a basic comparison operator to its OData equivalent
        /// </summary>
        /// <param name="filterOperator">The operator from FilterRequest</param>
        /// <returns>The equivalent OData operator</returns>
        /// <exception cref="ArgumentException">Thrown when operator is not supported</exception>
        /// <remarks>
        /// Supported operators:
        /// - Equals: "eq" or "="
        /// - Not equals: "ne" or "!="
        /// - Greater than: "gt" or ">"
        /// - Greater than or equal: "ge" or ">="
        /// - Less than: "lt" or "<"
        /// - Less than or equal: "le" or "<="
        /// </remarks>
        public static string ToODataOperator(string filterOperator)
        {
            if (string.IsNullOrWhiteSpace(filterOperator))
                throw new ArgumentException("Operator cannot be null or empty", nameof(filterOperator));

            return filterOperator.ToLower() switch
            {
                "eq" or "=" or "like" => "eq",
                "ne" or "!=" or "not like" => "ne",
                "gt" or ">" => "gt",
                "ge" or ">=" => "ge",
                "lt" or "<" => "lt",
                "le" or "<=" => "le",
                _ => throw new ArgumentException(
                    $"Operator '{filterOperator}' is not supported. Only basic comparison operators (eq, ne, gt, ge, lt, le) are supported.",
                    nameof(filterOperator))
            };
        }

        /// <summary>
        /// Formats a value for OData based on the operator
        /// </summary>
        /// <param name="value">The value to format</param>
        /// <param name="odataOperator">The OData operator being used</param>
        /// <returns>The formatted value ready for OData query</returns>
        public static string FormatValue(object value, string odataOperator)
        {
            if (value == null)
                return "null";

            // For numeric values
            if (decimal.TryParse(value.ToString(), out _))
                return value.ToString()!;

            // Default string handling
            return $"'{value.ToString()!.Replace("'", "''")}'";
        }

        public static string FormatValue(object value, string dataType, string odataOperator)
        {
            if (value == null)
                return "null";

            switch (dataType)
            {
                case "Edm.String":
                    return $"'{value.ToString()!.Replace("'", "''")}'";

                case "Edm.Int32":
                case "Edm.Int64":
                case "Edm.Decimal":
                case "Edm.Double":
                    return value.ToString()!;

                case "Edm.Boolean":
                    return value.ToString()!.ToLower(); // true/false

                case "Edm.DateTimeOffset":
                    // Dynamics 365 yêu c?u format ki?u: yyyy-MM-ddTHH:mm:ssZ
                    if (value is DateTime dt)
                        return dt.ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ");
                    return $"'{value}'";

                case "Edm.Guid":
                    return value is Guid guid ? guid.ToString() : value.ToString()!;

                default:
                    // fallback coi nhu string
                    return $"'{value.ToString()!.Replace("'", "''")}'";
            }
        }

    }
}
