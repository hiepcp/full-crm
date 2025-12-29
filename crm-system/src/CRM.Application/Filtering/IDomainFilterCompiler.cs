using System.Collections.Generic;

namespace CRMSys.Application.Filtering
{
    public interface IDomainFilterCompiler
    {
        DomainFilterResult Compile(
            object? domainExpression,
            ISet<string> allowedFields,
            IDictionary<string, string>? fieldToColumnMap = null
        );
    }
}


