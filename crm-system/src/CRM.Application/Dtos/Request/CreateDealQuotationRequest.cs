using System.ComponentModel.DataAnnotations;

namespace CRMSys.Application.Dtos.Request
{
    public class CreateDealQuotationRequest
    {
        [Required]
        public long DealId { get; set; }

        [Required]
        [MaxLength(50)]
        public string QuotationNumber { get; set; } = string.Empty;
    }
}


