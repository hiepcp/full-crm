using CRMSys.Application.Dtos.Request;
using FluentValidation;

namespace CRMSys.Application.Validators
{
    /// <summary>
    /// Validator for CustomerQueryRequest
    /// </summary>
    public class CustomerQueryRequestValidator : AbstractValidator<CustomerQueryRequest>
    {
        public CustomerQueryRequestValidator()
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

            // Search validation
            RuleFor(x => x.Name)
                .MaximumLength(255)
                .WithMessage("Name cannot exceed 255 characters")
                .When(x => !string.IsNullOrEmpty(x.Name));

            RuleFor(x => x.Domain)
                .MaximumLength(253)
                .WithMessage("Domain cannot exceed 253 characters")
                .When(x => !string.IsNullOrEmpty(x.Domain));

            RuleFor(x => x.Email)
                .EmailAddress()
                .When(x => !string.IsNullOrEmpty(x.Email))
                .WithMessage("Invalid email format");

            // Type validation
            RuleFor(x => x.Type)
                .Must(BeValidType)
                .When(x => !string.IsNullOrEmpty(x.Type))
                .WithMessage("Type must be one of: Customer, Prospect, Partner, Supplier, Other");

            // Country validation
            RuleFor(x => x.Country)
                .MaximumLength(3)
                .WithMessage("Country code cannot exceed 3 characters")
                .When(x => !string.IsNullOrEmpty(x.Country));

            // Industry validation
            RuleFor(x => x.Industry)
                .MaximumLength(100)
                .WithMessage("Industry cannot exceed 100 characters")
                .When(x => !string.IsNullOrEmpty(x.Industry));
        }

        private bool BeValidType(string? type)
        {
            var validTypes = new[] { "Customer", "Prospect", "Partner", "Supplier", "Other" };
            return validTypes.Contains(type);
        }
    }
}
