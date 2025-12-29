using CRMSys.Application.Dtos.Request;
using System.Text.Json.Serialization;

namespace CRMSys.Application.Dtos
{
    public class BaseQueryRequest
    {
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
        public string? OrderBy { get; set; }
        public string? Fields { get; set; }
        public string? Domain { get; set; }
        public int? Top { get; set; }

        // === Extensible Properties (for future dynamic fields) ===
        [JsonExtensionData]
        public Dictionary<string, object>? ExtensionData { get; set; }

        // === Computed Properties ===
        public bool HasDomainFilter => !string.IsNullOrEmpty(Domain);
        public bool HasFieldSelection => !string.IsNullOrEmpty(Fields);
        public bool IsSimpleQuery => !HasDomainFilter && ExtensionData == null;
        public bool HasComplexFilters => ExtensionData != null && ExtensionData.Any(kvp => kvp.Key.Contains("_"));

        // === Helper Methods ===
        public void AddExtensionProperty(string key, object value)
        {
            ExtensionData ??= new Dictionary<string, object>();
            ExtensionData[key] = value;
        }

        public object? GetExtensionProperty(string key)
        {
            return ExtensionData?.GetValueOrDefault(key);
        }

        public bool HasExtensionProperty(string key)
        {
            return ExtensionData?.ContainsKey(key) == true;
        }

        public void RemoveExtensionProperty(string key)
        {
            ExtensionData?.Remove(key);
        }

        /// <summary>
        /// Merge extension properties from another request
        /// </summary>
        public void MergeExtensions(LeadQueryRequest other)
        {
            if (other.ExtensionData != null)
            {
                ExtensionData ??= new Dictionary<string, object>();
                foreach (var kvp in other.ExtensionData)
                {
                    ExtensionData[kvp.Key] = kvp.Value;
                }
            }
        }
    }
}
