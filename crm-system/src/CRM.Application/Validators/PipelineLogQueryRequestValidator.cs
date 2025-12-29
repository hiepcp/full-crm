using CRMSys.Application.Dtos.Request;
using FluentValidation;

namespace CRMSys.Application.Validators
{
    /// <summary>
    /// Validator for PipelineLogQueryRequest
    /// </summary>
    public class PipelineLogQueryRequestValidator : AbstractValidator<PipelineLogQueryRequest>
    {
        public PipelineLogQueryRequestValidator()
        {
            // Pagination validation
            RuleFor(x => x.Page)
                .GreaterThan(0)
                .WithMessage("Page number must be greater than 0");

            RuleFor(x => x.PageSize)
                .InclusiveBetween(1, 100)
                .WithMessage("Page size must be between 1 and 100");

            RuleFor(x => x.Top)
                .GreaterThanOrEqualTo(0)
                .When(x => x.Top.HasValue)
                .WithMessage("Top value must be non-negative");

            // Deal ID validation
            RuleFor(x => x.DealId)
                .GreaterThan(0)
                .When(x => x.DealId.HasValue)
                .WithMessage("Deal ID must be greater than 0");

            // Stage validation
            RuleFor(x => x.OldStage)
                .Must(BeValidStage)
                .When(x => !string.IsNullOrEmpty(x.OldStage))
                .WithMessage("Old stage must be one of: Prospecting, Quotation, Proposal, Negotiation, Closed Won, Closed Lost, On Hold");

            RuleFor(x => x.NewStage)
                .Must(BeValidStage)
                .When(x => !string.IsNullOrEmpty(x.NewStage))
                .WithMessage("New stage must be one of: Prospecting, Quotation, Proposal, Negotiation, Closed Won, Closed Lost, On Hold");

            // Date range validation
            RuleFor(x => x)
                .Must(HaveValidDateRanges)
                .WithMessage("From dates cannot be later than To dates");
        }

        private bool BeValidStage(string? stage)
        {
            var validStages = new[] { "Prospecting", "Quotation", "Proposal", "Negotiation", "Closed Won", "Closed Lost", "On Hold" };
            return validStages.Contains(stage);
        }

        private bool HaveValidDateRanges(PipelineLogQueryRequest request)
        {
            if (request.ChangedAtFrom.HasValue && request.ChangedAtTo.HasValue)
            {
                if (request.ChangedAtFrom.Value > request.ChangedAtTo.Value)
                    return false;
            }

            if (request.CreatedOnFrom.HasValue && request.CreatedOnTo.HasValue)
            {
                if (request.CreatedOnFrom.Value > request.CreatedOnTo.Value)
                    return false;
            }

            return true;
        }
    }
}
