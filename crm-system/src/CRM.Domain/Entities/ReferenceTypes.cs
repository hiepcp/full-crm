using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CRMSys.Domain.Entities
{
    [Table("crm_reference_types")]
    public class ReferenceTypes : BaseEntity
    {
        [Key]
        [Column("Id")]
        public int Id { get; set; }
        public string? Code { get; set; }
        public string? Name { get; set; }
        public string? Description { get; set; }
        public int SortOrder { get; set; }
        public byte ComplType { get; set; }
        public int Kind { get; set; }
        public string? Model { get; set; }
        public int ModelType { get; set; }
    }
}
