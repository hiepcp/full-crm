using CRMSys.Domain.Entities;
using Dapper;
using System.Data;

namespace CRMSys.Infrastructure.TypeHandlers
{
    public class TeamRoleTypeHandler : SqlMapper.TypeHandler<TeamRole>
    {
        public override void SetValue(IDbDataParameter parameter, TeamRole value)
        {
            parameter.Value = value.ToString();
        }

        public override TeamRole Parse(object value)
        {
            if (value is string stringValue)
            {
                return Enum.Parse<TeamRole>(stringValue, ignoreCase: true);
            }

            throw new InvalidOperationException($"Cannot convert {value} to TeamRole");
        }
    }
}
