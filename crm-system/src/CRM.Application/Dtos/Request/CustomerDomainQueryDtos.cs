using Shared.Dapper.Models;

namespace CRMSys.Application.Dtos.Request
{
    /// <summary>
    /// Wrapper for customer domain query with filter list
    /// </summary>
    public class CustomerDomainQueryWrapper
    {
        public CustomerDomainQueryRequest? Request { get; set; }
    }

    public class CustomerDomainQueryRequest
    {
        public List<FilterRequest>? Filters { get; set; }
    }
}
