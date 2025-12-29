namespace CRMSys.Application.Dtos.Request
{
    /// <summary>
    /// Request DTO for updating LeadScoreRule - simplified single-table design (all fields optional)
    /// </summary>
    public class UpdateLeadScoreRuleRequest
    {
        public string? RuleName { get; set; }
        public string? Description { get; set; }
        public string? FieldName { get; set; }
        public int? Score { get; set; }
        public bool? IsActive { get; set; }
    }
}
