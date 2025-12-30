namespace CRMSys.Application.Dtos.Response
{
    public class UserResponse
    {
        // === Basic Identity ===
        public long Id { get; set; }
        public DateTime CreatedOn { get; set; }
        public string? CreatedBy { get; set; }
        public DateTime? UpdatedOn { get; set; }
        public string? UpdatedBy { get; set; }

        // === Basic Information ===
        public string Email { get; set; } = string.Empty;
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Role { get; set; }
        public string? Avatar { get; set; }
        public bool IsActive { get; set; } = true;

        // === Computed Properties ===
        public string FullName => $"{FirstName} {LastName}".Trim();
        public string DisplayName => !string.IsNullOrEmpty(FullName) ? FullName : Email;
        public string Initials => GetInitials();
        public bool HasBasicInfo => !string.IsNullOrEmpty(Email);
        public bool IsAdmin => Role == "admin";
        public bool IsManager => Role == "manager";
        public bool IsSales => Role == "sales";
        public bool IsSupport => Role == "support";

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
    }
}
