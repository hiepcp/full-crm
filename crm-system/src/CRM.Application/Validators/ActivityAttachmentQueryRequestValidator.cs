using CRMSys.Application.Dtos.Request;
using FluentValidation;

namespace CRMSys.Application.Validators
{
    public class ActivityAttachmentQueryRequestValidator : AbstractValidator<ActivityAttachmentQueryRequest>
    {
        public ActivityAttachmentQueryRequestValidator()
        {
            RuleFor(x => x.Page).GreaterThan(0);
            RuleFor(x => x.PageSize).InclusiveBetween(1, 100);
        }
    }
}

