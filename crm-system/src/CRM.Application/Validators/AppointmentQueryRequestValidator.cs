using CRMSys.Application.Dtos.Request;
using FluentValidation;

namespace CRMSys.Application.Validators
{
    public class AppointmentQueryRequestValidator : AbstractValidator<AppointmentQueryRequest>
    {
        public AppointmentQueryRequestValidator()
        {
            RuleFor(x => x.Page).GreaterThan(0);
            RuleFor(x => x.PageSize).InclusiveBetween(1, 100);
            RuleFor(x => x.Top).GreaterThanOrEqualTo(0).When(x => x.Top.HasValue);
        }
    }
}



