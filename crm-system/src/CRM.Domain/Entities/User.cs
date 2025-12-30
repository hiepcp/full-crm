using System.ComponentModel.DataAnnotations.Schema;

namespace CRMSys.Domain.Entities
{
    /// <summary>
    /// User entity representing system users
    /// </summary>
    [Table("crm_user")]
    public class User : BaseEntity
    {
        // === Primary Key ===
        public long Id { get; set; }

        // === Basic Information ===
        public string Email { get; set; } = string.Empty;
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Role { get; set; }
        public string? Avatar { get; set; }
        public bool IsActive { get; set; } = true;

        // === Computed Properties ===
        [NotMapped]
        public string FullName => $"{FirstName} {LastName}".Trim();
        [NotMapped]
        public string DisplayName => !string.IsNullOrEmpty(FullName) ? FullName : Email;
        [NotMapped]
        public string Initials => GetInitials();
        [NotMapped]
        public bool HasBasicInfo => !string.IsNullOrEmpty(Email);
        [NotMapped]
        public bool IsAdmin => Role == "admin";
        [NotMapped]
        public bool IsManager => Role == "manager";
        [NotMapped]
        public bool IsSales => Role == "sales";
        [NotMapped]
        public bool IsSupport => Role == "support";

        // === Business Logic Helpers ===
        [NotMapped]
        public bool CanBeDeactivated => IsActive && !IsAdmin;

        private string GetInitials()
        {
            var parts = FullName.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length >= 2)
            {
                return $"{parts[0][0]}{parts[1][0]}".ToUpper();
            }
            else if (parts.Length == 1)
            {
                return parts[0].Substring(0, Math.Min(2, parts[0].Length)).ToUpper();
            }
            else if (!string.IsNullOrEmpty(Email))
            {
                return Email.Substring(0, Math.Min(2, Email.Length)).ToUpper();
            }
            return "U";
        }

        /// <summary>
        /// Activate user
        /// </summary>
        public void Activate()
        {
            IsActive = true;
        }

        /// <summary>
        /// Deactivate user
        /// </summary>
        public void Deactivate()
        {
            if (CanBeDeactivated)
            {
                IsActive = false;
            }
        }

        /// <summary>
        /// Change role with validation
        /// </summary>
        public bool ChangeRole(string newRole)
        {
            var validRoles = new[] { "admin", "manager", "sales", "support", "user" };
            if (!validRoles.Contains(newRole))
                return false;

            Role = newRole;
            return true;
        }

        /// <summary>
        /// Update profile information
        /// </summary>
        public void UpdateProfile(string? firstName, string? lastName, string? avatar)
        {
            FirstName = firstName;
            LastName = lastName;
            Avatar = avatar;
        }
    }
}
