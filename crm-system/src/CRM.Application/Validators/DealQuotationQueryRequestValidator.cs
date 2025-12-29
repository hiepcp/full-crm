using CRMSys.Application.Dtos.Request;
using FluentValidation;

namespace CRMSys.Application.Validators
{
    /// <summary>
    /// Validator for DealQuotationQueryRequest
    /// </summary>
    public class DealQuotationQueryRequestValidator : AbstractValidator<DealQuotationQueryRequest>
    {
        public DealQuotationQueryRequestValidator()
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

            // ID filters validation
            RuleFor(x => x.DealId)
                .GreaterThan(0)
                .When(x => x.DealId.HasValue)
                .WithMessage("Deal ID must be a positive number");

            RuleFor(x => x.QuotationNumber)
                .MaximumLength(50)
                .When(x => !string.IsNullOrEmpty(x.QuotationNumber))
                .WithMessage("Quotation number must be 50 characters or fewer");

            // Date range validation
            RuleFor(x => x)
                .Must(HaveValidDateRanges)
                .WithMessage("From dates cannot be later than To dates");
        }

        private bool HaveValidDateRanges(DealQuotationQueryRequest request)
        {
            if (request.CreatedFrom.HasValue && request.CreatedTo.HasValue)
            {
                if (request.CreatedFrom.Value > request.CreatedTo.Value)
                    return false;
            }

            if (request.UpdatedFrom.HasValue && request.UpdatedTo.HasValue)
            {
                if (request.UpdatedFrom.Value > request.UpdatedTo.Value)
                    return false;
            }

            return true;
        }
    }
}

