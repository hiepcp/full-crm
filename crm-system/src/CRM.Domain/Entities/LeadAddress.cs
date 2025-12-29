using System.ComponentModel.DataAnnotations.Schema;

namespace CRMSys.Domain.Entities
{
    /// <summary>
    /// Lead address entity supporting multiple address types per lead
    /// </summary>
    [Table("crm_lead_address")]
    public class LeadAddress : BaseEntity
    {
        public long Id { get; set; }

        public long LeadId { get; set; }

        /// <summary>
        /// Address type: legal, delivery, forwarder, forwarder_agent_asia, other
        /// </summary>
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

