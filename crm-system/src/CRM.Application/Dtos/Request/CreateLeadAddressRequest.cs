using System.ComponentModel.DataAnnotations;

namespace CRMSys.Application.Dtos.Request
{
    /// <summary>
    /// Request DTO for creating a Lead address (stored in crm_lead_address)
    /// </summary>
    public class CreateLeadAddressRequest
    {
        // === Relation ===
        [Required(ErrorMessage = "RelationType is required")]
        [RegularExpression("^(lead)$", ErrorMessage = "RelationType must be 'lead'")]
        public string RelationType { get; set; } = "lead";

        [Required(ErrorMessage = "RelationId is required")]
        [Range(1, long.MaxValue, ErrorMessage = "RelationId must be greater than 0")]
        public long RelationId { get; set; }

        // === Address ===
        [Required(ErrorMessage = "AddressType is required")]
        [RegularExpression("^(legal|delivery|forwarder|forwarder_agent_asia|other)$",
            ErrorMessage = "AddressType must be one of: legal, delivery, forwarder, forwarder_agent_asia, other")]
        public string AddressType { get; set; } = "other";

        [StringLength(255, ErrorMessage = "Company name cannot exceed 255 characters")]
        public string? CompanyName { get; set; }

        public string? AddressLine { get; set; }

        [StringLength(32, ErrorMessage = "Postcode cannot exceed 32 characters")]
        public string? Postcode { get; set; }

        [StringLength(128, ErrorMessage = "City cannot exceed 128 characters")]
        public string? City { get; set; }

        [StringLength(3, ErrorMessage = "Country code must be 3 characters")]
        public string? Country { get; set; }

        [StringLength(255, ErrorMessage = "Contact person cannot exceed 255 characters")]
        public string? ContactPerson { get; set; }

        [EmailAddress(ErrorMessage = "Invalid email format")]
        [StringLength(320, ErrorMessage = "Email cannot exceed 320 characters")]
        public string? Email { get; set; }

        [Phone(ErrorMessage = "Invalid telephone number format")]
        [StringLength(64, ErrorMessage = "Telephone No cannot exceed 64 characters")]
        public string? TelephoneNo { get; set; }

        [StringLength(255, ErrorMessage = "Port of destination cannot exceed 255 characters")]
        public string? PortOfDestination { get; set; }

        public bool IsPrimary { get; set; } = false;
    }
}



