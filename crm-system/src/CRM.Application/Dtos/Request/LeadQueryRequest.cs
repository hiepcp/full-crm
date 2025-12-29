namespace CRMSys.Application.Dtos.Request
{
    /// <summary>
    /// Extensible query request for Lead with dynamic properties support
    /// Supports both simple filters and advanced domain filters
    /// </summary>
    public class LeadQueryRequest : BaseQueryRequest
    {
        // === Simple Filters (mapped from query params) ===
        public string? Search { get; set; }              // q parameter
        public string? TelephoneNo { get; set; }         // telephone_no parameter (partial match)
        public string? Status { get; set; }              // status parameter
        public string? Source { get; set; }              // source parameter
        public long? OwnerId { get; set; }               // ownerId parameter
        public int? ScoreMin { get; set; }               // scoreMin parameter
        public int? ScoreMax { get; set; }               // scoreMax parameter
        public int? Type { get; set; }
        public bool? IsConverted { get; set; }           // isConverted parameter
        public string? Country { get; set; }             // country parameter (ISO 3-char)
        public DateTime? CreatedFrom { get; set; }       // createdFrom parameter
        public DateTime? CreatedTo { get; set; }         // createdTo parameter
        public DateTime? UpdatedFrom { get; set; }       // updatedFrom parameter
        public DateTime? UpdatedTo { get; set; }         // updatedTo parameter
    }
}
