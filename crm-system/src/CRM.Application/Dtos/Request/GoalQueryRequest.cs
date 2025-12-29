namespace CRMSys.Application.Dtos.Request
{
    public class GoalQueryRequest
    {
        // === Pagination ===
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;

        // === Sorting ===
        public string? SortBy { get; set; } = "CreatedOn";
        public string? SortOrder { get; set; } = "desc"; // asc, desc

        // === Filters ===
        public string? OwnerType { get; set; } // individual, team, company
        public long? OwnerId { get; set; } // User ID when filtering by individual goals
        public string? Status { get; set; } // draft, active, completed, cancelled
        public string? Type { get; set; } // revenue, deals, tasks, activities, performance
        public string? Timeframe { get; set; } // this_week, this_month, this_quarter, this_year, custom
        public bool? Recurring { get; set; }

        // === Date Range Filters ===
        public DateTime? StartDateFrom { get; set; }
        public DateTime? StartDateTo { get; set; }
        public DateTime? EndDateFrom { get; set; }
        public DateTime? EndDateTo { get; set; }

        // === Search ===
        public string? SearchTerm { get; set; } // Search in Name and Description

        // === Additional Filters ===
        public bool? IsOverdue { get; set; } // Filter for overdue goals
        public bool? IsCompleted { get; set; } // Filter for completed goals
        public decimal? ProgressMin { get; set; } // Minimum progress percentage
        public decimal? ProgressMax { get; set; } // Maximum progress percentage
    }
}