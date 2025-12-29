namespace CRMSys.Application.Dtos.Request
{
    /// <summary>
    /// Request DTO for creating LeadScoreRule - simplified single-table design
    /// </summary>
    public class CreateLeadScoreRuleRequest
    {
        public string RuleName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string FieldName { get; set; } = string.Empty;
        public int Score { get; set; }
        public bool IsActive { get; set; } = true;
    }
}
