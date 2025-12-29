using CRMSys.Application.Dtos.Request;
using FluentValidation;

namespace CRMSys.Application.Validators
{
    /// <summary>
    /// Validator for CustomerAddressQueryRequest
    /// </summary>
    public class CustomerAddressQueryRequestValidator : AbstractValidator<CustomerAddressQueryRequest>
    {
        public CustomerAddressQueryRequestValidator()
        {
            RuleFor(x => x.Page)
                .GreaterThan(0)
                .WithMessage("Page number must be greater than 0");

            RuleFor(x => x.PageSize)
                .GreaterThan(0)
                .WithMessage("Page size must be greater than 0")
                .LessThanOrEqualTo(100)
                .WithMessage("Page size must not exceed 100");

            RuleFor(x => x.Top)
                .GreaterThanOrEqualTo(0)
                .When(x => x.Top.HasValue)
                .WithMessage("Top value must be non-negative");

            RuleFor(x => x.AddressType)
                .Must(BeValidAddressType)
                .When(x => !string.IsNullOrEmpty(x.AddressType))
                .WithMessage("AddressType must be one of: legal, delivery, forwarder, forwarder_agent_asia, other");

            RuleFor(x => x.Country)
                .Length(3)
                .When(x => !string.IsNullOrEmpty(x.Country))
                .WithMessage("Country code must be exactly 3 characters");

            RuleFor(x => x.CreatedFrom)
                .LessThanOrEqualTo(x => x.CreatedTo ?? DateTime.MaxValue)
                .When(x => x.CreatedFrom.HasValue && x.CreatedTo.HasValue)
                .WithMessage("CreatedFrom must be less than or equal to CreatedTo");

            RuleFor(x => x.UpdatedFrom)
                .LessThanOrEqualTo(x => x.UpdatedTo ?? DateTime.MaxValue)
                .When(x => x.UpdatedFrom.HasValue && x.UpdatedTo.HasValue)
                .WithMessage("UpdatedFrom must be less than or equal to UpdatedTo");
        }

        private bool BeValidAddressType(string? addressType)
        {
            if (string.IsNullOrEmpty(addressType))
                return false;

            var validTypes = new[] { "legal", "delivery", "forwarder", "forwarder_agent_asia", "other" };
            return validTypes.Contains(addressType.ToLower());
        }
    }
}
