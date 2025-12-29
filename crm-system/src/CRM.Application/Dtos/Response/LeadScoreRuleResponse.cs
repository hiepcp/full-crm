namespace CRMSys.Application.Dtos.Response
{
    /// <summary>
    /// Response DTO for LeadScoreRule - simplified single-table design
    /// </summary>
    public class LeadScoreRuleResponse
    {
        public long Id { get; set; }
        public string RuleName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string FieldName { get; set; } = string.Empty;
        public int Score { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedOn { get; set; }
        public string? CreatedBy { get; set; }
        public DateTime? UpdatedOn { get; set; }
        public string? UpdatedBy { get; set; }
    }
}
