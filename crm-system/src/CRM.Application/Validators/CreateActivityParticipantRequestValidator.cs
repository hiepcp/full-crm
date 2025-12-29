using CRMSys.Application.Dtos.Request;
using FluentValidation;

namespace CRMSys.Application.Validators
{
    public class CreateActivityParticipantRequestValidator : AbstractValidator<CreateActivityParticipantRequest>
    {
        public CreateActivityParticipantRequestValidator()
        {
            RuleFor(x => x.ActivityId).GreaterThan(0);
            RuleFor(x => x).Must(x => x.ContactId.HasValue || x.UserId.HasValue)
                .WithMessage("Either ContactId or UserId must be provided");
            RuleFor(x => x.Role).NotEmpty();
        }
    }
}

