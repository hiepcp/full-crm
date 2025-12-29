using CRMSys.Application.Dtos.Request;
using FluentValidation;

namespace CRMSys.Application.Validators
{
    public class UpdateGoalRequestValidator : AbstractValidator<UpdateGoalRequest>
    {
        public UpdateGoalRequestValidator()
        {
            // === Basic Information ===
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Goal name is required")
                .MaximumLength(255).WithMessage("Goal name cannot exceed 255 characters");

            RuleFor(x => x.Description)
                .MaximumLength(1000).WithMessage("Description cannot exceed 1000 characters");

            // === Target & Progress ===
            RuleFor(x => x.TargetValue)
                .GreaterThanOrEqualTo(0).WithMessage("Target value must be non-negative")
                .When(x => x.TargetValue.HasValue);

            RuleFor(x => x.Progress)
                .GreaterThanOrEqualTo(0).WithMessage("Progress must be non-negative")
                .When(x => x.Progress.HasValue);

            // === Dates ===
            RuleFor(x => x.EndDate)
                .GreaterThanOrEqualTo(x => x.StartDate).WithMessage("End date must be after or equal to start date")
                .When(x => x.StartDate.HasValue && x.EndDate.HasValue);

            // === Ownership ===
            RuleFor(x => x.OwnerType)
                .NotEmpty().WithMessage("Owner type is required")
                .Must(x => new[] { "individual", "team", "company" }.Contains(x))
                .WithMessage("Owner type must be 'individual', 'team', or 'company'");

            RuleFor(x => x.OwnerId)
                .NotNull().WithMessage("Owner ID is required for individual goals")
                .GreaterThan(0).WithMessage("Owner ID must be greater than 0")
                .When(x => x.OwnerType == "individual");

            RuleFor(x => x.OwnerId)
                .Null().WithMessage("Owner ID must be null for team/company goals")
                .When(x => x.OwnerType == "team" || x.OwnerType == "company");

            // === Goal Configuration ===
            RuleFor(x => x.Type)
                .Must(x => string.IsNullOrEmpty(x) || new[] { "revenue", "deals", "tasks", "activities", "performance" }.Contains(x))
                .WithMessage("Type must be 'revenue', 'deals', 'tasks', 'activities', or 'performance'");

            RuleFor(x => x.Timeframe)
                .Must(x => string.IsNullOrEmpty(x) || new[] { "this_week", "this_month", "this_quarter", "this_year", "custom" }.Contains(x))
                .WithMessage("Timeframe must be 'this_week', 'this_month', 'this_quarter', 'this_year', or 'custom'");

            RuleFor(x => x.Status)
                .NotEmpty().WithMessage("Status is required")
                .Must(x => new[] { "draft", "active", "completed", "cancelled" }.Contains(x))
                .WithMessage("Status must be 'draft', 'active', 'completed', or 'cancelled'");

            // === Business Rules ===
            RuleFor(x => x.StartDate)
                .NotNull().WithMessage("Start date is required for active goals")
                .When(x => x.Status == "active");

            RuleFor(x => x.EndDate)
                .NotNull().WithMessage("End date is required for active goals")
                .When(x => x.Status == "active");

            RuleFor(x => x.TargetValue)
                .NotNull().WithMessage("Target value is required for active goals")
                .When(x => x.Status == "active");
        }
    }
}