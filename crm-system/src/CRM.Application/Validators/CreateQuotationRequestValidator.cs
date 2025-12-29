using CRMSys.Application.Dtos.Request;
using FluentValidation;

namespace CRMSys.Application.Validators
{
    public class CreateQuotationRequestValidator : AbstractValidator<CreateQuotationRequest>
    {
        public CreateQuotationRequestValidator()
        {
            RuleFor(x => x.QuotationNumber)
                .NotEmpty()
                .MaximumLength(50)
                .WithMessage("Quotation number is required and cannot exceed 50 characters");

            RuleFor(x => x.Name)
                .NotEmpty()
                .MaximumLength(255)
                .WithMessage("Name is required and cannot exceed 255 characters");

            RuleFor(x => x.Status)
                .NotEmpty()
                .Must(BeValidStatus)
                .WithMessage("Invalid status");

            RuleFor(x => x.TotalAmount)
                .GreaterThanOrEqualTo(0)
                .When(x => x.TotalAmount.HasValue)
                .WithMessage("Total amount cannot be negative");

            RuleFor(x => x.ValidUntil)
                .GreaterThan(DateTime.UtcNow)
                .When(x => x.ValidUntil.HasValue)
                .WithMessage("Valid until date must be in the future");

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

        private bool BeValidStatus(string status) =>
            new[] { "draft", "sent", "accepted", "rejected", "expired", "cancelled" }.Contains(status);
    }
}
