namespace CRMSys.Application.Dtos.Request
{
    public class GoalMetricsRequest
    {
        public string? OwnerType { get; set; }
        public long? OwnerId { get; set; }
        public string? Timeframe { get; set; }
        public string? Type { get; set; }
        public string? Status { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public int? Top { get; set; }
        public string? SortBy { get; set; } = "averageProgress";
        public string SortOrder { get; set; } = "desc";
    }
}
