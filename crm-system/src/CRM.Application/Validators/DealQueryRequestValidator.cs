using CRMSys.Application.Dtos.Request;
using FluentValidation;

namespace CRMSys.Application.Validators
{
    /// <summary>
    /// Validator for DealQueryRequest
    /// </summary>
    public class DealQueryRequestValidator : AbstractValidator<DealQueryRequest>
    {
        public DealQueryRequestValidator()
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

            // Revenue range validation
            RuleFor(x => x)
                .Must(HaveValidRevenueRange)
                .WithMessage("Minimum revenue cannot be greater than maximum revenue");

            // Date range validation
            RuleFor(x => x)
                .Must(HaveValidDateRanges)
                .WithMessage("From dates cannot be later than To dates");

            // Stage validation
            RuleFor(x => x.Stage)
                .Must(BeValidStage)
                .When(x => !string.IsNullOrEmpty(x.Stage))
                .WithMessage("Stage must be one of: Prospecting, Quotation, Proposal, Negotiation, Closed Won, Closed Lost, On Hold");
        }

        private bool BeValidStage(string? stage)
        {
            var validStages = new[] { "Prospecting", "Quotation", "Proposal", "Negotiation", "Closed Won", "Closed Lost", "On Hold" };
            return validStages.Contains(stage);
        }

        private bool HaveValidRevenueRange(DealQueryRequest request)
        {
            if (!request.MinExpectedRevenue.HasValue || !request.MaxExpectedRevenue.HasValue)
                return true;

            return request.MinExpectedRevenue.Value <= request.MaxExpectedRevenue.Value;
        }

        private bool HaveValidDateRanges(DealQueryRequest request)
        {
            if (request.CloseDateFrom.HasValue && request.CloseDateTo.HasValue)
            {
                if (request.CloseDateFrom.Value > request.CloseDateTo.Value)
                    return false;
            }

            return true;
        }
    }
}
