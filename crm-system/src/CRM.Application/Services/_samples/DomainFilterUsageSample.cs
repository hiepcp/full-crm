using System.Collections.Generic;
using CRMSys.Application.Filtering;

namespace CRMSys.Application.Services._samples
{
    // Sample only: demonstrates how a service would use the compiler
    internal static class DomainFilterUsageSample
    {
        public static DomainFilterResult CompileForLead(IDomainFilterCompiler compiler, object? domain)
        {
            var allowed = new HashSet<string>(new[]
            {
                "status",
                "source",
                "ownerId",
                "score",
                "isConverted",
                "createdOn",
                "updatedOn",
                "firstName",
                "lastName",
                "company",
                "email",
                "website",
                "domain"
            });
            var map = new Dictionary<string, string>
            {
                // map C# DTO fields to DB columns if they differ
              { "ownerId", "ownerId" },
            { "createdOn", "createdOn" },
            { "updatedOn", "updatedOn" }
            };

            return compiler.Compile(domain, allowed, map);
        }
    }
}


