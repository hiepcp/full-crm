using System.ComponentModel.DataAnnotations.Schema;

namespace ResAuthZApi.Domain.Entities
{
    [Table("applications")]
    public class Application
    {
        public int AppId { get; set; }
        public string AppCode { get; set; } = string.Empty;
        public string AppName { get; set; } = string.Empty;
    }
}
