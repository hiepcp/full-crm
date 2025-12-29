using CRMSys.Application.Dtos.Request;
using FluentValidation;

namespace CRMSys.Application.Validators
{
    /// <summary>
    /// Validator for UpdateCustomerAddressRequest
    /// </summary>
    public class UpdateCustomerAddressRequestValidator : AbstractValidator<UpdateCustomerAddressRequest>
    {
        public UpdateCustomerAddressRequestValidator()
        {
            RuleFor(x => x.AddressType)
                .Must(BeValidAddressType)
                .When(x => !string.IsNullOrEmpty(x.AddressType))
                .WithMessage("AddressType must be one of: legal, delivery, forwarder, forwarder_agent_asia, other");

            RuleFor(x => x.CompanyName)
                .MaximumLength(255)
                .When(x => !string.IsNullOrEmpty(x.CompanyName))
                .WithMessage("CompanyName cannot exceed 255 characters");

            RuleFor(x => x.Postcode)
                .MaximumLength(32)
                .When(x => !string.IsNullOrEmpty(x.Postcode))
                .WithMessage("Postcode cannot exceed 32 characters");

            RuleFor(x => x.City)
                .MaximumLength(128)
                .When(x => !string.IsNullOrEmpty(x.City))
                .WithMessage("City cannot exceed 128 characters");

            RuleFor(x => x.Country)
                .Length(3)
                .When(x => !string.IsNullOrEmpty(x.Country))
                .WithMessage("Country code must be exactly 3 characters");

            RuleFor(x => x.ContactPerson)
                .MaximumLength(255)
                .When(x => !string.IsNullOrEmpty(x.ContactPerson))
                .WithMessage("ContactPerson cannot exceed 255 characters");

            RuleFor(x => x.Email)
                .EmailAddress()
                .When(x => !string.IsNullOrEmpty(x.Email))
                .WithMessage("Invalid email format")
                .MaximumLength(320)
                .When(x => !string.IsNullOrEmpty(x.Email))
                .WithMessage("Email cannot exceed 320 characters");

            RuleFor(x => x.TelephoneNo)
                .MaximumLength(64)
                .When(x => !string.IsNullOrEmpty(x.TelephoneNo))
                .WithMessage("TelephoneNo cannot exceed 64 characters");

            RuleFor(x => x.PortOfDestination)
                .MaximumLength(255)
                .When(x => !string.IsNullOrEmpty(x.PortOfDestination))
                .WithMessage("PortOfDestination cannot exceed 255 characters");

            RuleFor(x => x)
                .Must(x => x.HasChanges())
                .WithMessage("At least one field must be provided for update");
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
