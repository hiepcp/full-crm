using System.Collections.Generic;

namespace CRMSys.Application.Filtering
{
    public sealed class DomainFilterResult
    {
        public string WhereClause { get; }
        public IReadOnlyDictionary<string, object?> Parameters { get; }
        public IReadOnlyCollection<string> ReferencedFields { get; }

        public DomainFilterResult(string whereClause, IDictionary<string, object?> parameters, ISet<string> referencedFields)
        {
            WhereClause = whereClause;
            Parameters = new Dictionary<string, object?>(parameters);
            ReferencedFields = new HashSet<string>(referencedFields);
        }
    }
}


