using Shared.Dapper.Models;

namespace CRMSys.Application.Dtos.Request
{
    /// <summary>
    /// Wrapper to match client payload: { "request": { "filters": [...] } }
    /// </summary>
    public class DealDomainQueryWrapper
    {
        public DealDomainQueryRequest? Request { get; set; }
    }

    public class DealDomainQueryRequest
    {
        public List<FilterRequest>? Filters { get; set; }
    }
}

