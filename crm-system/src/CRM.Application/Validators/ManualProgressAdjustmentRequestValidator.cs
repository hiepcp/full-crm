using CRMSys.Application.Dtos.Request;
using FluentValidation;

namespace CRMSys.Application.Validators
{
    /// <summary>
    /// Validator for manual progress adjustment requests
    /// Enforces FR-018: Manual adjustments require justification (min 10 characters)
    /// </summary>
    public class ManualProgressAdjustmentRequestValidator : AbstractValidator<ManualProgressAdjustmentRequest>
    {
        public ManualProgressAdjustmentRequestValidator()
        {
            RuleFor(x => x.NewProgress)
                .GreaterThanOrEqualTo(0)
                .WithMessage("Progress value must be non-negative");

            RuleFor(x => x.Justification)
                .NotEmpty()
                .WithMessage("Justification is required for manual progress adjustments")
                .MinimumLength(10)
                .WithMessage("Justification must be at least 10 characters to ensure meaningful explanation")
                .MaximumLength(1000)
                .WithMessage("Justification cannot exceed 1000 characters");
        }
    }
}
