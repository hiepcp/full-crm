using CRMSys.Application.Dtos.Request;
using FluentValidation;

namespace CRMSys.Application.Validators
{
    public class UserQueryRequestValidator : AbstractValidator<UserQueryRequest>
    {
        public UserQueryRequestValidator()
        {
            RuleFor(x => x.Page).GreaterThan(0);
            RuleFor(x => x.PageSize).InclusiveBetween(1, 100);
            RuleFor(x => x.Top).GreaterThanOrEqualTo(0).When(x => x.Top.HasValue);

            RuleFor(x => x.Email)
                .EmailAddress()
                .When(x => !string.IsNullOrEmpty(x.Email))
                .WithMessage("Invalid email format");

            RuleFor(x => x.Role)
                .Must(BeValidRole)
                .When(x => !string.IsNullOrEmpty(x.Role))
                .WithMessage("Invalid role");
        }

        private bool BeValidRole(string? role) =>
            new[] { "admin", "manager", "sales", "support", "user" }.Contains(role);
    }
}
