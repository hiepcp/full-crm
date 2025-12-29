using CRMSys.Application.Dtos.Request;
using FluentValidation;

namespace CRMSys.Application.Validators
{
    public class QuotationQueryRequestValidator : AbstractValidator<QuotationQueryRequest>
    {
        public QuotationQueryRequestValidator()
        {
            RuleFor(x => x.Page).GreaterThan(0);
            RuleFor(x => x.PageSize).InclusiveBetween(1, 100);
            RuleFor(x => x.Top).GreaterThanOrEqualTo(0).When(x => x.Top.HasValue);

            RuleFor(x => x.Status)
                .Must(BeValidStatus)
                .When(x => !string.IsNullOrEmpty(x.Status))
                .WithMessage("Invalid status");

            RuleFor(x => x)
                .Must(HaveValidAmountRange)
                .WithMessage("Min amount cannot be greater than max amount");
        }

        private bool BeValidStatus(string? status) =>
            new[] { "draft", "sent", "accepted", "rejected", "expired", "cancelled" }.Contains(status);

        private bool HaveValidAmountRange(QuotationQueryRequest request)
        {
            if (!request.MinTotalAmount.HasValue || !request.MaxTotalAmount.HasValue)
                return true;

            return request.MinTotalAmount.Value <= request.MaxTotalAmount.Value;
        }
    }
}
