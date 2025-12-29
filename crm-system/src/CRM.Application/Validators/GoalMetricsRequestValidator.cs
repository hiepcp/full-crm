using CRMSys.Application.Dtos.Request;
using FluentValidation;

namespace CRMSys.Application.Validators
{
    public class GoalMetricsRequestValidator : AbstractValidator<GoalMetricsRequest>
    {
        private static readonly string[] AllowedOwnerTypes = { "individual", "team", "company" };
        private static readonly string[] AllowedTimeframes = { "this_week", "this_month", "this_quarter", "this_year", "custom" };

        public GoalMetricsRequestValidator()
        {
            RuleFor(x => x.OwnerType)
                .Must(ot => string.IsNullOrEmpty(ot) || AllowedOwnerTypes.Contains(ot))
                .WithMessage("OwnerType must be individual, team, or company.");

            RuleFor(x => x.Timeframe)
                .Must(tf => string.IsNullOrEmpty(tf) || AllowedTimeframes.Contains(tf))
                .WithMessage("Invalid timeframe.");

            RuleFor(x => x.Top)
                .GreaterThan(0).When(x => x.Top.HasValue);

            RuleFor(x => x.SortOrder)
                .Must(so => new[] { "asc", "desc" }.Contains(so.ToLower()))
                .When(x => !string.IsNullOrEmpty(x.SortOrder))
                .WithMessage("SortOrder must be asc or desc.");
        }
    }
}
