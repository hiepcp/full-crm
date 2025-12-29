using CRMSys.Application.Dtos.Request;
using FluentValidation;

namespace CRMSys.Application.Validators
{
    /// <summary>
    /// Validator for CreateCustomerRequest
    /// </summary>
    public class CreateCustomerRequestValidator : AbstractValidator<CreateCustomerRequest>
    {
        public CreateCustomerRequestValidator()
        {
            // Required fields
            RuleFor(x => x.Name)
                .NotEmpty()
                .WithMessage("Name is required")
                .MaximumLength(255)
                .WithMessage("Name cannot exceed 255 characters");

            RuleFor(x => x.Type)
                .NotEmpty()
                .WithMessage("Type is required")
                .Must(BeValidType)
                .WithMessage("Type must be one of: Customer, Prospect, Partner, Supplier, Other");

            // Optional fields validation
            RuleFor(x => x.Domain)
                .MaximumLength(253)
                .WithMessage("Domain cannot exceed 253 characters")
                .When(x => !string.IsNullOrEmpty(x.Domain));

            RuleFor(x => x.Email)
                .EmailAddress()
                .When(x => !string.IsNullOrEmpty(x.Email))
                .WithMessage("Invalid email format");

            RuleFor(x => x.Phone)
                .MaximumLength(64)
                .WithMessage("Phone cannot exceed 64 characters")
                .When(x => !string.IsNullOrEmpty(x.Phone));

            RuleFor(x => x.Website)
                .MaximumLength(500)
                .WithMessage("Website URL cannot exceed 500 characters")
                .When(x => !string.IsNullOrEmpty(x.Website));

            RuleFor(x => x.Currency)
                .Length(3)
                .WithMessage("Currency must be exactly 3 characters")
                .When(x => !string.IsNullOrEmpty(x.Currency));

            RuleFor(x => x.Country)
                .Length(2, 3)
                .WithMessage("Country code must be 2-3 characters")
                .When(x => !string.IsNullOrEmpty(x.Country));

            RuleFor(x => x.Industry)
                .MaximumLength(100)
                .WithMessage("Industry cannot exceed 100 characters")
                .When(x => !string.IsNullOrEmpty(x.Industry));

            RuleFor(x => x.VatNumber)
                .MaximumLength(50)
                .WithMessage("VAT number cannot exceed 50 characters")
                .When(x => !string.IsNullOrEmpty(x.VatNumber));

            RuleFor(x => x.PaymentTerms)
                .MaximumLength(100)
                .WithMessage("Payment terms cannot exceed 100 characters")
                .When(x => !string.IsNullOrEmpty(x.PaymentTerms));

            RuleFor(x => x.DeliveryTerms)
                .MaximumLength(200)
                .WithMessage("Delivery terms cannot exceed 200 characters")
                .When(x => !string.IsNullOrEmpty(x.DeliveryTerms));

            RuleFor(x => x.ContactPerson)
                .MaximumLength(255)
                .WithMessage("Contact person cannot exceed 255 characters")
                .When(x => !string.IsNullOrEmpty(x.ContactPerson));

            RuleFor(x => x.Notes)
                .MaximumLength(5000)
                .WithMessage("Notes cannot exceed 5000 characters")
                .When(x => !string.IsNullOrEmpty(x.Notes));
        }

        private bool BeValidType(string type)
        {
            var validTypes = new[] { "Customer", "Prospect", "Partner", "Supplier", "Other" };
            return validTypes.Contains(type);
        }
    }
}
