using System;

namespace CRM.Application.Dtos
{
    /// <summary>
    /// Request DTO for creating or updating activities
    /// </summary>
    public class ActivityRequest
    {
        // Existing fields
        public string Name { get; set; }
        public string Type { get; set; }
        public string Description { get; set; }
        public DateTime? DueDate { get; set; }
        public string Status { get; set; }
        public int? CustomerId { get; set; }
        public int? LeadId { get; set; }
        public int? DealId { get; set; }

        // NEW FIELDS (Feature 006-contract-activity-fields)

        /// <summary>
        /// Date when the contract was signed or becomes effective.
        /// Optional. Only relevant for Type = "contract".
        /// </summary>
        public DateTime? ContractDate { get; set; }

        /// <summary>
        /// Financial value of the contract.
        /// Optional. Only relevant for Type = "contract".
        /// Must be non-negative if provided (validated by FluentValidation).
        /// </summary>
        public decimal? ContractValue { get; set; }
    }
}
