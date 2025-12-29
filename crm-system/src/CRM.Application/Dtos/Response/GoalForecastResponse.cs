namespace CRMSys.Application.Dtos.Response
{
    /// <summary>
    /// Response DTO for goal completion forecast based on velocity analysis
    /// </summary>
    public class GoalForecastResponse
    {
        public long GoalId { get; set; }

        // Current State
        public decimal CurrentProgress { get; set; }
        public decimal TargetValue { get; set; }
        public decimal ProgressPercentage { get; set; }

        // Time Analysis
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public int TotalDays { get; set; }
        public int DaysElapsed { get; set; }
        public int DaysRemaining { get; set; }
        public decimal TimeProgressPercentage { get; set; }

        // Velocity Metrics
        public decimal DailyVelocity { get; set; } // Progress per day
        public decimal WeeklyVelocity { get; set; } // Progress per week
        public bool HasSufficientData { get; set; } // At least 7 days of data

        // Forecast
        public DateTime? EstimatedCompletionDate { get; set; }
        public int? EstimatedDaysToCompletion { get; set; }
        public decimal ProjectedFinalProgress { get; set; } // What we'll achieve by end date
        public decimal ProjectedCompletionPercentage { get; set; }

        // Status Indicators
        public string ForecastStatus { get; set; } = "unknown"; // on_track, at_risk, ahead, behind, insufficient_data
        public string StatusMessage { get; set; } = string.Empty;
        public bool IsOnTrack { get; set; }
        public bool IsAtRisk { get; set; }
        public bool IsAhead { get; set; }
        public bool IsBehind { get; set; }

        // Recommendations
        public decimal RequiredDailyVelocity { get; set; } // What velocity is needed to meet target
        public decimal VelocityGap { get; set; } // Difference between required and actual velocity

        // Additional Analysis
        public string ConfidenceLevel { get; set; } = "low"; // low, medium, high - based on data points count
        public int DataPointsCount { get; set; } // Number of historical data points used for forecast
        public string Message { get; set; } = string.Empty; // Additional context or warnings
    }
}
