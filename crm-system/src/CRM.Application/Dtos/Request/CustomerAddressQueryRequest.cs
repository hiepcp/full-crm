using System.Text.Json.Serialization;

namespace CRMSys.Application.Dtos.Request
{
    /// <summary>
    /// Extensible query request for CustomerAddress with dynamic properties support
    /// Supports both simple filters and advanced domain filters
    /// </summary>
    public class CustomerAddressQueryRequest
    {
        // === Pagination ===
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;

        // === Simple Filters (mapped from query params) ===
        public long? CustomerId { get; set; }              // customerId parameter
        public string? AddressType { get; set; }           // addressType parameter
        public string? City { get; set; }                  // city parameter (partial match)
        public string? Country { get; set; }               // country parameter (ISO 3-char)
        public string? Postcode { get; set; }              // postcode parameter
        public bool? IsPrimary { get; set; }               // isPrimary parameter
        public string? Search { get; set; }                // q parameter (search in CompanyName, AddressLine, ContactPerson, Email)
        public DateTime? CreatedFrom { get; set; }         // createdFrom parameter
        public DateTime? CreatedTo { get; set; }           // createdTo parameter
        public DateTime? UpdatedFrom { get; set; }         // updatedFrom parameter
        public DateTime? UpdatedTo { get; set; }           // updatedTo parameter

        // === Advanced Features ===
        public string? Domain { get; set; }                // JSON domain filter expression
        public string? OrderBy { get; set; } = "-updated_on"; // orderBy parameter
        public int? Top { get; set; }                      // top parameter
        public string? Fields { get; set; }                // fields parameter

        // === Extensible Properties (for future dynamic fields) ===
        [JsonExtensionData]
        public Dictionary<string, object>? ExtensionData { get; set; }

        // === Computed Properties ===
        public bool HasDomainFilter => !string.IsNullOrEmpty(Domain);
        public bool HasFieldSelection => !string.IsNullOrEmpty(Fields);
        public bool IsSimpleQuery => !HasDomainFilter && ExtensionData == null;
        public bool HasCustomerFilter => CustomerId.HasValue;

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
        public void MergeExtensions(CustomerAddressQueryRequest other)
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
