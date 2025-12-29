namespace CRMSys.Application.Dtos.Response
{
    /// <summary>
    /// Response DTO for Address data (unified for Lead and Customer addresses)
    /// </summary>
    public class AddressResponse
    {
        // === Basic Identity ===
        public long Id { get; set; }
        public DateTime CreatedOn { get; set; }
        public string? CreatedBy { get; set; }
        public DateTime? UpdatedOn { get; set; }
        public string? UpdatedBy { get; set; }

        // === Relation Information ===
        public string RelationType { get; set; } = string.Empty; // "lead" or "customer"
        public long RelationId { get; set; } // LeadId or CustomerId

        // === Address Details ===
        public string AddressType { get; set; } = "legal"; // legal, delivery, forwarder, forwarder_agent_asia, other
        public string? CompanyName { get; set; }
        public string? AddressLine { get; set; }
        public string? Postcode { get; set; }
        public string? City { get; set; }
        public string? Country { get; set; }
        public string? ContactPerson { get; set; }
        public string? Email { get; set; }
        public string? TelephoneNo { get; set; }
        public string? PortOfDestination { get; set; }
        public bool IsPrimary { get; set; }

        // === Computed Properties ===
        public string DisplayAddressType => AddressType switch
        {
            "legal" => "Legal Address",
            "delivery" => "Delivery Address",
            "forwarder" => "Forwarder",
            "forwarder_agent_asia" => "Forwarder Agent (Asia)",
            "other" => "Other",
            _ => AddressType
        };

        public string FullAddress => string.Join(", ",
            new[] { AddressLine, City, Postcode, Country }
            .Where(s => !string.IsNullOrWhiteSpace(s)));

        // === Status Helpers ===
        public bool IsLegalAddress => AddressType == "legal";
        public bool IsDeliveryAddress => AddressType == "delivery";
        public bool IsForwarderAddress => AddressType == "forwarder";
        public bool IsRelatedToLead => RelationType == "lead";
        public bool IsRelatedToCustomer => RelationType == "customer";
    }
}
