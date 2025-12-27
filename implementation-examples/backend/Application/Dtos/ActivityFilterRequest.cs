using System;

namespace CRM.Application.Dtos
{
    /// <summary>
    /// Request DTO for filtering/querying activities
    /// </summary>
    public class ActivityFilterRequest
    {
        // Existing filters
        public string Type { get; set; }
        public string Status { get; set; }
        public int? CustomerId { get; set; }
        public int? LeadId { get; set; }
        public int? DealId { get; set; }
        public DateTime? DueDateFrom { get; set; }
        public DateTime? DueDateTo { get; set; }

        // NEW FILTERS (Feature 006-contract-activity-fields)

        /// <summary>
        /// Filter activities with contract date >= this value (inclusive).
        /// Only returns activities where contract_date IS NOT NULL and >= this value.
        /// </summary>
        public DateTime? ContractDateFrom { get; set; }

        /// <summary>
        /// Filter activities with contract date <= this value (inclusive).
        /// Only returns activities where contract_date IS NOT NULL and <= this value.
        /// </summary>
        public DateTime? ContractDateTo { get; set; }

        /// <summary>
        /// Filter activities with contract value >= this value (inclusive).
        /// Only returns activities where contract_value IS NOT NULL and >= this value.
        /// </summary>
        public decimal? ContractValueMin { get; set; }

        /// <summary>
        /// Filter activities with contract value <= this value (inclusive).
        /// Only returns activities where contract_value IS NOT NULL and <= this value.
        /// </summary>
        public decimal? ContractValueMax { get; set; }
    }
}
