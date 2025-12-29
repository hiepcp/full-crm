namespace CRMSys.Application.Dtos.Response
{
    /// <summary>
    /// Response DTO for lead score calculation
    /// </summary>
    public class LeadScoreCalculationResponse
    {
        /// <summary>
        /// Total calculated score (clamped to 0-100)
        /// </summary>
        public int TotalScore { get; set; }
        
        /// <summary>
        /// Raw calculated score before clamping
        /// </summary>
        public int RawScore { get; set; }
        
        /// <summary>
        /// Maximum possible score
        /// </summary>
        public int MaxScore { get; set; }
        
        /// <summary>
        /// Breakdown of scores by field
        /// </summary>
        public List<FieldScoreBreakdown> Breakdown { get; set; } = new();
    }
    
    /// <summary>
    /// Score breakdown for a single field
    /// </summary>
    public class FieldScoreBreakdown
    {
        public string FieldName { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public int Score { get; set; }
        public string? MatchedValue { get; set; }
        public string? RuleName { get; set; }
    }
}
