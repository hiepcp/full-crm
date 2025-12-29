using CRMSys.Application.Dtos.Request;
using FluentValidation;

namespace CRMSys.Application.Validators
{
    /// <summary>
    /// Validator for CreateLeadRequest
    /// </summary>
    public class CreateLeadRequestValidator : AbstractValidator<CreateLeadRequest>
    {
        public CreateLeadRequestValidator()
        {
            // Email validation (optional but must be valid format if provided)
            RuleFor(x => x.Email)
                .EmailAddress()
                .When(x => !string.IsNullOrEmpty(x.Email))
                .WithMessage("Invalid email format");

            // Telephone No validation (optional but must be valid format if provided)
            // Supports international formats with spaces, dashes, parentheses, and dots
            RuleFor(x => x.TelephoneNo)
                .Matches(@"^[\+]?[\d\s\-\(\)\.]{8,20}$")
                .When(x => !string.IsNullOrEmpty(x.TelephoneNo))
                .WithMessage("Invalid telephone number format");

            // Name validations
            RuleFor(x => x.FirstName)
                .MaximumLength(128)
                .WithMessage("First name cannot exceed 128 characters")
                .When(x => !string.IsNullOrEmpty(x.FirstName));

            RuleFor(x => x.LastName)
                .MaximumLength(128)
                .WithMessage("Last name cannot exceed 128 characters")
                .When(x => !string.IsNullOrEmpty(x.LastName));

            RuleFor(x => x.Company)
                .MaximumLength(255)
                .WithMessage("Company name cannot exceed 255 characters")
                .When(x => !string.IsNullOrEmpty(x.Company));

            // Website validation (must be valid domain format if provided)
            RuleFor(x => x.Website)
                .Matches(@"^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$")
                .When(x => !string.IsNullOrEmpty(x.Website))
                .WithMessage("Invalid website format");

            // VAT Number validation (optional, length constraint)
            RuleFor(x => x.VatNumber)
                .MaximumLength(64)
                .When(x => !string.IsNullOrEmpty(x.VatNumber))
                .WithMessage("VAT number cannot exceed 64 characters");

            // Payment terms validation (optional, length constraint)
            RuleFor(x => x.PaymentTerms)
                .MaximumLength(100)
                .When(x => !string.IsNullOrEmpty(x.PaymentTerms))
                .WithMessage("Payment terms cannot exceed 100 characters");

            // Source validation (must be from allowed list if provided)
            RuleFor(x => x.Source)
                .Must(BeValidSource)
                .When(x => !string.IsNullOrEmpty(x.Source))
                .WithMessage("Source must be one of: web, event, referral, ads, facebook, other");

            // Status validation (must be from allowed list if provided)
            RuleFor(x => x.Status)
                .Must(BeValidStatus)
                .When(x => !string.IsNullOrEmpty(x.Status))
                .WithMessage("Status must be one of: working, qualified, unqualified");

            // Score validation
            RuleFor(x => x.Score)
                .InclusiveBetween(0, 100)
                .When(x => x.Score.HasValue)
                .WithMessage("Score must be between 0 and 100");

            // Business rule: At least one contact method required
            RuleFor(x => x)
                .Must(HaveContactMethod)
                .WithMessage("At least email or phone must be provided");

            // Business rule: Qualified leads should have higher scores
            RuleFor(x => x)
                .Must(HaveReasonableScoreForStatus)
                .WithMessage("Qualified leads should have score >= 70, unqualified leads should have score < 70");
        }

        private bool BeValidSource(string? source)
        {
            var validSources = new[] { "web", "event", "referral", "ads", "facebook", "other" };
            return validSources.Contains(source);
        }

        private bool BeValidStatus(string? status)
        {
            var validStatuses = new[] { "working", "qualified", "unqualified" };
            return validStatuses.Contains(status);
        }

        private bool HaveContactMethod(CreateLeadRequest request)
        {
            return !string.IsNullOrEmpty(request.Email) || !string.IsNullOrEmpty(request.TelephoneNo);
        }

        private bool HaveReasonableScoreForStatus(CreateLeadRequest request)
        {
            if (!request.Score.HasValue || string.IsNullOrEmpty(request.Status))
                return true; // Skip validation if score or status not provided

            return request.Status switch
            {
                "qualified" => request.Score.Value >= 70,
                "unqualified" => request.Score.Value < 70,
                _ => true // Other statuses don't have score restrictions
            };
        }
    }
}
