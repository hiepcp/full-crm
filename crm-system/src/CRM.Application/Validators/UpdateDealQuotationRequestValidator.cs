using CRMSys.Application.Dtos.Request;
using FluentValidation;

namespace CRMSys.Application.Validators
{
    /// <summary>
    /// Validator for UpdateDealQuotationRequest
    /// </summary>
    public class UpdateDealQuotationRequestValidator : AbstractValidator<UpdateDealQuotationRequest>
    {
        public UpdateDealQuotationRequestValidator()
        {
            // Id validation
            RuleFor(x => x.Id)
                .GreaterThan(0)
                .WithMessage("ID must be a positive number");

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


