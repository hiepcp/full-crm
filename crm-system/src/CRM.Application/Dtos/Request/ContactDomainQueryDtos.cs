using Shared.Dapper.Models;

namespace CRMSys.Application.Dtos.Request
{
    /// <summary>
    /// Wrapper for Contact domain query with filter list
    /// </summary>
    public class ContactDomainQueryWrapper
    {
        public ContactDomainQueryRequest? Request { get; set; }
    }

    public class ContactDomainQueryRequest
    {
        public List<FilterRequest>? Filters { get; set; }
    }
}
