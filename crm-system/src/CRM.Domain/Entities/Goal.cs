using System.ComponentModel.DataAnnotations.Schema;

namespace CRMSys.Domain.Entities
{
    /// <summary>
    /// Goal entity representing individual, team, or company goals
    /// </summary>
    [Table("crm_goal")]
    public class Goal : BaseEntity
    {
        public long Id { get; set; }

        // Basic Information
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }

        // Target & Progress
        public decimal? TargetValue { get; set; }
        public decimal Progress { get; set; } = 0.00m;

        // Dates
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }

        // Ownership
        public long? OwnerUserId { get; set; } // Legacy FK for backward compatibility
        public string OwnerType { get; set; } = "individual"; // individual, team, company
        public long? OwnerId { get; set; } // FK to crm_user when OwnerType='individual'

        // Goal Configuration
        public string? Type { get; set; } // revenue, deals, tasks, activities, performance
        public string? Timeframe { get; set; } // this_week, this_month, this_quarter, this_year, custom
        public bool Recurring { get; set; } = false;
        public string Status { get; set; } = "draft"; // draft, active, completed, cancelled

        // === New: Goal Hierarchy Support ===
        public long? ParentGoalId { get; set; } // Parent goal for hierarchy (NULL for root goals)

        // === New: Auto-Calculation Support ===
        public string CalculationSource { get; set; } = "manual"; // manual, auto_calculated
        public DateTime? LastCalculatedAt { get; set; } // Last auto-calculation timestamp
        public bool CalculationFailed { get; set; } = false; // Indicates calculation failure
        public string? ManualOverrideReason { get; set; } // Justification for manual override (FR-018)

        // === Computed Properties ===
        [NotMapped]
        public bool IsIndividual => OwnerType == "individual";
        [NotMapped]
        public bool IsTeam => OwnerType == "team";
        [NotMapped]
        public bool IsCompany => OwnerType == "company";

        [NotMapped]
        public bool IsDraft => Status == "draft";
        [NotMapped]
        public bool IsActive => Status == "active";
        [NotMapped]
        public bool IsCompleted => Status == "completed";
        [NotMapped]
        public bool IsCancelled => Status == "cancelled";
        [NotMapped]
        public bool IsClosed => IsCompleted || IsCancelled;

        [NotMapped]
        public string DisplayName => !string.IsNullOrEmpty(Name) ? Name : $"Goal {Id}";

        [NotMapped]
        public decimal ProgressPercentage => TargetValue.HasValue && TargetValue.Value > 0 ? (Progress / TargetValue.Value) * 100 : 0;

        [NotMapped]
        public bool IsOverdue => EndDate.HasValue && EndDate.Value < DateTime.UtcNow && !IsClosed;

        [NotMapped]
        public int DaysRemaining => EndDate.HasValue ? (int)(EndDate.Value - DateTime.UtcNow).TotalDays : 0;

        [NotMapped]
        public string OwnerTypeDisplay => OwnerType switch
        {
            "individual" => "Individual",
            "team" => "Team",
            "company" => "Company",
            _ => OwnerType
        };

        [NotMapped]
        public string TypeDisplay => Type switch
        {
            "revenue" => "Revenue",
            "deals" => "Deals",
            "tasks" => "Tasks",
            "activities" => "Activities",
            "performance" => "Performance",
            _ => Type ?? "Unknown"
        };

        [NotMapped]
        public string TimeframeDisplay => Timeframe switch
        {
            "this_week" => "This Week",
            "this_month" => "This Month",
            "this_quarter" => "This Quarter",
            "this_year" => "This Year",
            "custom" => "Custom Period",
            _ => Timeframe ?? "Unknown"
        };

        [NotMapped]
        public string StatusDisplay => Status switch
        {
            "draft" => "Draft",
            "active" => "Active",
            "completed" => "Completed",
            "cancelled" => "Cancelled",
            _ => Status
        };

        [NotMapped]
        public bool IsAutoCalculated => CalculationSource == "auto_calculated";

        [NotMapped]
        public bool IsManualEntry => CalculationSource == "manual";

        [NotMapped]
        public bool HasParent => ParentGoalId.HasValue;

        [NotMapped]
        public bool IsRootGoal => !ParentGoalId.HasValue;

        // === Business Logic Helpers ===

        /// <summary>
        /// Update progress value
        /// </summary>
        public void UpdateProgress(decimal newProgress)
        {
            Progress = Math.Max(0, Math.Min(TargetValue ?? 0, newProgress));
        }

        /// <summary>
        /// Update progress percentage (0-100)
        /// </summary>
        public void UpdateProgressPercentage(decimal percentage)
        {
            if (TargetValue.HasValue && TargetValue.Value > 0)
            {
                Progress = (percentage / 100) * TargetValue.Value;
            }
        }

        /// <summary>
        /// Change goal status with validation
        /// </summary>
        public bool ChangeStatus(string newStatus)
        {
            var validStatuses = new[] { "draft", "active", "completed", "cancelled" };
            if (!validStatuses.Contains(newStatus))
                return false;

            Status = newStatus;
            return true;
        }

        /// <summary>
        /// Complete the goal
        /// </summary>
        public void Complete()
        {
            Status = "completed";
            // Set progress to target if not already met
            if (TargetValue.HasValue && Progress < TargetValue.Value)
            {
                Progress = TargetValue.Value;
            }
        }

        /// <summary>
        /// Cancel the goal
        /// </summary>
        public void Cancel()
        {
            Status = "cancelled";
        }

        /// <summary>
        /// Activate the goal
        /// </summary>
        public void Activate()
        {
            Status = "active";
        }

        /// <summary>
        /// Set ownership
        /// </summary>
        public void SetOwnership(string ownerType, long? ownerId)
        {
            OwnerType = ownerType;
            OwnerId = ownerId;

            // For backward compatibility, set OwnerUserId for individual goals
            if (ownerType == "individual" && ownerId.HasValue)
            {
                OwnerUserId = ownerId.Value;
            }
            else
            {
                OwnerUserId = null;
            }
        }
    }
}


