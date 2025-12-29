using CRMSys.Application.Dtos.Request;
using FluentValidation;

namespace CRMSys.Application.Validators
{
    /// <summary>
    /// Validator for LeadQueryRequest
    /// </summary>
    public class LeadQueryRequestValidator : AbstractValidator<LeadQueryRequest>
    {
        public LeadQueryRequestValidator()
        {
            // Pagination validation
            RuleFor(x => x.Page)
                .GreaterThan(0)
                .WithMessage("Page number must be greater than 0");

            RuleFor(x => x.PageSize)
                .InclusiveBetween(1, 100)
                .WithMessage("Page size must be between 1 and 100");

            RuleFor(x => x.Top)
                .GreaterThanOrEqualTo(0)
                .When(x => x.Top.HasValue)
                .WithMessage("Top value must be non-negative");

            // Search validation
            RuleFor(x => x.Search)
                .MaximumLength(200)
                .WithMessage("Search query cannot exceed 200 characters")
                .When(x => !string.IsNullOrEmpty(x.Search));

            // Telephone No validation (optional, partial match allowed)
            RuleFor(x => x.TelephoneNo)
                .MaximumLength(50)
                .WithMessage("Telephone No filter cannot exceed 50 characters")
                .When(x => !string.IsNullOrEmpty(x.TelephoneNo));

            // Status validation
            RuleFor(x => x.Status)
                .Must(BeValidStatus)
                .When(x => !string.IsNullOrEmpty(x.Status))
                .WithMessage("Status must be one of: working, qualified, unqualified");

            // Source validation
            RuleFor(x => x.Source)
                .Must(BeValidSource)
                .When(x => !string.IsNullOrEmpty(x.Source))
                .WithMessage("Source must be one of: web, event, referral, ads, facebook, other");

            // Score range validation
            RuleFor(x => x.ScoreMin)
                .InclusiveBetween(0, 100)
                .When(x => x.ScoreMin.HasValue)
                .WithMessage("Minimum score must be between 0 and 100");

            RuleFor(x => x.ScoreMax)
                .InclusiveBetween(0, 100)
                .When(x => x.ScoreMax.HasValue)
                .WithMessage("Maximum score must be between 0 and 100");

            RuleFor(x => x)
                .Must(HaveValidScoreRange)
                .WithMessage("Minimum score cannot be greater than maximum score");

            // Date range validation
            RuleFor(x => x)
                .Must(HaveValidDateRanges)
                .WithMessage("From dates cannot be later than To dates");

            // OrderBy validation
            RuleFor(x => x.OrderBy)
                .Must(BeValidOrderBy)
                .When(x => !string.IsNullOrEmpty(x.OrderBy))
                .WithMessage("Invalid order by format. Use field names separated by commas, prefix with '-' for descending");

            // Fields validation
            RuleFor(x => x.Fields)
                .Must(BeValidFields)
                .When(x => !string.IsNullOrEmpty(x.Fields))
                .WithMessage("Invalid fields format. Use comma-separated field names or 'basic', 'contact', 'sales' groups");

            // Domain validation (JSON)
            RuleFor(x => x.Domain)
                .Must(BeValidDomainExpression)
                .When(x => !string.IsNullOrEmpty(x.Domain))
                .WithMessage("Invalid domain expression format");
        }

        private bool BeValidStatus(string? status)
        {
            var validStatuses = new[] { "working", "qualified", "unqualified" };
            return validStatuses.Contains(status);
        }

        private bool BeValidSource(string? source)
        {
            var validSources = new[] { "web", "event", "referral", "ads", "facebook", "other" };
            return validSources.Contains(source);
        }

        private bool HaveValidScoreRange(LeadQueryRequest request)
        {
            if (!request.ScoreMin.HasValue || !request.ScoreMax.HasValue)
                return true;

            return request.ScoreMin.Value <= request.ScoreMax.Value;
        }

        private bool HaveValidDateRanges(LeadQueryRequest request)
        {
            if (request.CreatedFrom.HasValue && request.CreatedTo.HasValue)
            {
                if (request.CreatedFrom.Value > request.CreatedTo.Value)
                    return false;
            }

            if (request.UpdatedFrom.HasValue && request.UpdatedTo.HasValue)
            {
                if (request.UpdatedFrom.Value > request.UpdatedTo.Value)
                    return false;
            }

            return true;
        }

        private bool BeValidOrderBy(string? orderBy)
        {
            if (string.IsNullOrWhiteSpace(orderBy))
                return false;

            var allowedFields = new HashSet<string>
            {
                "id", "email", "telephoneNo", "phone", "firstName", "lastName", "company",
                "domain", "website", "country", "vatNumber", "source", "status", "ownerId",
                "score", "isConverted", "convertedAt", "customerId", "contactId", "dealId",
                "isDuplicate", "duplicateOf", "note", "followUpDate", "createdOn", "updatedOn"
            };

            var parts = orderBy.Split(',');
            foreach (var part in parts)
            {
                var field = part.Trim().TrimStart('-');
                if (!allowedFields.Contains(field.ToLower()))
                    return false;
            }

            return true;
        }

        private bool BeValidFields(string? fields)
        {
            if (string.IsNullOrWhiteSpace(fields))
                return false;

            // Allow predefined groups
            var validGroups = new[] { "basic", "contact", "sales", "*" };
            if (validGroups.Contains(fields.ToLower()))
                return true;

            // Validate individual field names
            var allowedFields = new HashSet<string>
            {
                "id", "email", "phone", "firstname", "lastname", "company", "domain", "website", "country", "vatnumber",
                "source", "status", "ownerid", "score", "isconverted", "convertedat",
                "customerid", "contactid", "dealid", "isduplicate", "duplicateof",
                "note", "followupdate", "createdon", "createdby", "updatedon", "updatedby",
                "fullname", "displayname"
            };

            var fieldList = fields.Split(',');
            foreach (var field in fieldList)
            {
                var cleanField = field.Trim().TrimStart('!');
                if (!allowedFields.Contains(cleanField.ToLower()) && !cleanField.Contains('.'))
                    return false;
            }

            return true;
        }

        private bool BeValidDomainExpression(string? domain)
        {
            // Basic JSON validation - in production, you'd want more sophisticated parsing
            if (string.IsNullOrWhiteSpace(domain))
                return false;

            try
            {
                // Try to parse as JSON
                System.Text.Json.JsonDocument.Parse(domain);
                return true;
            }
            catch
            {
                return false;
            }
        }
    }
}
