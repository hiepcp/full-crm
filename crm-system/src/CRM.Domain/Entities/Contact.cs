using System.ComponentModel.DataAnnotations.Schema;

namespace CRMSys.Domain.Entities
{
    /// <summary>
    /// Contact entity representing a contact person for a customer
    /// </summary>
    [Table("crm_contact")]
    public class Contact : BaseEntity
    {
        // === Primary Key ===
        public long Id { get; set; }

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
        [NotMapped]
        public string FullName => $"{FirstName} {MiddleName} {LastName}".Replace("  ", " ").Trim();
        [NotMapped]
        public bool HasBasicInfo => !string.IsNullOrEmpty(Email) || !string.IsNullOrEmpty(Phone) || !string.IsNullOrEmpty(MobilePhone);
        [NotMapped]
        public string DisplayName => !string.IsNullOrEmpty(FullName) ? FullName : Email ?? $"Contact {Id}";
        [NotMapped]
        public string FormalName => !string.IsNullOrEmpty(Salutation) ? $"{Salutation} {FullName}" : FullName;

        // === Business Logic Helpers ===
        [NotMapped]
        public bool CanBePrimary => CustomerId.HasValue && HasBasicInfo;
        [NotMapped]
        public bool HasMultipleContactMethods => (!string.IsNullOrEmpty(Email) ? 1 : 0) +
                                                 (!string.IsNullOrEmpty(Phone) ? 1 : 0) +
                                                 (!string.IsNullOrEmpty(MobilePhone) ? 1 : 0) >= 2;

        /// <summary>
        /// Mark as primary contact for customer
        /// </summary>
        public void MarkAsPrimary()
        {
            IsPrimary = true;
        }

        /// <summary>
        /// Remove primary status
        /// </summary>
        public void RemovePrimaryStatus()
        {
            IsPrimary = false;
        }

        /// <summary>
        /// Assign to customer
        /// </summary>
        public void AssignToCustomer(long customerId)
        {
            CustomerId = customerId;
        }
    }
}
