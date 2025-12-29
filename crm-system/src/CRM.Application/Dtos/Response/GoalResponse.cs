namespace CRMSys.Application.Dtos.Response
{
    public class GoalResponse
    {
        // === Basic Identity ===
        public long Id { get; set; }
        public DateTime CreatedOn { get; set; }
        public string? CreatedBy { get; set; }
        public DateTime? UpdatedOn { get; set; }
        public string? UpdatedBy { get; set; }

        // === Basic Information ===
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }

        // === Target & Progress ===
        public decimal? TargetValue { get; set; }
        public decimal Progress { get; set; } = 0.00m;

        // === Dates ===
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }

        // === Ownership ===
        public long? OwnerUserId { get; set; } // Legacy FK for backward compatibility
        public string OwnerType { get; set; } = "individual"; // individual, team, company
        public long? OwnerId { get; set; } // FK to crm_user when OwnerType='individual'

        // === Goal Configuration ===
        public string? Type { get; set; } // revenue, deals, tasks, activities, performance
        public string? Timeframe { get; set; } // this_week, this_month, this_quarter, this_year, custom
        public bool Recurring { get; set; } = false;
        public string Status { get; set; } = "draft"; // draft, active, completed, cancelled

        // === New: Goal Hierarchy Support ===
        public long? ParentGoalId { get; set; }

        // === New: Auto-Calculation Support ===
        public string CalculationSource { get; set; } = "manual"; // manual, auto_calculated
        public DateTime? LastCalculatedAt { get; set; }
        public bool CalculationFailed { get; set; } = false;
        public string? ManualOverrideReason { get; set; }

        // === Computed Properties ===
        public bool IsIndividual => OwnerType == "individual";
        public bool IsTeam => OwnerType == "team";
        public bool IsCompany => OwnerType == "company";

        public bool IsDraft => Status == "draft";
        public bool IsActive => Status == "active";
        public bool IsCompleted => Status == "completed";
        public bool IsCancelled => Status == "cancelled";
        public bool IsClosed => IsCompleted || IsCancelled;

        public string DisplayName => !string.IsNullOrEmpty(Name) ? Name : $"Goal {Id}";
        public decimal ProgressPercentage => TargetValue.HasValue && TargetValue.Value > 0 ? (Progress / TargetValue.Value) * 100 : 0;
        public bool IsOverdue => EndDate.HasValue && EndDate.Value < DateTime.UtcNow && !IsClosed;
        public int DaysRemaining => EndDate.HasValue ? (int)(EndDate.Value - DateTime.UtcNow).TotalDays : 0;

        public string OwnerTypeDisplay => OwnerType switch
        {
            "individual" => "Individual",
            "team" => "Team",
            "company" => "Company",
            _ => OwnerType
        };

        public string TypeDisplay => Type switch
        {
            "revenue" => "Revenue",
            "deals" => "Deals",
            "tasks" => "Tasks",
            "activities" => "Activities",
            "performance" => "Performance",
            _ => Type ?? "Unknown"
        };

        public string TimeframeDisplay => Timeframe switch
        {
            "this_week" => "This Week",
            "this_month" => "This Month",
            "this_quarter" => "This Quarter",
            "this_year" => "This Year",
            "custom" => "Custom Period",
            _ => Timeframe ?? "Unknown"
        };

        public string StatusDisplay => Status switch
        {
            "draft" => "Draft",
            "active" => "Active",
            "completed" => "Completed",
            "cancelled" => "Cancelled",
            _ => Status
        };

        public bool IsAutoCalculated => CalculationSource == "auto_calculated";
        public bool IsManualEntry => CalculationSource == "manual";
        public bool HasParent => ParentGoalId.HasValue;
        public bool IsRootGoal => !ParentGoalId.HasValue;
    }
}