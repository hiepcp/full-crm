namespace CRMSys.Application.Dtos.Response
{
    public class CustomerResponse
    {
        // === Basic Identity ===
        public long Id { get; set; }
        public DateTime CreatedOn { get; set; }
        public string? CreatedBy { get; set; }
        public DateTime? UpdatedOn { get; set; }
        public string? UpdatedBy { get; set; }

        // === Basic Information ===
        public string Name { get; set; } = string.Empty;
        public string? Domain { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }

        // === Address Information ===
        public string? BillingAddress { get; set; }
        public string? ShippingAddress { get; set; }
        public string? Website { get; set; }

        // === Customer Details ===
        public string Type { get; set; } = "Customer";
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

        // === Addresses ===
        public List<CRMSys.Application.Dtos.Request.CustomerAddressDto> Addresses { get; set; } = new();

        // === Computed Properties ===
        public bool IsCustomer => Type == "Customer";
        public bool IsProspect => Type == "Prospect";
        public bool IsPartner => Type == "Partner";
        public bool IsSupplier => Type == "Supplier";
        public bool HasBasicInfo => !string.IsNullOrEmpty(Name) && (!string.IsNullOrEmpty(Email) || !string.IsNullOrEmpty(Phone));
        public bool HasAddress => !string.IsNullOrEmpty(BillingAddress) || !string.IsNullOrEmpty(ShippingAddress);
        public string DisplayName => !string.IsNullOrEmpty(Name) ? Name : $"Customer {Id}";
    }
}
