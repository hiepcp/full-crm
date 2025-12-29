namespace CRMSys.Application.Dtos.Request
{
    /// <summary>
    /// DTO representing an address attached to a lead
    /// </summary>
    public class LeadAddressDto
    {
        public long? Id { get; set; }
        public string AddressType { get; set; } = "legal";
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
    }
}

