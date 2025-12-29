using CRMSys.Application.Dtos.Request;
using FluentValidation;

namespace CRMSys.Application.Validators
{
    public class UpdateActivityParticipantRequestValidator : AbstractValidator<UpdateActivityParticipantRequest>
    {
        public UpdateActivityParticipantRequestValidator()
        {
            RuleFor(x => x.Role).Must(role => string.IsNullOrEmpty(role) || new[] { "attendee", "organizer", "to", "cc", "bcc" }.Contains(role))
                .WithMessage("Invalid role value");
        }
    }
}

