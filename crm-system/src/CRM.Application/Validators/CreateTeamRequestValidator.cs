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
        }
    }
}