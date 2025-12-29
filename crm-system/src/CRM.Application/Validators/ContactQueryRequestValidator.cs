using CRMSys.Application.Dtos.Request;
using FluentValidation;

namespace CRMSys.Application.Validators
{
    /// <summary>
    /// Validator for ContactQueryRequest
    /// </summary>
    public class ContactQueryRequestValidator : AbstractValidator<ContactQueryRequest>
    {
        public ContactQueryRequestValidator()
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

            // Field validation
            RuleFor(x => x.Email)
                .EmailAddress()
                .When(x => !string.IsNullOrEmpty(x.Email))
                .WithMessage("Invalid email format");

            RuleFor(x => x.FirstName)
                .MaximumLength(128)
                .WithMessage("First name cannot exceed 128 characters")
                .When(x => !string.IsNullOrEmpty(x.FirstName));

            RuleFor(x => x.LastName)
                .MaximumLength(128)
                .WithMessage("Last name cannot exceed 128 characters")
                .When(x => !string.IsNullOrEmpty(x.LastName));
        }
    }
}
