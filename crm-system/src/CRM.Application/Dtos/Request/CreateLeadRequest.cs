using System.ComponentModel.DataAnnotations;

namespace CRMSys.Application.Dtos.Request
{
    /// <summary>
    /// Request DTO for creating a new Lead
    /// </summary>
    public class CreateLeadRequest
    {
        // === Required Fields ===
        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Invalid email format")]
        [StringLength(320, ErrorMessage = "Email cannot exceed 320 characters")]
        public string? Email { get; set; }

        // === Optional Fields ===
        [Phone(ErrorMessage = "Invalid telephone number format")]
        [StringLength(64, ErrorMessage = "Telephone No cannot exceed 64 characters")]
        public string? TelephoneNo { get; set; }

        [StringLength(128, ErrorMessage = "First name cannot exceed 128 characters")]
        public string? FirstName { get; set; }

        [StringLength(128, ErrorMessage = "Last name cannot exceed 128 characters")]
        public string? LastName { get; set; }

        [StringLength(255, ErrorMessage = "Company cannot exceed 255 characters")]
        public string? Company { get; set; }

        [StringLength(253, ErrorMessage = "Website cannot exceed 253 characters")]
        public string? Website { get; set; }

        [StringLength(3, ErrorMessage = "Country code must be 3 characters")]
        public string? Country { get; set; }

        [StringLength(64, ErrorMessage = "VAT number cannot exceed 64 characters")]
        public string? VatNumber { get; set; }

        [StringLength(100, ErrorMessage = "Payment terms cannot exceed 100 characters")]
        public string? PaymentTerms { get; set; }

        [RegularExpression("^(web|event|referral|ads|facebook|other)$",
            ErrorMessage = "Source must be one of: web, event, referral, ads, facebook, other")]
        public string? Source { get; set; }

        [RegularExpression("^(working|qualified|unqualified)$",
            ErrorMessage = "Status must be one of: working, qualified, unqualified")]
        public string? Status { get; set; }

        [Range(0, 1, ErrorMessage = "Type must be 0 (Draft) or 1 (Active)")]
        public int Type { get; set; } = 1; // Default to Active

        public long? OwnerId { get; set; }

        [Range(0, 100, ErrorMessage = "Score must be between 0 and 100")]
        public int? Score { get; set; }

        public string? Note { get; set; }

        public DateTime? FollowUpDate { get; set; }

        // === Addresses ===
        public List<LeadAddressDto>? Addresses { get; set; }

        // === Computed Properties ===
        public string FullName => $"{FirstName} {LastName}".Trim();
        public bool HasBasicInfo => !string.IsNullOrEmpty(Email) || !string.IsNullOrEmpty(TelephoneNo);
        public bool IsQualified => Score >= 70;
    }
}
