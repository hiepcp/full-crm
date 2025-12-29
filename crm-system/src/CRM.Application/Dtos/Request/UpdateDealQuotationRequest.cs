using System.ComponentModel.DataAnnotations;

namespace CRMSys.Application.Dtos.Request
{
    public class UpdateDealQuotationRequest
    {
        [Required]
        public long Id { get; set; }

        [Required]
        public long DealId { get; set; }

        [Required]
        [MaxLength(50)]
        public string QuotationNumber { get; set; } = string.Empty;
    }
}


