namespace CRMSys.Application.Dtos.Response
{
    public class ContactResponse
    {
        // === Basic Identity ===
        public long Id { get; set; }
        public DateTime CreatedOn { get; set; }
        public string? CreatedBy { get; set; }
        public DateTime? UpdatedOn { get; set; }
        public string? UpdatedBy { get; set; }

        // === Relations ===
        public long? CustomerId { get; set; }

        // === Personal Information ===
        public string? Salutation { get; set; }
        public string? FirstName { get; set; }
        public string? MiddleName { get; set; }
        public string? LastName { get; set; }
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string? MobilePhone { get; set; }
        public string? Fax { get; set; }
        public string? JobTitle { get; set; }

        // === Address Information ===
        public string? Address { get; set; }

        // === Contact Details ===
        public string? Notes { get; set; }
        public bool IsPrimary { get; set; }

        // === Computed Properties ===
        public string FullName => $"{FirstName} {MiddleName} {LastName}".Replace("  ", " ").Trim();
        public bool HasBasicInfo => !string.IsNullOrEmpty(Email) || !string.IsNullOrEmpty(Phone) || !string.IsNullOrEmpty(MobilePhone);
        public string DisplayName => !string.IsNullOrEmpty(FullName) ? FullName : Email ?? $"Contact {Id}";
        public string FormalName => !string.IsNullOrEmpty(Salutation) ? $"{Salutation} {FullName}" : FullName;
    }
}
