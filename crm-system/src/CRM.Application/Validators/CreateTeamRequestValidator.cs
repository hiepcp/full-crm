using CRMSys.Application.Dtos.Teams;
using FluentValidation;

namespace CRMSys.Application.Validators
{
    public class CreateTeamRequestValidator : AbstractValidator<CreateTeamRequest>
    {
        public CreateTeamRequestValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Team name is required")
                .MaximumLength(255).WithMessage("Team name must be 255 characters or less");

            RuleFor(x => x.Description)
                .MaximumLength(2000).WithMessage("Description must be 2000 characters or less")
                .When(x => !string.IsNullOrEmpty(x.Description));

            RuleFor(x => x.GroupMail)
                .NotEmpty().WithMessage("Group email is required")
                .EmailAddress().WithMessage("Group email must be a valid email address")
                .MaximumLength(255).WithMessage("Group email must not exceed 255 characters");
        }
    }
}