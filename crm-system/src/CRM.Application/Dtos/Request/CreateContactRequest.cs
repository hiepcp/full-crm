namespace CRMSys.Application.Dtos.Request
{
    public class CreateContactRequest
    {
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
    }
}
