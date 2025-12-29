using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ResAuthZApi.Domain.Entities
{
    [Table("permissions")]
    public class Permission
    {
        [Key]
        public int PermissionId { get; set; }
        public int ResourceId { get; set; }
        public int ActionId { get; set; }
        public string Code { get; set; } = string.Empty;
        public string? Description { get; set; }
    }
}
