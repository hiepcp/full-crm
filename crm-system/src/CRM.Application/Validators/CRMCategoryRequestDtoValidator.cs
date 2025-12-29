using CRMSys.Application.Dtos.Request;
using FluentValidation;

namespace CRMSys.Application.Validators
{
    public class CRMCategoryRequestDtoValidator : BaseValidator<CRMCategoryRequestDto>
    {
        public CRMCategoryRequestDtoValidator()
        {
            RuleFor(x => x.Name).NotEmpty();
        }
    }
}
