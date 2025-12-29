using System.ComponentModel.DataAnnotations;

namespace CRMSys.Application.Dtos.Request
{
    /// <summary>
    /// Request DTO for updating an existing Lead
    /// All properties are optional - only provided fields will be updated
    /// </summary>
    public class UpdateLeadRequest
    {
        // === Updatable Fields (all optional) ===
        [EmailAddress(ErrorMessage = "Invalid email format")]
        [StringLength(320, ErrorMessage = "Email cannot exceed 320 characters")]
        public string? Email { get; set; }

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

        public long? OwnerId { get; set; }

        [Range(0, 100, ErrorMessage = "Score must be between 0 and 100")]
        public int? Score { get; set; }
        public int Type { get; set; } // 0=Draft (from public form), 1=Active (from internal system)

        public bool? IsConverted { get; set; }
        public DateTime? ConvertedAt { get; set; }
        public long? CustomerId { get; set; }
        public long? ContactId { get; set; }
        public long? DealId { get; set; }
        public bool? IsDuplicate { get; set; }
        public long? DuplicateOf { get; set; }

        public string? Note { get; set; }
        public DateTime? FollowUpDate { get; set; }

        // === Addresses ===
        public List<LeadAddressDto>? Addresses { get; set; }

        // === Helper Properties ===
        public string? FullName => $"{FirstName} {LastName}".Trim();

        public bool HasChanges()
        {
            return Email != null ||
                   TelephoneNo != null ||
                   FirstName != null ||
                   LastName != null ||
                   Company != null ||
                   Website != null ||
                   Country != null ||
                   VatNumber != null ||
                   PaymentTerms != null ||
                   Source != null ||
                   Status != null ||
                   OwnerId != null ||
                   Score != null ||
                   IsConverted != null ||
                   ConvertedAt != null ||
                   CustomerId != null ||
                   ContactId != null ||
                   DealId != null ||
                   IsDuplicate != null ||
                   DuplicateOf != null ||
                   Note != null ||
                   FollowUpDate != null ||
                   (Addresses != null && Addresses.Count > 0);
        }

        public int ChangesCount()
        {
            int count = 0;
            if (Email != null) count++;
            if (TelephoneNo != null) count++;
            if (FirstName != null) count++;
            if (LastName != null) count++;
            if (Company != null) count++;
            if (Website != null) count++;
            if (Country != null) count++;
            if (VatNumber != null) count++;
            if (PaymentTerms != null) count++;
            if (Source != null) count++;
            if (Status != null) count++;
            if (OwnerId != null) count++;
            if (Score != null) count++;
            if (IsConverted != null) count++;
            if (ConvertedAt != null) count++;
            if (CustomerId != null) count++;
            if (ContactId != null) count++;
            if (DealId != null) count++;
            if (IsDuplicate != null) count++;
            if (DuplicateOf != null) count++;
            if (Note != null) count++;
            if (FollowUpDate != null) count++;
            return count;
        }
    }
}
