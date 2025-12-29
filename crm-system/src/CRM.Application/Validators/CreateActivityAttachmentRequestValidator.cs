using CRMSys.Application.Dtos.Request;
using FluentValidation;

namespace CRMSys.Application.Validators
{
    public class CreateActivityAttachmentRequestValidator : AbstractValidator<CreateActivityAttachmentRequest>
    {
        public CreateActivityAttachmentRequestValidator()
        {
            RuleFor(x => x.ActivityId).GreaterThan(0);
            RuleFor(x => x.FileName).NotEmpty();
            RuleFor(x => x.FilePath).NotEmpty();
            RuleFor(x => x.FileSize).GreaterThan(0);
            RuleFor(x => x.MimeType).NotEmpty();
        }
    }
}

