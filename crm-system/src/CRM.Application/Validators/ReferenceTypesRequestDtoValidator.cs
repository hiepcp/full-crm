using CRMSys.Application.Dtos.Request;
using FluentValidation;

namespace CRMSys.Application.Validators
{
    public class ReferenceTypesRequestDtoValidator : BaseValidator<ReferenceTypesRequestDto>
    {
        public ReferenceTypesRequestDtoValidator()
        {
            RuleFor(x => x.Name).NotEmpty();
        }
    }
}
