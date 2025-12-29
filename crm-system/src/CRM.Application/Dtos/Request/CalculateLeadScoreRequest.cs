namespace CRMSys.Application.Dtos.Request
{
    /// <summary>
    /// Request DTO for calculating lead score
    /// </summary>
    public class CalculateLeadScoreRequest
    {
        public string? Source { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Company { get; set; }
        public string? VatNumber { get; set; }
        public string? Email { get; set; }
        public string? TelephoneNo { get; set; }
        public string? Website { get; set; }
        public string? PaymentTerms { get; set; }
        public string? Country { get; set; }
        public long? OwnerId { get; set; }
        public DateTime? FollowUpDate { get; set; }
        public string? Note { get; set; }
    }
}
