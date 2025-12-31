namespace CRMSys.Application.Dtos.Teams
{
    public class QueryTeamsRequest
    {
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 50;
        public string? Keyword { get; set; }
        public string? OrderBy { get; set; } = "createdAt";
        public string? OrderDirection { get; set; } = "desc";
    }
}