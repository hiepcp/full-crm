using CRMSys.Application.Dtos.Request;
using FluentValidation;

namespace CRMSys.Application.Validators
{
    /// <summary>
    /// Validator for UpdateAssigneeRequest
    /// </summary>
    public class UpdateAssigneeRequestValidator : AbstractValidator<UpdateAssigneeRequest>
    {
        public UpdateAssigneeRequestValidator()
        {
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

            // Ensure at least one field is being updated
            RuleFor(x => x)
                .Must(HaveAtLeastOneField)
                .WithMessage("At least one field must be provided for update");
        }

        private bool BeValidRole(string? role)
        {
            var validRoles = new[] { "owner", "collaborator", "follower" };
            return validRoles.Contains(role);
        }

        private bool HaveAtLeastOneField(UpdateAssigneeRequest request)
        {
            return !string.IsNullOrEmpty(request.Role) ||
                   !string.IsNullOrEmpty(request.Notes);
        }
    }
}













