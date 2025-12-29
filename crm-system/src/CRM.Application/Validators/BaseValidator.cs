using FluentValidation;
using System.Linq.Expressions;

namespace CRMSys.Application.Validators
{
    /// <summary>
    /// Base class cho t?t c? FluentValidators
    /// Dùng d? gom các rule chung cho DTOs
    /// </summary>
    public abstract class BaseValidator<TDto> : AbstractValidator<TDto>
    {
        protected BaseValidator()
        {
            // Ví d?: t?t c? DTO d?u có th? c?n validate audit fields (n?u expose ra)
            // RuleFor(x => x.CreatedBy).NotEmpty().WithMessage("CreatedBy is required");
            // RuleFor(x => x.UpdatedBy).NotEmpty().When(...);

            // Ho?c rule chung v? date n?u DTO nào cung có ValidFrom / ValidTo
            // (có th? check b?ng reflection ho?c interface marker)
        }

        /// <summary>
        /// Helper: rule d? check ValidFrom <= ValidTo (cho các DTO có field này)
        /// </summary>
        protected void AddDateRangeRule<T>(
            AbstractValidator<T> validator,
            Expression<Func<T, DateTime?>> fromExpr,
            Expression<Func<T, DateTime?>> toExpr)
        {
            validator.RuleFor(x => x).Custom((instance, context) =>
            {
                var from = fromExpr.Compile().Invoke(instance);
                var to = toExpr.Compile().Invoke(instance);

                if (from.HasValue && to.HasValue && from > to)
                {
                    context.AddFailure("ValidTo must be greater than or equal to ValidFrom");
                }
            });
        }

    }
}
