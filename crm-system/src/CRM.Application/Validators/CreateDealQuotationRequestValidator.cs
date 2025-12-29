using CRMSys.Application.Dtos.Request;
using FluentValidation;

namespace CRMSys.Application.Validators
{
    /// <summary>
    /// Validator for CreateDealQuotationRequest
    /// </summary>
    public class CreateDealQuotationRequestValidator : AbstractValidator<CreateDealQuotationRequest>
    {
        public CreateDealQuotationRequestValidator()
        {
            // DealId validation
            RuleFor(x => x.DealId)
                .GreaterThan(0)
                .WithMessage("Deal ID must be a positive number");

            // QuotationNumber validation
            RuleFor(x => x.QuotationNumber)
                .NotEmpty()
                .MaximumLength(50)
                .WithMessage("Quotation number is required and must be 50 characters or fewer");
        }
    }
}


