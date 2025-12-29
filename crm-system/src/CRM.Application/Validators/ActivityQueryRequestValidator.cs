using CRMSys.Application.Dtos.Request;
using FluentValidation;

namespace CRMSys.Application.Validators
{
    public class ActivityQueryRequestValidator : AbstractValidator<ActivityQueryRequest>
    {
        public ActivityQueryRequestValidator()
        {
            RuleFor(x => x.Page).GreaterThan(0);
            RuleFor(x => x.PageSize).InclusiveBetween(1, 100);
            RuleFor(x => x.Top).GreaterThanOrEqualTo(0).When(x => x.Top.HasValue);

            RuleFor(x => x.ActivityType)
                .Must(BeValidActivityType)
                .When(x => !string.IsNullOrEmpty(x.ActivityType))
                .WithMessage("Invalid activity type");

            RuleFor(x => x.Status)
                .Must(BeValidStatus)
                .When(x => !string.IsNullOrEmpty(x.Status))
                .WithMessage("Invalid status");

            RuleFor(x => x.Priority)
                .Must(BeValidPriority)
                .When(x => !string.IsNullOrEmpty(x.Priority))
                .WithMessage("Invalid priority");
        }

        private bool BeValidActivityType(string? type) =>
            new[] { "email", "call", "meeting", "task", "note", "reminder", "other" }.Contains(type);

        private bool BeValidStatus(string? status) =>
            new[] { "open", "in_progress", "completed", "cancelled", "overdue" }.Contains(status);

        private bool BeValidPriority(string? priority) =>
            new[] { "low", "normal", "high", "urgent" }.Contains(priority);
    }
}
