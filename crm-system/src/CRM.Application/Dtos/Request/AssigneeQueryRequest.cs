using System.Text.Json.Serialization;

namespace CRMSys.Application.Dtos.Request
{
    /// <summary>
    /// Query request for Assignee with support for relation-based filtering
    /// </summary>
    public class AssigneeQueryRequest
    {
        // === Pagination ===
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;

        // === Simple Filters (mapped from query params) ===
        public string? Search { get; set; }              // q parameter - search in user names/emails
        public string? RelationType { get; set; }        // relationType parameter
        public long? RelationId { get; set; }            // relationId parameter
        //public long? UserId { get; set; }            // relationId parameter
        public string? UserEmail { get; set; }           // userEmail parameter
        public string? Role { get; set; }                 // role parameter
        public DateTime? AssignedFrom { get; set; }      // assignedFrom parameter
        public DateTime? AssignedTo { get; set; }        // assignedTo parameter
        public DateTime? CreatedFrom { get; set; }       // createdFrom parameter
        public DateTime? CreatedTo { get; set; }         // createdTo parameter

        // === Advanced Features ===
        public string? Domain { get; set; }              // JSON domain filter expression
        public string? OrderBy { get; set; } = "-AssignedAt"; // orderBy parameter
        public int? Top { get; set; }                    // top parameter
        public string? Fields { get; set; }              // fields parameter

        // === Extensible Properties (for future dynamic fields) ===
        [JsonExtensionData]
        public Dictionary<string, object>? ExtensionData { get; set; }

        // === Computed Properties ===
        public bool HasDomainFilter => !string.IsNullOrEmpty(Domain);
        public bool HasFieldSelection => !string.IsNullOrEmpty(Fields);
        public bool IsSimpleQuery => !HasDomainFilter && ExtensionData == null;
        public bool HasRelationFilter => !string.IsNullOrEmpty(RelationType) && RelationId.HasValue;

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
    }
}













