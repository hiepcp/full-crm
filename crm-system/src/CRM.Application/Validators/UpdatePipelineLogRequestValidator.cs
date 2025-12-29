using CRMSys.Application.Dtos.Request;
using FluentValidation;

namespace CRMSys.Application.Validators
{
    /// <summary>
    /// Validator for UpdatePipelineLogRequest
    /// </summary>
    public class UpdatePipelineLogRequestValidator : AbstractValidator<UpdatePipelineLogRequest>
    {
        public UpdatePipelineLogRequestValidator()
        {
            // New stage validation (optional for updates)
            RuleFor(x => x.NewStage)
                .Must(BeValidStage)
                .When(x => !string.IsNullOrEmpty(x.NewStage))
                .WithMessage("New stage must be one of: Prospecting, Quotation, Proposal, Negotiation, Closed Won, Closed Lost, On Hold");

            // Old stage validation (optional)
            RuleFor(x => x.OldStage)
                .Must(BeValidStage)
                .When(x => !string.IsNullOrEmpty(x.OldStage))
                .WithMessage("Old stage must be one of: Prospecting, Quotation, Proposal, Negotiation, Closed Won, Closed Lost, On Hold");

            // Changed at validation
            RuleFor(x => x.ChangedAt)
                .LessThanOrEqualTo(DateTime.UtcNow)
                .When(x => x.ChangedAt.HasValue)
                .WithMessage("Changed date cannot be in the future");

            // Notes validation
            RuleFor(x => x.Notes)
                .MaximumLength(1000)
                .When(x => !string.IsNullOrEmpty(x.Notes))
                .WithMessage("Notes cannot exceed 1000 characters");
        }

        private bool BeValidStage(string? stage)
        {
            var validStages = new[] { "Prospecting", "Quotation", "Proposal", "Negotiation", "Closed Won", "Closed Lost", "On Hold" };
            return validStages.Contains(stage);
        }
    }
}
