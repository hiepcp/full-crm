using CRMSys.Application.Dtos.Request;
using FluentValidation;

namespace CRMSys.Application.Validators
{
    /// <summary>
    /// Validator for AssigneeQueryRequest
    /// </summary>
    public class AssigneeQueryRequestValidator : AbstractValidator<AssigneeQueryRequest>
    {
        public AssigneeQueryRequestValidator()
        {
            // Page validation
            RuleFor(x => x.Page)
                .GreaterThan(0)
                .WithMessage("Page number must be greater than 0");

            // PageSize validation
            RuleFor(x => x.PageSize)
                .InclusiveBetween(1, 100)
                .WithMessage("Page size must be between 1 and 100");

            // Top validation
            RuleFor(x => x.Top)
                .GreaterThanOrEqualTo(0)
                .When(x => x.Top.HasValue)
                .WithMessage("Top value must be non-negative");

            // Relation type validation (must be valid if provided)
            RuleFor(x => x.RelationType)
                .Must(BeValidRelationType)
                .When(x => !string.IsNullOrEmpty(x.RelationType))
                .WithMessage("Relation type must be one of: lead, contact, deal, customer, activity");

            // Relation ID validation (must be positive if provided)
            RuleFor(x => x.RelationId)
                .GreaterThan(0)
                .When(x => x.RelationId.HasValue)
                .WithMessage("Relation ID must be greater than 0");

            // User Email validation (must be valid email format if provided)
            RuleFor(x => x.UserEmail)
                .EmailAddress()
                .When(x => !string.IsNullOrEmpty(x.UserEmail))
                .WithMessage("User Email must be a valid email address");

            // Role validation (must be valid if provided)
            RuleFor(x => x.Role)
                .Must(BeValidRole)
                .When(x => !string.IsNullOrEmpty(x.Role))
                .WithMessage("Role must be one of: owner, collaborator, follower");

            // Date range validation
            RuleFor(x => x)
                .Must(HaveValidDateRange)
                .WithMessage("AssignedFrom must be before or equal to AssignedTo");
        }

        private bool BeValidRelationType(string? relationType)
        {
            var validTypes = new[] { "lead", "contact", "deal", "customer", "activity" };
            return validTypes.Contains(relationType);
        }

        private bool BeValidRole(string? role)
        {
            var validRoles = new[] { "owner", "collaborator", "follower" };
            return validRoles.Contains(role);
        }

        private bool HaveValidDateRange(AssigneeQueryRequest request)
        {
            if (!request.AssignedFrom.HasValue || !request.AssignedTo.HasValue)
                return true;

            return request.AssignedFrom.Value <= request.AssignedTo.Value;
        }
    }
}













