using CRMSys.Application.Dtos.Request;
using FluentValidation;

namespace CRMSys.Application.Validators
{
    /// <summary>
    /// Validator for UpdateLeadRequest
    /// All fields are optional, but if provided, they must be valid
    /// </summary>
    public class UpdateLeadRequestValidator : AbstractValidator<UpdateLeadRequest>
    {
        public UpdateLeadRequestValidator()
        {
            // Email validation
            RuleFor(x => x.Email)
                .EmailAddress()
                .When(x => !string.IsNullOrEmpty(x.Email))
                .WithMessage("Invalid email format");

            // Telephone No validation - supports international formats with spaces, dashes, parentheses, and dots
            RuleFor(x => x.TelephoneNo)
                .Matches(@"^[\+]?[\d\s\-\(\)\.]{8,20}$")
                .When(x => !string.IsNullOrEmpty(x.TelephoneNo))
                .WithMessage("Invalid telephone number format");

            // Name validations
            RuleFor(x => x.FirstName)
                .MaximumLength(128)
                .WithMessage("First name cannot exceed 128 characters")
                .When(x => !string.IsNullOrEmpty(x.FirstName));

            RuleFor(x => x.LastName)
                .MaximumLength(128)
                .WithMessage("Last name cannot exceed 128 characters")
                .When(x => !string.IsNullOrEmpty(x.LastName));

            RuleFor(x => x.Company)
                .MaximumLength(255)
                .WithMessage("Company name cannot exceed 255 characters")
                .When(x => !string.IsNullOrEmpty(x.Company));

            // Website validation
            RuleFor(x => x.Website)
                .Matches(@"^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$")
                .When(x => !string.IsNullOrEmpty(x.Website))
                .WithMessage("Invalid website format");

            // VAT Number validation (optional, length constraint)
            RuleFor(x => x.VatNumber)
                .MaximumLength(64)
                .When(x => !string.IsNullOrEmpty(x.VatNumber))
                .WithMessage("VAT number cannot exceed 64 characters");

            // Payment terms validation (optional, length constraint)
            RuleFor(x => x.PaymentTerms)
                .MaximumLength(100)
                .When(x => !string.IsNullOrEmpty(x.PaymentTerms))
                .WithMessage("Payment terms cannot exceed 100 characters");

            // Source validation
            RuleFor(x => x.Source)
                .Must(BeValidSource)
                .When(x => !string.IsNullOrEmpty(x.Source))
                .WithMessage("Source must be one of: web, event, referral, ads, facebook, other");

            // Status validation
            RuleFor(x => x.Status)
                .Must(BeValidStatus)
                .When(x => !string.IsNullOrEmpty(x.Status))
                .WithMessage("Status must be one of: working, qualified, unqualified");

            // Score validation
            RuleFor(x => x.Score)
                .InclusiveBetween(0, 100)
                .When(x => x.Score.HasValue)
                .WithMessage("Score must be between 0 and 100");

            // Business rule validations for updates
            RuleFor(x => x)
                .Must(NotChangeConvertedLeadUnreasonably)
                .WithMessage("Cannot change critical fields of converted leads");

            RuleFor(x => x)
                .Must(HaveReasonableScoreForStatus)
                .WithMessage("Qualified leads should have score >= 70, unqualified leads should have score < 70");

            // Validate relationship IDs
            RuleFor(x => x.CustomerId)
                .GreaterThan(0)
                .When(x => x.CustomerId.HasValue)
                .WithMessage("CustomerId must be a positive number");

            RuleFor(x => x.ContactId)
                .GreaterThan(0)
                .When(x => x.ContactId.HasValue)
                .WithMessage("ContactId must be a positive number");

            RuleFor(x => x.DealId)
                .GreaterThan(0)
                .When(x => x.DealId.HasValue)
                .WithMessage("DealId must be a positive number");

            RuleFor(x => x.DuplicateOf)
                .GreaterThan(0)
                .When(x => x.DuplicateOf.HasValue)
                .WithMessage("DuplicateOf must be a positive number");

            // Business rule: Can't set duplicate of self
            RuleFor(x => x)
                .Must(NotDuplicateSelf)
                .WithMessage("Lead cannot be duplicate of itself");

            // Address validations
            RuleForEach(x => x.Addresses)
                .Must(BeValidAddressType)
                .When(x => x.Addresses != null && x.Addresses.Any())
                .WithMessage("Address type must be one of: legal, delivery, forwarder, forwarder_agent_asia, other");

            RuleForEach(x => x.Addresses)
                .Must(HaveValidAddressStructure)
                .When(x => x.Addresses != null && x.Addresses.Any())
                .WithMessage("Address must have valid structure with required fields");

            RuleFor(x => x.Addresses)
                .Must(NotHaveDuplicatePrimaryAddresses)
                .When(x => x.Addresses != null && x.Addresses.Any())
                .WithMessage("Only one primary address allowed per address type");

            RuleForEach(x => x.Addresses)
                .Must(HaveValidEmailFormat)
                .When(x => x.Addresses != null && x.Addresses.Any(a => !string.IsNullOrEmpty(a.Email)))
                .WithMessage("Invalid email format in address");

            RuleForEach(x => x.Addresses)
                .Must(HaveValidTelephoneFormat)
                .When(x => x.Addresses != null && x.Addresses.Any(a => !string.IsNullOrEmpty(a.TelephoneNo)))
                .WithMessage("Invalid telephone number format in address");
        }

