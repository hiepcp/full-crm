using CRMSys.Application.Dtos.Request;
using FluentValidation;

namespace CRMSys.Application.Validators
{
    /// <summary>
    /// Validator for UpdateDealRequest
    /// </summary>
    public class UpdateDealRequestValidator : AbstractValidator<UpdateDealRequest>
    {
        public UpdateDealRequestValidator()
        {
            // Optional fields validation (only validate if provided)
            RuleFor(x => x.Name)
                .MaximumLength(255)
                .WithMessage("Name cannot exceed 255 characters")
                .When(x => !string.IsNullOrEmpty(x.Name));

            RuleFor(x => x.Stage)
                .Must(BeValidStage)
                .When(x => !string.IsNullOrEmpty(x.Stage))
                .WithMessage("Stage must be one of: Prospecting, Quotation, Proposal, Negotiation, Closed Won, Closed Lost, On Hold");

            RuleFor(x => x.Description)
                .MaximumLength(2000)
                .WithMessage("Description cannot exceed 2000 characters")
                .When(x => !string.IsNullOrEmpty(x.Description));

            RuleFor(x => x.ExpectedRevenue)
                .GreaterThanOrEqualTo(0)
                .When(x => x.ExpectedRevenue.HasValue)
                .WithMessage("Expected revenue cannot be negative");

            RuleFor(x => x.ActualRevenue)
                .GreaterThanOrEqualTo(0)
                .When(x => x.ActualRevenue.HasValue)
                .WithMessage("Actual revenue cannot be negative");

            RuleFor(x => x.Note)
                .MaximumLength(5000)
                .WithMessage("Note cannot exceed 5000 characters")
                .When(x => !string.IsNullOrEmpty(x.Note));
        }

        private bool BeValidStage(string? stage)
        {
            var validStages = new[] { "Prospecting", "Quotation", "Proposal", "Negotiation", "Closed Won", "Closed Lost", "On Hold" };
            return validStages.Contains(stage);
        }
    }
}
