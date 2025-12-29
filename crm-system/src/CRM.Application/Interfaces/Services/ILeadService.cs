using CRMSys.Application.Dtos.Request;
using CRMSys.Application.Dtos.Response;
using Shared.Dapper.Models;

namespace CRMSys.Application.Interfaces.Services
{
    /// <summary>
    /// Service interface for Lead business logic operations
    /// </summary>
    public interface ILeadService
    {
        /// <summary>
        /// Query leads with advanced filtering, pagination, ordering and field selection
        /// </summary>
        Task<PagedResult<LeadResponse>> QueryAsync(LeadQueryRequest request, CancellationToken ct = default);

        /// <summary>
        /// Get lead by ID
        /// </summary>
        Task<LeadResponse?> GetByIdAsync(long id, CancellationToken ct = default);

        /// <summary>
        /// Create new lead
        /// </summary>
        Task<long> CreateAsync(CreateLeadRequest request, string userEmail, CancellationToken ct = default);

        /// <summary>
        /// Create new darft lead
        /// </summary>
        Task<long> CreateDraftAsync(CreateLeadRequest request, string userEmail, CancellationToken ct = default);

        /// <summary>
        /// Update existing lead
        /// </summary>
        Task<bool> UpdateAsync(long id, UpdateLeadRequest request, string userEmail, CancellationToken ct = default);

        /// <summary>
        /// Delete lead by ID
        /// </summary>
        Task<bool> DeleteAsync(long id, string userEmail, CancellationToken ct = default);

        /// <summary>
        /// Convert lead to customer/contact
        /// </summary>
        Task<bool> ConvertLeadAsync(long leadId, long customerId, long? contactId = null, CancellationToken ct = default);

        /// <summary>
        /// Mark lead as duplicate
        /// </summary>
        Task<bool> MarkAsDuplicateAsync(long leadId, long duplicateOfLeadId, CancellationToken ct = default);

        /// <summary>
        /// Bulk update lead status
        /// </summary>
        Task<int> BulkUpdateStatusAsync(IEnumerable<long> leadIds, string newStatus, CancellationToken ct = default);

        /// <summary>
        /// Bulk assign leads to owner
        /// </summary>
        Task<int> BulkAssignAsync(IEnumerable<long> leadIds, long ownerId, CancellationToken ct = default);

        /// <summary>
        /// Get leads by owner ID
        /// </summary>
        Task<IEnumerable<LeadResponse>> GetByOwnerIdAsync(long ownerId, CancellationToken ct = default);

        /// <summary>
        /// Get leads by status
        /// </summary>
        Task<IEnumerable<LeadResponse>> GetByStatusAsync(string status, CancellationToken ct = default);

        /// <summary>
        /// Get qualified leads
        /// </summary>
        Task<IEnumerable<LeadResponse>> GetQualifiedLeadsAsync(int minScore = 70, CancellationToken ct = default);

        /// <summary>
        /// Get lead statistics
        /// </summary>
        Task<LeadStatistics> GetStatisticsAsync(CancellationToken ct = default);

        /// <summary>
        /// Validate lead data
        /// </summary>
        Task<CRMSys.Application.Interfaces.Services.ValidationResult> ValidateLeadAsync(CreateLeadRequest request, CancellationToken ct = default);

        /// <summary>
        /// Check if lead can be converted
        /// </summary>
        Task<bool> CanConvertLeadAsync(long leadId, CancellationToken ct = default);

        /// <summary>
        /// Convert a qualified lead into a new customer and copy its addresses.
        /// Returns created customer ID.
        /// </summary>
        Task<long> ConvertLeadToNewCustomerAsync(long leadId, CancellationToken ct = default);

        /// <summary>
        /// Convert lead to deal with customer and contact creation
        /// Returns created deal ID.
        /// </summary>
        Task<long> ConvertLeadToDealAsync(long leadId, ConvertLeadToDealRequest request, CancellationToken ct = default);

        /// <summary>
        /// Create a new lead together with its initial activity in one transaction.
        /// Enforces that an activity must be provided.
        /// </summary>
        Task<(long LeadId, long ActivityId)> CreateWithActivityAsync(CreateLeadWithActivityRequest request, string userEmail, CancellationToken ct = default);

        /// <summary>
        /// Create a new address for a lead
        /// </summary>
        Task<long> CreateLeadAddressAsync(CreateLeadAddressRequest request, string userEmail, CancellationToken ct = default);
    }

    /// <summary>
    /// Lead statistics DTO
    /// </summary>
    public class LeadStatistics
    {
        public int TotalLeads { get; set; }
        public int NewLeads { get; set; }
        public int QualifiedLeads { get; set; }
        public int ConvertedLeads { get; set; }
        public int UnqualifiedLeads { get; set; }
        public Dictionary<string, int> LeadsBySource { get; set; } = new();
        public Dictionary<string, int> LeadsByStatus { get; set; } = new();
        public double AverageScore { get; set; }
        public DateTime GeneratedAt { get; set; }
    }

    /// <summary>
    /// Validation result DTO
    /// </summary>
    public class ValidationResult
    {
        public bool IsValid { get; set; }
        public List<string> Errors { get; set; } = new();
        public List<string> Warnings { get; set; } = new();
        public Dictionary<string, object> Metadata { get; set; } = new();
    }
}
