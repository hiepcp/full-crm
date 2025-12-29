using System.ComponentModel.DataAnnotations.Schema;

namespace ResAuthZApi.Domain.Entities
{
    [Table("resource_actions")]
    public class ResourceAction
    {
        public int ResourceId { get; set; }
        public int ActionId { get; set; }
    }
}
