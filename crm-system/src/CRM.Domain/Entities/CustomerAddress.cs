using System.ComponentModel.DataAnnotations.Schema;

namespace CRMSys.Domain.Entities
{
    /// <summary>
    /// Customer address entity supporting multiple address types per customer
    /// </summary>
    [Table("crm_customer_address")]
    public class CustomerAddress : BaseEntity
    {
        public long Id { get; set; }

        public long CustomerId { get; set; }

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

