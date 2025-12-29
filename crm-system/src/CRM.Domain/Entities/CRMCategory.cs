using System.ComponentModel.DataAnnotations.Schema;

namespace CRMSys.Domain.Entities
{
    [Table("CRM_category")]
    public class CRMCategory : BaseEntity
    {
        public long Id { get; set; }
        public long? ParentId { get; set; }
        public string? Name { get; set; }
        public byte? Level { get; set; }
        public byte ReferenceType { get; set; }
        public string ReferenceValue { get; set; } = string.Empty;
        public string? Note { get; set; }
    }
}
