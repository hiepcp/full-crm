namespace CRMSys.Application.Dtos.Request
{
    public class CRMCategoryRequestDto
    {
        public long? ParentId { get; set; } = null;
        public string? Name { get; set; }
        public byte? Level { get; set; }
        public byte ReferenceType { get; set; }
        public string ReferenceValue { get; set; } = string.Empty;
        public string? Note { get; set; }
    }
}