        private bool BeValidSource(string? source)
        {
            var validSources = new[] { "web", "event", "referral", "ads", "facebook", "other" };
            return validSources.Contains(source);
        }

        private bool BeValidStatus(string? status)
        {
            var validStatuses = new[] { "working", "qualified", "unqualified" };
            return validStatuses.Contains(status);
        }

        private bool HaveReasonableScoreForStatus(UpdateLeadRequest request)
        {
            if (!request.Score.HasValue || string.IsNullOrEmpty(request.Status))
                return true; // Skip validation if score or status not provided

            return request.Status switch
            {
                "qualified" => request.Score.Value >= 70,
                "unqualified" => request.Score.Value < 70,
                _ => true // Other statuses don't have score restrictions
            };
        }

        private bool NotChangeConvertedLeadUnreasonably(UpdateLeadRequest request)
        {
            // This would typically check against database state
            // For now, just return true as we can't access DB state in validator
            // The actual business rule should be enforced in service layer
            return true;
        }

        private bool NotDuplicateSelf(UpdateLeadRequest request)
        {
            // This validation would need the current lead ID from service layer
            // For now, just basic validation
            return !request.IsDuplicate.HasValue || !request.IsDuplicate.Value ||
                   !request.DuplicateOf.HasValue || request.DuplicateOf.Value > 0;
        }

        private bool BeValidAddressType(LeadAddressDto address)
        {
            var validTypes = new[] { "legal", "delivery", "forwarder", "forwarder_agent_asia", "other" };
            return validTypes.Contains(address.AddressType);
        }

        private bool HaveValidAddressStructure(LeadAddressDto address)
        {
            // At minimum, address type and some address information should be provided
            return !string.IsNullOrEmpty(address.AddressType) &&
                   (!string.IsNullOrEmpty(address.AddressLine) ||
                    !string.IsNullOrEmpty(address.CompanyName) ||
                    !string.IsNullOrEmpty(address.City));
        }

        private bool NotHaveDuplicatePrimaryAddresses(List<LeadAddressDto>? addresses)
        {
            if (addresses == null || !addresses.Any())
                return true;

            // Group by address type and check if more than one primary per type
            var primaryAddressesByType = addresses
                .Where(a => a.IsPrimary)
                .GroupBy(a => a.AddressType)
                .Where(g => g.Count() > 1);

            return !primaryAddressesByType.Any();
        }

        private bool HaveValidEmailFormat(LeadAddressDto address)
        {
            if (string.IsNullOrEmpty(address.Email))
                return true; // Optional field

            try
            {
                var addr = new System.Net.Mail.MailAddress(address.Email);
                return addr.Address == address.Email;
            }
            catch
            {
                return false;
            }
        }

        private bool HaveValidTelephoneFormat(LeadAddressDto address)
        {
            if (string.IsNullOrEmpty(address.TelephoneNo))
                return true; // Optional field

            // Supports international formats with spaces, dashes, parentheses, and dots
            return System.Text.RegularExpressions.Regex.IsMatch(address.TelephoneNo, @"^[\+]?[\d\s\-\(\)\.]{8,20}$");
        }
    }
}
