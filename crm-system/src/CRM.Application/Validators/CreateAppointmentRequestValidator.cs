using CRMSys.Application.Dtos.Request;
using FluentValidation;

namespace CRMSys.Application.Validators
{
    public class CreateAppointmentRequestValidator : AbstractValidator<CreateAppointmentRequest>
    {
        public CreateAppointmentRequestValidator()
        {
            RuleFor(x => x.Subject).MaximumLength(500).When(x => !string.IsNullOrEmpty(x.Subject));
            RuleFor(x => x.BodyContent).MaximumLength(50000).When(x => !string.IsNullOrEmpty(x.BodyContent));
            RuleFor(x => x.BodyContentType).NotEmpty();
            RuleFor(x => x.StartDateTime).NotEmpty();
            RuleFor(x => x.EndDateTime)
                .GreaterThanOrEqualTo(x => x.StartDateTime)
                .When(x => x.EndDateTime.HasValue);
            RuleFor(x => x.Importance)
                .Must(BeValidImportance)
                .WithMessage("Invalid importance");
        }

        private bool BeValidImportance(string importance) =>
            new[] { "low", "normal", "high" }.Contains((importance ?? string.Empty).ToLower());
    }
}



