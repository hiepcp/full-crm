using CRMSys.Application.Dtos.Request;
using FluentValidation;

namespace CRMSys.Application.Validators
{
    public class UpdateActivityAttachmentRequestValidator : AbstractValidator<UpdateActivityAttachmentRequest>
    {
        public UpdateActivityAttachmentRequestValidator()
        {
            RuleFor(x => x).Must(x => x.FileName != null || x.FilePath != null || x.FileSize.HasValue || x.MimeType != null)
                .WithMessage("At least one field must be provided");
            When(x => x.FileSize.HasValue, () =>
            {
                RuleFor(x => x.FileSize!.Value).GreaterThan(0);
            });
        }
    }
}

