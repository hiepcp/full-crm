using CRMSys.Application.Dtos.Teams;
using FluentValidation;

namespace CRMSys.Application.Validators
{
    public class TeamMemberRequestValidator : AbstractValidator<TeamMemberRequest>
    {
        public TeamMemberRequestValidator()
        {
            RuleFor(x => x.UserEmail)
                .NotEmpty().WithMessage("User email is required")
                .EmailAddress().WithMessage("Valid email is required");

            RuleFor(x => x.Role)
                .IsInEnum().WithMessage("Invalid role");
        }
    }
}