using System.ComponentModel.DataAnnotations.Schema;

namespace CRMSys.Domain.Entities
{
    /// <summary>
    /// DealQuotation entity representing the link between deals and quotations
    /// </summary>
    [Table("crm_deal_quotation")]
    public class DealQuotation : BaseEntity
    {
        public long Id { get; set; }

        public long DealId { get; set; }
        public string QuotationNumber { get; set; } = string.Empty;

        // Navigation properties (optional, for EF Core relationships)
        // public Deal Deal { get; set; }
        // public Quotation Quotation { get; set; }
    }
}
