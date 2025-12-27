using System.ComponentModel.DataAnnotations.Schema;

namespace CRMSys.Domain.Entities
{
    [Table("CRM_category_mapping")]
    public class CategoryMapping : BaseEntity
    {
        public long Id { get; set; }
        public string CRMCategoryName { get; set; } = string.Empty;
        public string? CRMCategoryId { get; set; }
        public string Dynamics365CategoryName { get; set; } = string.Empty;
        public string? Dynamics365CategoryId { get; set; }
        public bool IsActive { get; set; } = true;
        public string? Notes { get; set; }
    }
}
