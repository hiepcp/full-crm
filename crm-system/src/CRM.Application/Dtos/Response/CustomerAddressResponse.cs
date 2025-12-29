namespace CRMSys.Application.Dtos.Response
{
    /// <summary>
    /// Response DTO for CustomerAddress data
    /// Can be customized based on field selection
    /// </summary>
    public class CustomerAddressResponse
    {
        // === Basic Identity ===
        public long Id { get; set; }
        public long CustomerId { get; set; }
        public DateTime CreatedOn { get; set; }
        public string? CreatedBy { get; set; }
        public DateTime? UpdatedOn { get; set; }
        public string? UpdatedBy { get; set; }

        // === Address Information ===
        public string AddressType { get; set; } = "other";
        public string? CompanyName { get; set; }
        public string? AddressLine { get; set; }
        public string? Postcode { get; set; }
        public string? City { get; set; }
        public string? Country { get; set; }

        // === Contact Information ===
        public string? ContactPerson { get; set; }
        public string? Email { get; set; }
        public string? TelephoneNo { get; set; }

        // === Additional Information ===
        public string? PortOfDestination { get; set; }
        public bool IsPrimary { get; set; }

        // === Computed Properties ===
        public bool IsLegalAddress => AddressType == "legal";
        public bool IsDeliveryAddress => AddressType == "delivery";
        public bool IsForwarderAddress => AddressType == "forwarder";
        public bool IsForwarderAgentAsiaAddress => AddressType == "forwarder_agent_asia";
        public bool HasContactInfo => !string.IsNullOrEmpty(ContactPerson) || !string.IsNullOrEmpty(Email) || !string.IsNullOrEmpty(TelephoneNo);
        public string DisplayAddress => string.IsNullOrEmpty(AddressLine) ? "No Address" : AddressLine;
        public string FullAddress => $"{AddressLine}, {City} {Postcode}, {Country}".Trim(' ', ',');
        public int DaysSinceCreation => (int)(DateTime.UtcNow - CreatedOn).TotalDays;
        public int DaysSinceUpdate => UpdatedOn.HasValue ? (int)(DateTime.UtcNow - UpdatedOn.Value).TotalDays : 0;

        /// <summary>
        /// Get field value by name (for dynamic field selection)
        /// </summary>
        public object? GetFieldValue(string fieldName)
        {
            return fieldName.ToLower() switch
            {
                "id" => Id,
                "customerId" => CustomerId,
                "addressType" => AddressType,
                "companyName" => CompanyName,
                "addressLine" => AddressLine,
                "postcode" => Postcode,
                "city" => City,
                "country" => Country,
                "contactPerson" => ContactPerson,
                "email" => Email,
                "telephoneNo" => TelephoneNo,
                "phone" => TelephoneNo,
                "portOfDestination" => PortOfDestination,
                "isPrimary" => IsPrimary,
                "createdOn" => CreatedOn,
                "createdBy" => CreatedBy,
                "updatedOn" => UpdatedOn,
                "updatedBy" => UpdatedBy,
                "displayAddress" => DisplayAddress,
                "fullAddress" => FullAddress,
                _ => null
            };
        }
    }
}
