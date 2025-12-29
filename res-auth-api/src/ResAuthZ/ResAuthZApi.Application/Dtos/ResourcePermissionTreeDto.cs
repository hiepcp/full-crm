namespace ResAuthZApi.Application.Dtos
{
    public class ResourcePermissionTreeDto
    {
        public int ResourceId { get; set; }
        public string ResourceCode { get; set; } = string.Empty;
        public string ResourceName { get; set; } = string.Empty;

        public List<ActionPermissionDto> Actions { get; set; } = new();
    }

    public class ActionPermissionDto
    {
        public int ActionId { get; set; }
        public string ActionCode { get; set; } = string.Empty;
        public string ActionName { get; set; } = string.Empty;

        public bool Enabled { get; set; }
        public bool Granted { get; set; }

        public int? PermissionId { get; set; }
        public string? PermissionCode { get; set; }
    }
}
