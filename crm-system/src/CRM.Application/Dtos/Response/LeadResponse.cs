namespace CRMSys.Application.Dtos.Response
{
    /// <summary>
    /// Response DTO for Lead data
    /// Can be customized based on field selection
    /// </summary>
    public class LeadResponse
    {
        // === Basic Identity ===
        public long Id { get; set; }
        public DateTime CreatedOn { get; set; }
        public string? CreatedBy {  get; set; }
        public DateTime? UpdatedOn { get; set; }
        public string? UpdatedBy { get; set; }

        // === Contact Information ===
        public string? Email { get; set; }
        public string? TelephoneNo { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Company { get; set; }
        public string? Website { get; set; }
        public string? Country { get; set; }
        public string? VatNumber { get; set; }
        public string? PaymentTerms { get; set; }

        // === Lead Details ===
        public string? Source { get; set; }
        public string? Status { get; set; }
        public int Type { get; set; } // 0=Draft (from public form), 1=Active (from internal system)
        public long? OwnerId { get; set; }
        public int? Score { get; set; }
        public bool IsConverted { get; set; }
        public DateTime? ConvertedAt { get; set; }

        // === Relations ===
        public long? CustomerId { get; set; }
        public long? ContactId { get; set; }
        public long? DealId { get; set; }
        public bool IsDuplicate { get; set; }
        public long? DuplicateOf { get; set; }

        // === Additional Info ===
        public string? Note { get; set; }
        public DateTime? FollowUpDate { get; set; }

        // === Addresses ===
        public List<CRMSys.Application.Dtos.Request.LeadAddressDto> Addresses { get; set; } = new();

        // === Computed Properties ===
        public string FullName => $"{FirstName} {LastName}".Trim();
        public bool HasBasicInfo => !string.IsNullOrEmpty(Email) || !string.IsNullOrEmpty(TelephoneNo);
        public bool IsQualified => Score >= 70;
        public string DisplayName => !string.IsNullOrEmpty(FullName) ? FullName : Email ?? "Unknown Lead";
        public int DaysSinceCreation => (int)(DateTime.UtcNow - CreatedOn).TotalDays;
        public int DaysSinceUpdate => UpdatedOn.HasValue ? (int)(DateTime.UtcNow - UpdatedOn.Value).TotalDays : 0;

        // === Status Helpers ===
        public bool IsWorking => Status == "working";
        public bool IsQualifiedStatus => Status == "qualified";
        public bool IsUnqualified => Status == "unqualified";

        // === Source Helpers ===
        public bool IsWebLead => Source == "web";
        public bool IsEventLead => Source == "event";
        public bool IsReferralLead => Source == "referral";
        public bool IsAdsLead => Source == "ads";
        public bool IsFacebookLead => Source == "facebook";

        /// <summary>
        /// Get field value by name (for dynamic field selection)
        /// </summary>
        public object? GetFieldValue(string fieldName)
        {
            return fieldName.ToLower() switch
            {
                "id"            => Id,
                "email"         => Email,
                "telephoneNo"   => TelephoneNo,
                "phone"         => TelephoneNo,
                "firstName"     => FirstName,
                "lastName"      => LastName,
                "company"       => Company,
                "website"       => Website,
                "country"       => Country,
                "vatNumber"     => VatNumber,
                "paymentTerms"  => PaymentTerms,
                "source"        => Source,
                "status"        => Status,
                "ownerId"       => OwnerId,
                "score"         => Score,
                "isConverted"   => IsConverted,
                "convertedAt"   => ConvertedAt,
                "customerId"    => CustomerId,
                "contactId"     => ContactId,
                "dealId"        => DealId,
                "isDuplicate"   => IsDuplicate,
                "duplicateOf"   => DuplicateOf,
                "note"          => Note,
                "followUpDate"  => FollowUpDate,
                "createdOn"     => CreatedOn,
                "createdBy"     => CreatedBy,
                "updatedOn"     => UpdatedOn,
                "updatedBy"     => UpdatedBy,
                "fullName"      => FullName,
                "displayName"   => DisplayName,
                _ => null
            };
        }
    }
}
