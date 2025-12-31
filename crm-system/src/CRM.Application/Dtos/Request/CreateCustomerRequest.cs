namespace CRMSys.Application.Dtos.Request
{
    public class CreateCustomerRequest
    {
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
        public List<CustomerAddressDto>? Addresses { get; set; }
    }
}
