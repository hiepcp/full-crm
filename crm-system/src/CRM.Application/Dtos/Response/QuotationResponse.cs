namespace CRMSys.Application.Dtos.Response
{
    public class QuotationResponse
    {
        // === Basic Identity ===
        public long Id { get; set; }
        public DateTime CreatedOn { get; set; }
        public string? CreatedBy { get; set; }
        public DateTime? UpdatedOn { get; set; }
        public string? UpdatedBy { get; set; }

        // === Quotation Information ===
        public string QuotationNumber { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal? TotalAmount { get; set; }
        public string Status { get; set; } = "draft";
        public DateTime? ValidUntil { get; set; }
        public string? Notes { get; set; }
        public long? CustomerId { get; set; }

        // === Computed Properties ===
        public bool IsDraft => Status == "draft";
        public bool IsSent => Status == "sent";
        public bool IsAccepted => Status == "accepted";
        public bool IsRejected => Status == "rejected";
        public bool IsExpired => Status == "expired";
        public bool IsCancelled => Status == "cancelled";
        public bool IsActive => IsSent && !IsExpired && !IsCancelled;
        public bool IsClosed => IsAccepted || IsRejected || IsExpired || IsCancelled;
        public bool IsOpen => !IsClosed;
        public string DisplayName => !string.IsNullOrEmpty(Name) ? Name : QuotationNumber;
        public bool IsExpiredDate => ValidUntil.HasValue && ValidUntil.Value < DateTime.UtcNow && IsActive;
        public int DaysToExpiry => ValidUntil.HasValue ? (int)(ValidUntil.Value - DateTime.UtcNow).TotalDays : 0;
    }
}
