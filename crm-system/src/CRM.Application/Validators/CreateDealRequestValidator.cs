using CRMSys.Application.Dtos.Request;
using FluentValidation;

namespace CRMSys.Application.Validators
{
    /// <summary>
    /// Validator for CreateDealRequest
    /// </summary>
    public class CreateDealRequestValidator : AbstractValidator<CreateDealRequest>
    {
        public CreateDealRequestValidator()
        {
            // Required fields
            RuleFor(x => x.Name)
                .NotEmpty()
                .WithMessage("Name is required")
                .MaximumLength(255)
                .WithMessage("Name cannot exceed 255 characters");

            RuleFor(x => x.Stage)
                .NotEmpty()
                .WithMessage("Stage is required")
                .Must(BeValidStage)
                .WithMessage("Stage must be one of: Prospecting, Quotation, Proposal, Negotiation, Closed Won, Closed Lost, On Hold");

            // Optional fields validation
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

            // RuleFor(x => x.CloseDate)
            //     .GreaterThan(DateTime.UtcNow.AddDays(-1))
            //     .When(x => x.CloseDate.HasValue)
            //     . WithMessage("Close date cannot be in thepast");

            RuleFor(x => x.Note)
                .MaximumLength(5000)
                .WithMessage("Note cannot exceed 5000 characters")
                .When(x => !string.IsNullOrEmpty(x.Note));
        }

        private bool BeValidStage(string stage)
        {
            var validStages = new[] { "Prospecting", "Quotation", "Proposal", "Negotiation", "Closed Won", "Closed Lost", "On Hold" };
            return validStages.Contains(stage);
        }
    }
}
