using CRMSys.Application.Dtos.Request;
using FluentValidation;

namespace CRMSys.Application.Validators
{
    public class EmailQueryRequestValidator : AbstractValidator<EmailQueryRequest>
    {
        public EmailQueryRequestValidator()
        {
            RuleFor(x => x.Page).GreaterThan(0);
            RuleFor(x => x.PageSize).InclusiveBetween(1, 100);
            RuleFor(x => x.Top).GreaterThanOrEqualTo(0).When(x => x.Top.HasValue);
            RuleFor(x => x.ActivityId).GreaterThan(0).When(x => x.ActivityId.HasValue);

            RuleFor(x => x.Importance)
                .Must(BeValidImportance)
                .When(x => !string.IsNullOrEmpty(x.Importance))
                .WithMessage("Invalid importance");

            RuleFor(x => x.FromAddress)
                .EmailAddress()
                .When(x => !string.IsNullOrEmpty(x.FromAddress))
                .WithMessage("Invalid from address");

            RuleFor(x => x.SenderAddress)
                .EmailAddress()
                .When(x => !string.IsNullOrEmpty(x.SenderAddress))
                .WithMessage("Invalid sender address");
        }

        private bool BeValidImportance(string? importance) =>
            new[] { "low", "normal", "high" }.Contains(importance);
    }
}
