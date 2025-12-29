using CRMSys.Application.Dtos.Request;
using FluentValidation;

namespace CRMSys.Application.Validators
{
    public class CreateEmailTemplateRequestValidator : AbstractValidator<CreateEmailTemplateRequest>
    {
        public CreateEmailTemplateRequestValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Template name is required")
                .MaximumLength(255).WithMessage("Name cannot exceed 255 characters");

            RuleFor(x => x.Subject)
                .NotEmpty().WithMessage("Subject is required")
                .MaximumLength(500).WithMessage("Subject cannot exceed 500 characters");

            RuleFor(x => x.Body)
                .NotEmpty().WithMessage("Email body is required");

            RuleFor(x => x.Description)
                .MaximumLength(1000).WithMessage("Description cannot exceed 1000 characters")
                .When(x => !string.IsNullOrEmpty(x.Description));

            RuleFor(x => x.Category)
                .IsInEnum().WithMessage("Invalid category. Must be a valid EmailTemplateCategory value.");
        }
    }
}
