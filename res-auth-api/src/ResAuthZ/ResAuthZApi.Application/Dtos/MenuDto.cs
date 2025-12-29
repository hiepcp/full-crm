using Dapper;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace ResAuthZApi.Application.Dtos
{
    public class MenuDto
    {
        public int Id { get; set; }
        public int? ParentId { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Icon { get; set; }
        public bool HideInMenu { get; set; }
        public string? Url { get; set; }
        public int SortOrder { get; set; }
        public bool CanAccess { get; set; }

        // SP trả về "View,Create,Update"
        [JsonIgnore] // => không serialize ra JSON
        public string? Permissions { get; set; }

        // Map sang List<string> tiện cho FE
        public List<string> PermissionList =>
            string.IsNullOrEmpty(Permissions)
                ? new List<string>()
                : Permissions.Split(',').ToList();
    }
}
