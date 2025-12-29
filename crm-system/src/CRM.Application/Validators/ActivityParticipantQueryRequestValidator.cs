using CRMSys.Application.Dtos.Request;
using FluentValidation;

namespace CRMSys.Application.Validators
{
    public class ActivityParticipantQueryRequestValidator : AbstractValidator<ActivityParticipantQueryRequest>
    {
        public ActivityParticipantQueryRequestValidator()
        {
            RuleFor(x => x.Page).GreaterThan(0);
            RuleFor(x => x.PageSize).InclusiveBetween(1, 100);

            When(x => !string.IsNullOrEmpty(x.Role), () =>
            {
                RuleFor(x => x.Role!).Must(r => new[] { "attendee", "organizer", "to", "cc", "bcc" }.Contains(r!))
                    .WithMessage("Invalid role value");
            });
        }
    }
}

