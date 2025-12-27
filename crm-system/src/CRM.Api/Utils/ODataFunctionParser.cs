using System.Text.RegularExpressions;

namespace CRMSys.Api.Utils
{
    /// <summary>
    /// ODataFunctionParser
    /// </summary>
    public class ODataFunctionParser
    {
        // Handle standard comparison
        private static readonly Regex StandardFilter = new(@"(?<field>[a-zA-Z0-9_]+)\s+(?<op>[a-zA-Z]+)\s+(?<value>'[^']*'|\d+)", RegexOptions.Compiled);
        
        // Handle OData functions like contains(field, value)
        private static readonly Regex FunctionFilter = new(@"(?<op>contains|startswith|endswith)\((?<field>[a-zA-Z0-9_]+),\s*(?<value>'[^']*'|\d+)\)", RegexOptions.Compiled);

        /// <summary>
        /// ParseFilter
        /// </summary>
        /// <param name="rawFilter"></param>
        /// <returns></returns>
        /// <exception cref="ArgumentException"></exception>
        public static (string field, string op, string value) ParseFilter(string rawFilter)
        {
            if (string.IsNullOrWhiteSpace(rawFilter))
                return (string.Empty, string.Empty, string.Empty);

            // Try parsing as function first
            var functionMatch = FunctionFilter.Match(rawFilter);
            if (functionMatch.Success)
            {
                return (
                    functionMatch.Groups["field"].Value,
                    functionMatch.Groups["op"].Value,
                    functionMatch.Groups["value"].Value
                );
            }

            // Try parsing as standard filter
            var standardMatch = StandardFilter.Match(rawFilter);
            if (standardMatch.Success)
            {
                return (
                    standardMatch.Groups["field"].Value,
                    standardMatch.Groups["op"].Value,
                    standardMatch.Groups["value"].Value
                );
            }

            throw new ArgumentException("Invalid filter syntax.");
        }
    }
}
