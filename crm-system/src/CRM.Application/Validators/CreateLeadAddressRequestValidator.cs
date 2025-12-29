using CRMSys.Application.Dtos.Request;
using FluentValidation;
using System;

namespace CRMSys.Application.Validators
{
    /// <summary>
    /// Validator for CreateLeadAddressRequest
    /// </summary>
    public class CreateLeadAddressRequestValidator : AbstractValidator<CreateLeadAddressRequest>
    {
        public CreateLeadAddressRequestValidator()
        {
            RuleFor(x => x.RelationType)
                .NotEmpty().WithMessage("RelationType is required")
                .Must(rt => rt.Equals("lead", StringComparison.OrdinalIgnoreCase))
                .WithMessage("RelationType must be 'lead'");

            RuleFor(x => x.RelationId)
                .GreaterThan(0).WithMessage("RelationId must be greater than 0");

            RuleFor(x => x.AddressType)
                .NotEmpty().WithMessage("AddressType is required")
                .Must(BeValidAddressType)
                .WithMessage("AddressType must be one of: legal, delivery, forwarder, forwarder_agent_asia, other");

            RuleFor(x => x.CompanyName)
                .MaximumLength(255)
                .When(x => !string.IsNullOrEmpty(x.CompanyName));

            RuleFor(x => x.Postcode)
                .MaximumLength(32)
                .When(x => !string.IsNullOrEmpty(x.Postcode));

            RuleFor(x => x.City)
                .MaximumLength(128)
                .When(x => !string.IsNullOrEmpty(x.City));

            RuleFor(x => x.Country)
                .Length(3)
                .When(x => !string.IsNullOrEmpty(x.Country))
                .WithMessage("Country code must be exactly 3 characters");

            RuleFor(x => x.ContactPerson)
                .MaximumLength(255)
                .When(x => !string.IsNullOrEmpty(x.ContactPerson));

            RuleFor(x => x.Email)
                .EmailAddress()
                .When(x => !string.IsNullOrEmpty(x.Email))
                .WithMessage("Invalid email format")
                .MaximumLength(320)
                .When(x => !string.IsNullOrEmpty(x.Email));

            RuleFor(x => x.TelephoneNo)
                .MaximumLength(64)
                .When(x => !string.IsNullOrEmpty(x.TelephoneNo));

            RuleFor(x => x.PortOfDestination)
                .MaximumLength(255)
                .When(x => !string.IsNullOrEmpty(x.PortOfDestination));
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

