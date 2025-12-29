using CRMSys.Application.Dtos.Request;
using FluentValidation;

namespace CRMSys.Application.Validators
{
    public class UpdateEmailRequestValidator : AbstractValidator<UpdateEmailRequest>
    {
        public UpdateEmailRequestValidator()
        {
            RuleFor(x => x.MailId).MaximumLength(255).When(x => !string.IsNullOrEmpty(x.MailId));
            RuleFor(x => x.Subject).MaximumLength(500).When(x => !string.IsNullOrEmpty(x.Subject));
            RuleFor(x => x.BodyPreview).MaximumLength(1000).When(x => !string.IsNullOrEmpty(x.BodyPreview));
            RuleFor(x => x.BodyContent).MaximumLength(50000).When(x => !string.IsNullOrEmpty(x.BodyContent));

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
