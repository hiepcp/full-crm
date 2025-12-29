using System.ComponentModel.DataAnnotations.Schema;

namespace ResAuthZApi.Domain.Entities
{
    [Table("menus")]
    public class Menu
    {
        public int Id { get; set; }
        public int? ParentId { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Icon { get; set; }
        public bool HideInMenu { get; set; }
        public string? Url { get; set; }
        public int? ResourceId { get; set; }
        public int AppId { get; set; }
        public int SortOrder { get; set; }
        public bool CanAccess { get; set; }
    }
}
