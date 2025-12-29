using CRMSys.Application.Dtos.Request;
using FluentValidation;

namespace CRMSys.Application.Validators
{
    public class CreateActivityRequestValidator : AbstractValidator<CreateActivityRequest>
    {
        public CreateActivityRequestValidator()
        {
            RuleFor(x => x.ActivityType)
                .NotEmpty()
                .Must(BeValidActivityType)
                .WithMessage("Invalid activity type");

            RuleFor(x => x.Status)
                .NotEmpty()
                .Must(BeValidStatus)
                .WithMessage("Invalid status");

            RuleFor(x => x.Priority)
                .NotEmpty()
                .Must(BeValidPriority)
                .WithMessage("Invalid priority");

            RuleFor(x => x.Subject)
                .MaximumLength(500)
                .When(x => !string.IsNullOrEmpty(x.Subject));

            RuleFor(x => x.EndAt)
                .GreaterThanOrEqualTo(x => x.StartAt)
                .When(x => x.StartAt.HasValue && x.EndAt.HasValue)
                .WithMessage("End time must be after or equal to start time");
        }

        private bool BeValidActivityType(string type) =>
            new[] { "email", "call", "meeting", "task", "note", "contract", "reminder", "other" }.Contains(type);

        private bool BeValidStatus(string status) =>
            new[] { "open", "in_progress", "completed", "cancelled", "overdue" }.Contains(status);

        private bool BeValidPriority(string priority) =>
            new[] { "low", "normal", "high", "urgent" }.Contains(priority);
    }
}
