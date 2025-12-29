namespace CRMSys.Application.Dtos.Request
{
    public class ReferenceTypesRequestDto
    {
        public int Id { get; set; }
        public string? Name { get; set; }
        public string? Description { get; set; }
        public int SortOrder { get; set; }
        public int Kind { get; set; }
    }
}
