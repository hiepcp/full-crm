using FluentValidation;
using CRM.Application.Dtos;
using System;

namespace CRM.Application.Validators
{
    /// <summary>
    /// Validator for ActivityRequest DTO
    /// Feature 006-contract-activity-fields: Added validation for ContractDate and ContractValue
    /// </summary>
    public class ActivityValidator : AbstractValidator<ActivityRequest>
    {
        public ActivityValidator()
        {
            // Existing validation rules
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Activity name is required")
                .MaximumLength(200).WithMessage("Activity name cannot exceed 200 characters");

            RuleFor(x => x.Type)
                .NotEmpty().WithMessage("Activity type is required")
                .Must(BeAValidActivityType).WithMessage("Invalid activity type");

            RuleFor(x => x.Status)
                .NotEmpty().WithMessage("Activity status is required");

            // NEW VALIDATION RULES (Feature 006-contract-activity-fields)

            // ContractDate validation (User Story 1)
            RuleFor(x => x.ContractDate)
                .Must(BeAValidDate).When(x => x.ContractDate.HasValue)
                .WithMessage("Invalid date format for contract date");

            // ContractValue validation (User Story 2)
            RuleFor(x => x.ContractValue)
                .GreaterThanOrEqualTo(0).When(x => x.ContractValue.HasValue)
                .WithMessage("Contract value cannot be negative")
                .LessThan(1000000000000m).When(x => x.ContractValue.HasValue)
                .WithMessage("Contract value exceeds maximum allowed (1 trillion)")
                .Must(HaveAtMostTwoDecimalPlaces).When(x => x.ContractValue.HasValue)
                .WithMessage("Contract value cannot have more than 2 decimal places");
        }

        private bool BeAValidActivityType(string type)
        {
            var validTypes = new[] { "call", "meeting", "email", "contract", "task", "other" };
            return type == null || Array.Exists(validTypes, t => t.Equals(type, StringComparison.OrdinalIgnoreCase));
        }

        private bool BeAValidDate(DateTime? date)
        {
            if (!date.HasValue) return true;

            // Check if date is reasonable (not too far in past or future)
            var minDate = new DateTime(1900, 1, 1);
            var maxDate = new DateTime(2100, 12, 31);

            return date.Value >= minDate && date.Value <= maxDate;
        }

        private bool HaveAtMostTwoDecimalPlaces(decimal? value)
        {
            if (!value.HasValue) return true;

            decimal decimalPart = value.Value - Math.Floor(value.Value);
            decimal scaledPart = decimalPart * 100;

            return scaledPart == Math.Floor(scaledPart);
        }
    }
}
