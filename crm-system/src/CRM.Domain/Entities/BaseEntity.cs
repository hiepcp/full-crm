using System.ComponentModel.DataAnnotations.Schema;

namespace CRMSys.Domain.Entities
{
    public abstract class BaseEntity
    {
        public DateTime CreatedOn { get; set; }
        public string? CreatedBy { get; set; }
        public DateTime UpdatedOn { get; set; }
        public string? UpdatedBy { get; set; }
    }
}
