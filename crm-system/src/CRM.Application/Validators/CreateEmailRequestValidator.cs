using CRMSys.Application.Dtos.Request;
using FluentValidation;

namespace CRMSys.Application.Validators
{
    public class CreateEmailRequestValidator : AbstractValidator<CreateEmailRequest>
    {
        public CreateEmailRequestValidator()
        {
            RuleFor(x => x.MailId).NotEmpty().When(x => !string.IsNullOrEmpty(x.MailId));
            RuleFor(x => x.Subject).MaximumLength(500).When(x => !string.IsNullOrEmpty(x.Subject));
            RuleFor(x => x.BodyPreview).MaximumLength(1000).When(x => !string.IsNullOrEmpty(x.BodyPreview));
            RuleFor(x => x.BodyContent).MaximumLength(50000).When(x => !string.IsNullOrEmpty(x.BodyContent));

            RuleFor(x => x.Importance)
                .Must(BeValidImportance)
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

        private bool BeValidImportance(string importance) =>
            new[] { "low", "normal", "high" }.Contains(importance);
    }
}
