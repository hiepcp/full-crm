namespace CRMSys.Application.Dtos.Response
{
    /// <summary>
    /// Monthly trend data point for completion rate tracking
    /// </summary>
    public class CompletionRateTrendPoint
    {
        /// <summary>
        /// Month in YYYY-MM format
        /// </summary>
        public string Month { get; set; } = string.Empty;

        /// <summary>
        /// Completion rate percentage for that month
        /// </summary>
        public decimal CompletionRate { get; set; }

        /// <summary>
        /// Total goals that ended in this month
        /// </summary>
        public int TotalGoals { get; set; }

        /// <summary>
        /// Completed goals in this month
        /// </summary>
        public int CompletedGoals { get; set; }
    }

    /// <summary>
    /// Goal type breakdown with completion statistics
    /// </summary>
    public class GoalTypeBreakdown
    {
        /// <summary>
        /// Goal type (revenue, deals, activities, tasks, performance)
        /// </summary>
        public string Type { get; set; } = string.Empty;

        /// <summary>
        /// Total goals of this type
        /// </summary>
        public int TotalGoals { get; set; }

        /// <summary>
        /// Completed goals of this type
        /// </summary>
        public int CompletedGoals { get; set; }

        /// <summary>
        /// Completion rate percentage
        /// </summary>
        public decimal CompletionRate { get; set; }

        /// <summary>
        /// Average progress percentage across all goals of this type
        /// </summary>
        public decimal AverageProgress { get; set; }
    }

    /// <summary>
    /// Extended goal metrics response with historical trends and analytics
    /// Used for Phase 7 - Performance Analytics & Insights
    /// </summary>
    public class GoalAnalyticsResponse
    {
        // === Summary Metrics ===
        public int TotalGoals { get; set; }
        public int CompletedGoals { get; set; }
        public int ActiveGoals { get; set; }
        public int CancelledGoals { get; set; }
        public decimal OverallCompletionRate { get; set; }
        public decimal AverageProgress { get; set; }

        // === Velocity & Performance ===
        /// <summary>
        /// Average velocity in progress percentage per day
        /// </summary>
        public decimal AverageVelocity { get; set; }

        /// <summary>
        /// Number of data points used for velocity calculation
        /// </summary>
        public int VelocityDataPoints { get; set; }

        // === Historical Trends ===
        /// <summary>
        /// Monthly completion rate trend (last 12 months)
        /// </summary>
        public List<CompletionRateTrendPoint> CompletionRateTrend { get; set; } = new();

        /// <summary>
        /// Goal type breakdown with completion statistics
        /// </summary>
        public List<GoalTypeBreakdown> TypeBreakdown { get; set; } = new();

        // === Comparisons (optional) ===
        /// <summary>
        /// Team average completion rate (if applicable)
        /// </summary>
        public decimal? TeamAverageCompletionRate { get; set; }

        /// <summary>
        /// Company average completion rate (if applicable)
        /// </summary>
        public decimal? CompanyAverageCompletionRate { get; set; }

        /// <summary>
        /// Team average velocity (if applicable)
        /// </summary>
        public decimal? TeamAverageVelocity { get; set; }

        /// <summary>
        /// Company average velocity (if applicable)
        /// </summary>
        public decimal? CompanyAverageVelocity { get; set; }

        // === Data Quality Indicators ===
        /// <summary>
        /// Whether there is sufficient historical data (>= 30 days)
        /// </summary>
        public bool HasSufficientData { get; set; }

        /// <summary>
        /// Oldest goal creation date in the dataset
        /// </summary>
        public DateTime? OldestGoalDate { get; set; }

        /// <summary>
        /// Days of history available
        /// </summary>
        public int DaysOfHistory { get; set; }
    }
}
