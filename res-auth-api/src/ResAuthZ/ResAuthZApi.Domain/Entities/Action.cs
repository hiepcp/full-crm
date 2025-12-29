using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ResAuthZApi.Domain.Entities
{
    [Table("actions")]
    public class Action
    {
        [Key]
        [Column("ActionId")]
        public int ActionId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
    }
}
