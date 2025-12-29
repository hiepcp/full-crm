using CRMSys.Application.Dtos.Request;
using FluentValidation;

namespace CRMSys.Application.Validators
{
    /// <summary>
    /// Validator for CreateAssigneeRequest
    /// </summary>
    public class CreateAssigneeRequestValidator : AbstractValidator<CreateAssigneeRequest>
    {
        public CreateAssigneeRequestValidator()
        {
            // Relation type validation (required and must be valid)
            RuleFor(x => x.RelationType)
                .NotEmpty()
                .WithMessage("Relation type is required")
                .Must(BeValidRelationType)
                .WithMessage("Relation type must be one of: lead, contact, deal, customer, activity");

            // Relation ID validation (required and must be positive)
            RuleFor(x => x.RelationId)
                .GreaterThan(0)
                .WithMessage("Relation ID must be greater than 0");

            // User Email validation (required and must be valid email format)
            RuleFor(x => x.UserEmail)
                .NotEmpty()
                .WithMessage("User Email is required")
                .EmailAddress()
                .WithMessage("User Email must be a valid email address");

            // Role validation (optional but must be valid if provided)
            RuleFor(x => x.Role)
                .Must(BeValidRole)
                .When(x => !string.IsNullOrEmpty(x.Role))
                .WithMessage("Role must be one of: owner, collaborator, follower");

            // Notes validation (optional but limited length)
            RuleFor(x => x.Notes)
                .MaximumLength(1000)
                .WithMessage("Notes cannot exceed 1000 characters")
                .When(x => !string.IsNullOrEmpty(x.Notes));
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
    }
}













