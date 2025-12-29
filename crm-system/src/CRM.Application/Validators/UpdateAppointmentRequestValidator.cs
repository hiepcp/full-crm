using CRMSys.Application.Dtos.Request;
using FluentValidation;

namespace CRMSys.Application.Validators
{
    public class UpdateAppointmentRequestValidator : AbstractValidator<UpdateAppointmentRequest>
    {
        public UpdateAppointmentRequestValidator()
        {
            RuleFor(x => x.Subject).MaximumLength(500).When(x => !string.IsNullOrEmpty(x.Subject));
            RuleFor(x => x.BodyContent).MaximumLength(50000).When(x => !string.IsNullOrEmpty(x.BodyContent));
            RuleFor(x => x.BodyContentType).NotEmpty();
            RuleFor(x => x.StartDateTime).NotEmpty().When(x => x.StartDateTime.HasValue || x.EndDateTime.HasValue);
            RuleFor(x => x.EndDateTime)
                .GreaterThanOrEqualTo(x => x.StartDateTime.Value)
                .When(x => x.EndDateTime.HasValue && x.StartDateTime.HasValue);
            RuleFor(x => x.Importance)
                .Must(BeValidImportance)
                .WithMessage("Invalid importance")
                .When(x => !string.IsNullOrEmpty(x.Importance));
        }

        private bool BeValidImportance(string? importance) =>
            new[] { "low", "normal", "high" }.Contains((importance ?? string.Empty).ToLower());
    }
}



