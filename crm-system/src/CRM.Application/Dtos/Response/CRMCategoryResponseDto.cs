using CRMSys.Domain.Entities;

namespace CRMSys.Application.Dtos.Response
{
    public class CRMCategoryResponseDto : CRMCategory
    {
        public string? ParentName { get; set; } = null;
        public string? ReferenceTypeName { get; set; } = null;
    }
}
