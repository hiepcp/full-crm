using CRMSys.Application.Dtos.Request;
using FluentValidation;

namespace CRMSys.Application.Validators
{
    /// <summary>
    /// Validator for CreateContactRequest
    /// </summary>
    public class CreateContactRequestValidator : AbstractValidator<CreateContactRequest>
    {
        public CreateContactRequestValidator()
        {
            // Required fields
            RuleFor(x => x.FirstName)
                .NotEmpty()
                .WithMessage("First name is required")
                .MaximumLength(128)
                .WithMessage("First name cannot exceed 128 characters");

            // Optional fields validation
            RuleFor(x => x.LastName)
                .MaximumLength(128)
                .WithMessage("Last name cannot exceed 128 characters")
                .When(x => !string.IsNullOrEmpty(x.LastName));

            RuleFor(x => x.Email)
                .EmailAddress()
                .When(x => !string.IsNullOrEmpty(x.Email))
                .WithMessage("Invalid email format");

            RuleFor(x => x.Phone)
                .MaximumLength(64)
                .WithMessage("Phone cannot exceed 64 characters")
                .When(x => !string.IsNullOrEmpty(x.Phone));

            RuleFor(x => x.MobilePhone)
                .MaximumLength(64)
                .WithMessage("Mobile phone cannot exceed 64 characters")
                .When(x => !string.IsNullOrEmpty(x.MobilePhone));

            RuleFor(x => x.Fax)
                .MaximumLength(64)
                .WithMessage("Fax cannot exceed 64 characters")
                .When(x => !string.IsNullOrEmpty(x.Fax));

            RuleFor(x => x.JobTitle)
                .MaximumLength(255)
                .WithMessage("Job title cannot exceed 255 characters")
                .When(x => !string.IsNullOrEmpty(x.JobTitle));

            RuleFor(x => x.Salutation)
                .MaximumLength(20)
                .WithMessage("Salutation cannot exceed 20 characters")
                .When(x => !string.IsNullOrEmpty(x.Salutation));

            RuleFor(x => x.Address)
                .MaximumLength(1000)
                .WithMessage("Address cannot exceed 1000 characters")
                .When(x => !string.IsNullOrEmpty(x.Address));

            RuleFor(x => x.Notes)
                .MaximumLength(5000)
                .WithMessage("Notes cannot exceed 5000 characters")
                .When(x => !string.IsNullOrEmpty(x.Notes));
        }
    }
}
