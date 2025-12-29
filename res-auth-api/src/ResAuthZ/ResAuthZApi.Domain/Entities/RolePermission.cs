using System.ComponentModel.DataAnnotations.Schema;

namespace ResAuthZApi.Domain.Entities
{
    [Table("role_permissions")]
    public class RolePermission
    {
        public int RoleId { get; set; }
        public int PermissionId { get; set; }
    }
}
