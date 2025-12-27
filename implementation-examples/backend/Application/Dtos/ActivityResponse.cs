using System;

namespace CRM.Application.Dtos
{
    /// <summary>
    /// Response DTO for activity retrieval
    /// </summary>
    public class ActivityResponse
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Type { get; set; }
        public string Description { get; set; }
        public DateTime? DueDate { get; set; }
        public string Status { get; set; }
        public int? CustomerId { get; set; }
        public int? LeadId { get; set; }
        public int? DealId { get; set; }
        public string CreatedBy { get; set; }
        public DateTime CreatedAt { get; set; }
        public string UpdatedBy { get; set; }
        public DateTime? UpdatedAt { get; set; }

        // NEW FIELDS (Feature 006-contract-activity-fields)

        /// <summary>
        /// Date when the contract was signed or becomes effective.
        /// Null if not provided or not applicable.
        /// </summary>
        public DateTime? ContractDate { get; set; }

        /// <summary>
        /// Financial value of the contract.
        /// Null if not provided or not applicable.
        /// </summary>
        public decimal? ContractValue { get; set; }
    }
}
