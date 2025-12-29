using System.ComponentModel.DataAnnotations.Schema;

namespace ResAuthZApi.Domain.Entities
{
    [Table("user_roles")]
    public class UserRole {
        public int UserId { get; set; }
        public int RoleId { get; set; }
        public int AppId { get; set; }
    }        
}
