namespace CRMSys.Application.Dtos.Request
{
    public class UpdateGoalRequest
    {
        // === Basic Information ===
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }

        // === Target & Progress ===
        public decimal? TargetValue { get; set; }
        public decimal? Progress { get; set; }

        // === Dates ===
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }

        // === Ownership ===
        public string OwnerType { get; set; } = "individual"; // individual, team, company
        public long? OwnerId { get; set; } // Required when OwnerType='individual'

        // === Goal Configuration ===
        public string? Type { get; set; } // revenue, deals, tasks, activities, performance
        public string? Timeframe { get; set; } // this_week, this_month, this_quarter, this_year, custom
        public bool Recurring { get; set; } = false;
        public string Status { get; set; } = "draft"; // draft, active, completed, cancelled
    }
}