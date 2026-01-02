using CRMSys.Application.Dtos.Teams;
using FluentValidation;

namespace CRMSys.Application.Validators
{
    public class UpdateTeamRequestValidator : AbstractValidator<UpdateTeamRequest>
    {
        public UpdateTeamRequestValidator()
        {
            RuleFor(x => x.Name)
                .MaximumLength(255).WithMessage("Team name must be 255 characters or less")
                .When(x => !string.IsNullOrEmpty(x.Name));

            RuleFor(x => x.Description)
                .MaximumLength(2000).WithMessage("Description must be 2000 characters or less")
                .When(x => !string.IsNullOrEmpty(x.Description));

            RuleFor(x => x.GroupMail)
                .EmailAddress().WithMessage("Group email must be a valid email address")
                .MaximumLength(255).WithMessage("Group email must not exceed 255 characters")
                .When(x => !string.IsNullOrEmpty(x.GroupMail));

            RuleFor(x => x)
                .Must(HaveAtLeastOneField)
                .WithMessage("At least one field must be provided for update");
        }

        private bool HaveAtLeastOneField(UpdateTeamRequest request)
        {
            return !string.IsNullOrEmpty(request.Name) ||
                   !string.IsNullOrEmpty(request.Description) ||
                   !string.IsNullOrEmpty(request.GroupMail);
        }
    }
}