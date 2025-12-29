using Shared.Dapper.Models;

namespace CRMSys.Application.Dtos.Request
{
    /// <summary>
    /// Wrapper for activity domain query with filter list
    /// </summary>
    public class ActivityDomainQueryWrapper
    {
        public ActivityDomainQueryRequest? Request { get; set; }
    }

    public class ActivityDomainQueryRequest
    {
        public List<FilterRequest>? Filters { get; set; }
    }
}
