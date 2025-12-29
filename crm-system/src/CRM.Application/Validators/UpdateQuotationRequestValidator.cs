using CRMSys.Application.Dtos.Request;
using FluentValidation;

namespace CRMSys.Application.Validators
{
    public class UpdateQuotationRequestValidator : AbstractValidator<UpdateQuotationRequest>
    {
        public UpdateQuotationRequestValidator()
        {
            RuleFor(x => x.QuotationNumber)
                .MaximumLength(50)
                .When(x => !string.IsNullOrEmpty(x.QuotationNumber))
                .WithMessage("Quotation number cannot exceed 50 characters");

            RuleFor(x => x.Name)
                .MaximumLength(255)
                .When(x => !string.IsNullOrEmpty(x.Name))
                .WithMessage("Name cannot exceed 255 characters");

            RuleFor(x => x.Status)
                .Must(BeValidStatus)
                .When(x => !string.IsNullOrEmpty(x.Status))
                .WithMessage("Invalid status");

            RuleFor(x => x.TotalAmount)
                .GreaterThanOrEqualTo(0)
                .When(x => x.TotalAmount.HasValue)
                .WithMessage("Total amount cannot be negative");

            RuleFor(x => x.Description)
                .MaximumLength(2000)
                .When(x => !string.IsNullOrEmpty(x.Description));

            RuleFor(x => x.Notes)
                .MaximumLength(5000)
                .When(x => !string.IsNullOrEmpty(x.Notes));

            RuleFor(x => x.CustomerId)
                .GreaterThan(0)
                .When(x => x.CustomerId.HasValue)
                .WithMessage("CustomerId must be a positive number");
        }

        private bool BeValidStatus(string? status) =>
            new[] { "draft", "sent", "accepted", "rejected", "expired", "cancelled" }.Contains(status);
    }
}
