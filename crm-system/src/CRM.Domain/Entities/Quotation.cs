using System.ComponentModel.DataAnnotations.Schema;

namespace CRMSys.Domain.Entities
{
    /// <summary>
    /// Quotation entity representing sales quotations
    /// </summary>
    [Table("crm_quotation")]
    public class Quotation : BaseEntity
    {
        // === Primary Key ===
        public long Id { get; set; }

        // === Quotation Information ===
        public string QuotationNumber { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal? TotalAmount { get; set; }
        public string Status { get; set; } = "draft"; // ENUM: draft, sent, accepted, rejected, expired, cancelled
        public DateTime? ValidUntil { get; set; }
        public string? Notes { get; set; }
        public long? CustomerId { get; set; }

        // === Computed Properties ===
        [NotMapped]
        public bool IsDraft => Status == "draft";
        [NotMapped]
        public bool IsSent => Status == "sent";
        [NotMapped]
        public bool IsAccepted => Status == "accepted";
        [NotMapped]
        public bool IsRejected => Status == "rejected";
        [NotMapped]
        public bool IsExpired => Status == "expired";
        [NotMapped]
        public bool IsCancelled => Status == "cancelled";
        [NotMapped]
        public bool IsActive => IsSent && !IsExpired && !IsCancelled;
        [NotMapped]
        public bool IsClosed => IsAccepted || IsRejected || IsExpired || IsCancelled;
        [NotMapped]
        public bool IsOpen => !IsClosed;
        [NotMapped]
        public string DisplayName => !string.IsNullOrEmpty(Name) ? Name : QuotationNumber;
        [NotMapped]
        public bool IsExpiredDate => ValidUntil.HasValue && ValidUntil.Value < DateTime.UtcNow && IsActive;
        [NotMapped]
        public int DaysToExpiry => ValidUntil.HasValue ? (int)(ValidUntil.Value - DateTime.UtcNow).TotalDays : 0;

        // === Business Logic Helpers ===
        [NotMapped]
        public bool CanBeSent => IsDraft;
        [NotMapped]
        public bool CanBeAccepted => IsSent && !IsExpiredDate;
        [NotMapped]
        public bool CanBeRejected => IsSent && !IsExpiredDate;
        [NotMapped]
        public bool CanBeCancelled => IsOpen;
        [NotMapped]
        public bool NeedsFollowUp => IsSent && ValidUntil.HasValue && ValidUntil.Value < DateTime.UtcNow.AddDays(7) && !IsExpiredDate;

        /// <summary>
        /// Send quotation
        /// </summary>
        public void Send()
        {
            if (CanBeSent)
            {
                Status = "sent";
            }
        }

        /// <summary>
        /// Accept quotation
        /// </summary>
        public void Accept()
        {
            if (CanBeAccepted)
            {
                Status = "accepted";
            }
        }

        /// <summary>
        /// Reject quotation
        /// </summary>
        public void Reject()
        {
            if (CanBeRejected)
            {
                Status = "rejected";
            }
        }

        /// <summary>
        /// Cancel quotation
        /// </summary>
        public void Cancel()
        {
            if (CanBeCancelled)
            {
                Status = "cancelled";
            }
        }

        /// <summary>
        /// Mark as expired
        /// </summary>
        public void Expire()
        {
            if (IsActive && IsExpiredDate)
            {
                Status = "expired";
            }
        }

        /// <summary>
        /// Change status with validation
        /// </summary>
        public bool ChangeStatus(string newStatus)
        {
            var validStatuses = new[] { "draft", "sent", "accepted", "rejected", "expired", "cancelled" };
            if (!validStatuses.Contains(newStatus))
                return false;

            Status = newStatus;
            return true;
        }

        /// <summary>
        /// Set valid until date
        /// </summary>
        public void SetValidUntil(DateTime validUntil)
        {
            ValidUntil = validUntil;
        }

        /// <summary>
        /// Update total amount
        /// </summary>
        public void UpdateTotalAmount(decimal amount)
        {
            TotalAmount = amount;
        }
    }
}
