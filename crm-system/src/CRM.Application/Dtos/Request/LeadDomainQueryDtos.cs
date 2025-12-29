using Shared.Dapper.Models;

namespace CRMSys.Application.Dtos.Request
{
    /// <summary>
    /// Wrapper to match client payload: { "request": { "filters": [...] } }
    /// </summary>
    public class LeadDomainQueryWrapper
    {
        public LeadDomainQueryRequest? Request { get; set; }
    }

    public class LeadDomainQueryRequest
    {
        public List<FilterRequest>? Filters { get; set; }
    }
}

