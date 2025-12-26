using System;

namespace CRM.Domain.Entities
{
    /// <summary>
    /// Activity domain entity - represents various types of activities (calls, meetings, contracts, etc.)
    /// </summary>
    public class Activity
    {
        // Existing properties
        public int Id { get; set; }
        public string Name { get; set; }
        public string Type { get; set; }  // e.g., "call", "meeting", "email", "contract"
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

        // NEW PROPERTIES (Feature 006-contract-activity-fields)

        /// <summary>
        /// Date when the contract was signed or becomes effective.
        /// Only applicable when Type = "contract". Nullable for backward compatibility.
        /// Maps to database column: contract_date (DATE NULL)
        /// </summary>
        public DateTime? ContractDate { get; set; }

        /// <summary>
        /// Financial value of the contract.
        /// Only applicable when Type = "contract". Nullable for backward compatibility.
        /// Maps to database column: contract_value (DECIMAL(18, 2) NULL)
        /// </summary>
        public decimal? ContractValue { get; set; }
    }
}
