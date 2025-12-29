using CRMSys.Application.Dtos.Request;
using FluentValidation;

namespace CRMSys.Application.Validators
{
    public class GoalQueryRequestValidator : AbstractValidator<GoalQueryRequest>
    {
        public GoalQueryRequestValidator()
        {
            // === Pagination ===
            RuleFor(x => x.Page)
                .GreaterThan(0).WithMessage("Page number must be greater than 0");

            RuleFor(x => x.PageSize)
                .GreaterThan(0).WithMessage("Page size must be greater than 0")
                .LessThanOrEqualTo(100).WithMessage("Page size cannot exceed 100");

            // === Sorting ===
            RuleFor(x => x.SortOrder)
                .Must(x => string.IsNullOrEmpty(x) || new[] { "asc", "desc" }.Contains(x.ToLower()))
                .WithMessage("Sort order must be 'asc' or 'desc'");

            RuleFor(x => x.SortBy)
                .Must(x => string.IsNullOrEmpty(x) || new[]
                {
                    "Id", "Name", "TargetValue", "Progress", "StartDate", "EndDate",
                    "OwnerType", "Type", "Timeframe", "Status", "CreatedOn", "UpdatedOn"
                }.Contains(x))
                .WithMessage("Invalid sort field");

            // === Filters ===
            RuleFor(x => x.OwnerType)
                .Must(x => string.IsNullOrEmpty(x) || new[] { "individual", "team", "company" }.Contains(x))
                .WithMessage("Owner type must be 'individual', 'team', or 'company'");

            RuleFor(x => x.OwnerId)
                .GreaterThan(0).WithMessage("Owner ID must be greater than 0")
                .When(x => x.OwnerId.HasValue);

            RuleFor(x => x.Status)
                .Must(x => string.IsNullOrEmpty(x) || new[] { "draft", "active", "completed", "cancelled" }.Contains(x))
                .WithMessage("Status must be 'draft', 'active', 'completed', or 'cancelled'");

            RuleFor(x => x.Type)
                .Must(x => string.IsNullOrEmpty(x) || new[] { "revenue", "deals", "tasks", "activities", "performance" }.Contains(x))
                .WithMessage("Type must be 'revenue', 'deals', 'tasks', 'activities', or 'performance'");

            RuleFor(x => x.Timeframe)
                .Must(x => string.IsNullOrEmpty(x) || new[] { "this_week", "this_month", "this_quarter", "this_year", "custom" }.Contains(x))
                .WithMessage("Timeframe must be 'this_week', 'this_month', 'this_quarter', 'this_year', or 'custom'");

            // === Date Range Filters ===
            RuleFor(x => x.StartDateTo)
                .GreaterThanOrEqualTo(x => x.StartDateFrom).WithMessage("Start date 'to' must be after or equal to 'from'")
                .When(x => x.StartDateFrom.HasValue && x.StartDateTo.HasValue);

            RuleFor(x => x.EndDateTo)
                .GreaterThanOrEqualTo(x => x.EndDateFrom).WithMessage("End date 'to' must be after or equal to 'from'")
                .When(x => x.EndDateFrom.HasValue && x.EndDateTo.HasValue);

            // === Progress Filters ===
            RuleFor(x => x.ProgressMin)
                .GreaterThanOrEqualTo(0).WithMessage("Progress minimum must be non-negative")
                .LessThanOrEqualTo(100).WithMessage("Progress minimum cannot exceed 100")
                .When(x => x.ProgressMin.HasValue);

            RuleFor(x => x.ProgressMax)
                .GreaterThanOrEqualTo(0).WithMessage("Progress maximum must be non-negative")
                .LessThanOrEqualTo(100).WithMessage("Progress maximum cannot exceed 100")
                .GreaterThanOrEqualTo(x => x.ProgressMin).WithMessage("Progress maximum must be greater than or equal to minimum")
                .When(x => x.ProgressMax.HasValue);
        }
    }
}