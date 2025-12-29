namespace ResAuthZApi.Application.Dtos
{
    public class UserPermissionResult
    {
        public string Email { get; set; } = string.Empty;
        public string AppCode { get; set; } = string.Empty;
        public string RoleCode { get; set; } = string.Empty;
        public string RoleDescription { get; set; } = string.Empty;
        public string ResourceCode { get; set; } = string.Empty;
        public string ActionCode { get; set; } = string.Empty;
        public string ActionName { get; set; } = string.Empty;

        // Key = ResourceCode, Value = danh sách ActionCode (View/Create/Update/Delete/Print...)
        public Dictionary<string, List<string>> PermissionsByResource { get; init; } = new();
    }
}
