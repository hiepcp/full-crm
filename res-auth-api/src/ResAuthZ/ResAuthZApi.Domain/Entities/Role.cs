using System.ComponentModel.DataAnnotations.Schema;

namespace ResAuthZApi.Domain.Entities
{
    [Table("roles")]
    public class Role
    {
        public int RoleId { get; init; }
        public int AppId { get; set; }
        public string RoleName { get; set; } = string.Empty;
        public string? Description { get; set; }
    }    
}
