namespace CRMSys.Application.Dtos.Response
{
    public class GoalMetricsResponse
    {
        public string OwnerType { get; set; } = string.Empty;
        public long? OwnerId { get; set; }
        public string? Timeframe { get; set; }
        public string? Type { get; set; }
        public int TotalGoals { get; set; }
        public decimal TotalTargetValue { get; set; }
        public decimal TotalProgress { get; set; }
        public decimal AverageProgress { get; set; }
        public decimal CompletionRate { get; set; }
    }
}



