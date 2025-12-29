using CRMSys.Application.Dtos.Request;
using FluentValidation;

namespace CRMSys.Application.Validators
{
    public class UpdateActivityRequestValidator : AbstractValidator<UpdateActivityRequest>
    {
        public UpdateActivityRequestValidator()
        {
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

            RuleFor(x => x.Subject)
                .MaximumLength(500)
                .When(x => !string.IsNullOrEmpty(x.Subject));

            RuleFor(x => x.EndAt)
                .GreaterThanOrEqualTo(x => x.StartAt)
                .When(x => x.StartAt.HasValue && x.EndAt.HasValue)
                .WithMessage("End time must be after or equal to start time");
        }

        private bool BeValidActivityType(string? type) =>
            new[] { "email", "call", "meeting", "task", "note", "contract", "reminder", "other" }.Contains(type);

        private bool BeValidStatus(string? status) =>
            new[] { "open", "in_progress", "completed", "cancelled", "overdue" }.Contains(status);

        private bool BeValidPriority(string? priority) =>
            new[] { "low", "normal", "high", "urgent" }.Contains(priority);
    }
}
