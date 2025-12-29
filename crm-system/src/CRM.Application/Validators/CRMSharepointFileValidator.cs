using FluentValidation;
using CRMSys.Domain.Entities;

namespace CRMSys.Application.Validators
{
    public class CRMSharepointFileValidator : AbstractValidator<CRMSharepointFile>
    {
        public CRMSharepointFileValidator()
        {
            RuleFor(x => x.ItemId)
                .NotEmpty().WithMessage("ItemId is required");

            RuleFor(x => x.DriveId)
                .NotEmpty().WithMessage("DriveId is required");

            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Name is required");
        }
    }
}
