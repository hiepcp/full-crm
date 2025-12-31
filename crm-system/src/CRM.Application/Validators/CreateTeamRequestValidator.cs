using CRMSys.Application.Dtos.Teams;
using CRMSys.Infrastructure.Repositories;
using FluentValidation;

namespace CRMSys.Application.Validators
{
    public class CreateTeamRequestValidator : AbstractValidator<CreateTeamRequest>
    {
        private readonly ISalesTeamRepository _salesTeamRepository;

        public CreateTeamRequestValidator(ISalesTeamRepository salesTeamRepository)
        {
            _salesTeamRepository = salesTeamRepository;

            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Team name is required")
                .MaximumLength(255).WithMessage("Team name must be 255 characters or less")
                .MustAsync(BeUniqueTeamNameAsync).WithMessage("Team name must be unique");

            RuleFor(x => x.Description)
                .MaximumLength(2000).WithMessage("Description must be 2000 characters or less")
                .When(x => !string.IsNullOrEmpty(x.Description));
        }

        private async Task<bool> BeUniqueTeamNameAsync(string name, CancellationToken ct)
        {
            return await _salesTeamRepository.IsNameUniqueAsync(name, ct);
        }
    }
}