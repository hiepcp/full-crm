using System.ComponentModel.DataAnnotations.Schema;

namespace CRMSys.Domain.Entities
{
    /// <summary>
    /// Customer entity representing a customer or prospect
    /// </summary>
    [Table("crm_customer")]
    public class Customer : BaseEntity
    {
        // === Primary Key ===
        public long Id { get; set; }

        // === Basic Information ===
        public string Name { get; set; } = string.Empty;
        public string? Domain { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }

        public string? BillingAddress { get; set; }
        public string? ShippingAddress { get; set; }
        public string? Website { get; set; }

        public string Type { get; set; } = "Customer"; // ENUM: Customer, Prospect, Partner, Supplier, Other
        public long? OwnerId { get; set; }
        public long? SalesTeamId { get; set; }
        public string? VatNumber { get; set; }
        public string Currency { get; set; } = "USD";
        public string? Country { get; set; }
        public string? Industry { get; set; }

        // === Additional Information ===
        public string? Notes { get; set; }
        public string? PaymentTerms { get; set; }
        public string? DeliveryTerms { get; set; }
        public string? ContactPerson { get; set; }

        // === Computed Properties ===
        [NotMapped]
        public bool IsCustomer => Type == "Customer";
        [NotMapped]
        public bool IsProspect => Type == "Prospect";
        [NotMapped]
        public bool IsPartner => Type == "Partner";
        [NotMapped]
        public bool IsSupplier => Type == "Supplier";
        [NotMapped]
        public bool HasBasicInfo => !string.IsNullOrEmpty(Name) && (!string.IsNullOrEmpty(Email) || !string.IsNullOrEmpty(Phone));
        [NotMapped]
        public bool HasAddress => !string.IsNullOrEmpty(BillingAddress) || !string.IsNullOrEmpty(ShippingAddress);
        [NotMapped]
        public string DisplayName => !string.IsNullOrEmpty(Name) ? Name : $"Customer {Id}";

        // === Business Logic Helpers ===
        [NotMapped]
        public bool CanBeConverted => Type == "working";
        [NotMapped]
        public bool IsActive => !string.IsNullOrEmpty(Name);

        /// <summary>
        /// Convert prospect to customer
        /// </summary>
        public void ConvertToCustomer()
        {
            if (Type == "Prospect")
            {
                Type = "Customer";
            }
        }

        /// <summary>
        /// Update customer type with validation
        /// </summary>
        public bool ChangeType(string newType)
        {
            var validTypes = new[] { "Customer", "Prospect", "Partner", "Supplier", "Other" };
            if (!validTypes.Contains(newType))
                return false;

            Type = newType;
            return true;
        }

        /// <summary>
        /// Assign to new owner
        /// </summary>
        public void AssignTo(long ownerId)
        {
            OwnerId = ownerId;
        }
    }
}
