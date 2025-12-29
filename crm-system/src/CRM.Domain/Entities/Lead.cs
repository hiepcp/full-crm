using System.ComponentModel.DataAnnotations.Schema;

namespace CRMSys.Domain.Entities
{
    /// <summary>
    /// Lead entity representing a potential customer
    /// </summary>
    [Table("crm_lead")]
    public class Lead : BaseEntity
    {
        // === Primary Key ===
        public long Id { get; set; }

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

        public string? Source { get; set; } // ENUM: web, event, referral, ads, facebook, other
        public string? Status { get; set; } // ENUM: working, qualified, unqualified
        public int Type { get; set; } // 0=Draft (from public form), 1=Active (from internal system)
        public long? OwnerId { get; set; }
        public int? Score { get; set; }
        public bool IsConverted { get; set; }
        public DateTime? ConvertedAt { get; set; }

        public long? CustomerId { get; set; }
        public long? ContactId { get; set; }
        public long? DealId { get; set; }
        public bool IsDuplicate { get; set; }
        public long? DuplicateOf { get; set; }

        // === Additional Info ===
        public string? Note { get; set; }
        public DateTime? FollowUpDate { get; set; }

        // === Computed Properties ===
        [NotMapped]
        public string FullName => $"{FirstName} {LastName}".Trim();
        [NotMapped]
        public bool HasBasicInfo => !string.IsNullOrEmpty(Email) || !string.IsNullOrEmpty(TelephoneNo);
        [NotMapped]
        public bool IsQualified => Score >= 70;
        [NotMapped]
        public string DisplayName => !string.IsNullOrEmpty(FullName) ? FullName : Email ?? "Unknown Lead";

        // === Status Helpers ===
        [NotMapped]
        public bool IsWorking => Status == "working";
        [NotMapped]
        public bool IsQualifiedStatus => Status == "qualified";
        [NotMapped]
        public bool IsUnqualified => Status == "unqualified";

        // === Source Helpers ===
        [NotMapped]
        public bool IsWebLead => Source == "web";
        [NotMapped]
        public bool IsEventLead => Source == "event";
        [NotMapped]
        public bool IsReferralLead => Source == "referral";
        [NotMapped]
        public bool IsAdsLead => Source == "ads";
        [NotMapped]
        public bool IsFacebookLead => Source == "facebook";

        // === Business Logic Helpers ===
        [NotMapped]
        public bool CanBeConverted => !IsConverted && IsQualified && !IsDuplicate;
        [NotMapped]
        public bool NeedsFollowUp => FollowUpDate.HasValue && FollowUpDate.Value < DateTime.UtcNow;
        [NotMapped]
        public int DaysSinceCreation => (int)(DateTime.UtcNow - CreatedOn).TotalDays;
        [NotMapped]
        public int DaysSinceUpdate => (int)(DateTime.UtcNow - UpdatedOn).TotalDays;

        /// <summary>
        /// Mark lead as converted
        /// </summary>
        public void MarkAsConverted(long customerId, long? contactId = null, long? dealId = null)
        {
            IsConverted = true;
            ConvertedAt = DateTime.UtcNow;
            CustomerId = customerId;
            ContactId = contactId;
            DealId = dealId;
        }

        /// <summary>
        /// Mark as duplicate of another lead
        /// </summary>
        public void MarkAsDuplicate(long duplicateOfLeadId)
        {
            IsDuplicate = true;
            DuplicateOf = duplicateOfLeadId;
        }

        /// <summary>
        /// Update lead score
        /// </summary>
        public void UpdateScore(int newScore)
        {
            Score = Math.Clamp(newScore, 0, 100);
        }

        /// <summary>
        /// Change lead status with validation
        /// </summary>
        public bool ChangeStatus(string newStatus)
        {
            var validStatuses = new[] { "working", "qualified", "unqualified" };
            if (!validStatuses.Contains(newStatus))
                return false;

            Status = newStatus;
            return true;
        }

        /// <summary>
        /// Assign to new owner
        /// </summary>
        public void AssignTo(long ownerId)
        {
            OwnerId = ownerId;
        }
    }
}
