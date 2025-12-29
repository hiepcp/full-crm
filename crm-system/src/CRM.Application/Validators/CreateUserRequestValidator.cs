using CRMSys.Application.Dtos.Request;
using FluentValidation;

namespace CRMSys.Application.Validators
{
    public class CreateUserRequestValidator : AbstractValidator<CreateUserRequest>
    {
        public CreateUserRequestValidator()
        {
            RuleFor(x => x.Email)
                .NotEmpty()
                .EmailAddress()
                .WithMessage("Valid email is required");

            RuleFor(x => x.FirstName)
                .MaximumLength(128)
                .When(x => !string.IsNullOrEmpty(x.FirstName));

            RuleFor(x => x.LastName)
                .MaximumLength(128)
                .When(x => !string.IsNullOrEmpty(x.LastName));

            RuleFor(x => x.Role)
                .NotEmpty()
                .WithMessage("Role is required")
                .Must(BeValidRole)
                .When(x => !string.IsNullOrEmpty(x.Role))
                .WithMessage("Invalid role");

            RuleFor(x => x.Avatar)
                .MaximumLength(500)
                .When(x => !string.IsNullOrEmpty(x.Avatar));
        }

        private bool BeValidRole(string? role) =>
            new[] { "admin", "manager", "sales", "support", "user" }.Contains(role);
    }
}
