using CRMSys.Application.Dtos.Teams;
using CRMSys.Domain.Entities;
using Dapper;
using Shared.Dapper.Interfaces;
using Shared.Dapper.Models;
using Shared.Dapper.Repositories;
using static Dapper.SqlBuilder;

namespace CRMSys.Infrastructure.Repositories
{
    public class SalesTeamRepository : DapperRepository<SalesTeam, long>, ISalesTeamRepository
    {
        public SalesTeamRepository(IUnitOfWork unitOfWork)
            : base(unitOfWork)
        {
        }

        public async Task<PagedResult<SalesTeam>> QueryAsync(QueryTeamsRequest query, CancellationToken ct = default)
        {
            var sqlBuilder = new SqlBuilder();
            sqlBuilder.Select("*");
            var selector = sqlBuilder.AddTemplate(@"
                SELECT /**select**/ FROM crm_sales_teams /**where**/ /**orderby**/ LIMIT @Take OFFSET @Skip
            ", new { Take = query.PageSize, Skip = (query.Page - 1) * query.PageSize });

            var countSelector = sqlBuilder.AddTemplate(@"
                SELECT COUNT(1) FROM crm_sales_teams /**where**/
            ");

            // Build WHERE clause
            if (!string.IsNullOrEmpty(query.Keyword))
            {
                sqlBuilder.Where("Name LIKE @Keyword", new { Keyword = $"%{query.Keyword}%" });
            }

            // Build ORDER BY clause
            if (!string.IsNullOrEmpty(query.OrderBy))
            {
                var orderBy = ParseOrderBy(query.OrderBy, query.OrderDirection);
                sqlBuilder.OrderBy(orderBy);
            }
            else
            {
                sqlBuilder.OrderBy("CreatedAt DESC");
            }

            // Execute queries
            using var multi = await Connection.QueryMultipleAsync(
                $"{selector.RawSql}; {countSelector.RawSql}",
                selector.Parameters,
                Transaction);

            var items = await multi.ReadAsync<SalesTeam>();
            var totalCount = await multi.ReadSingleAsync<int>();

            return new PagedResult<SalesTeam>
            {
                Items = items,
                TotalCount = totalCount
            };
        }

        private string ParseOrderBy(string orderBy, string orderDirection)
        {
            var allowedFields = new HashSet<string>
            {
                "id", "name", "description", "createdat", "updatedat"
            };

            if (allowedFields.Any(x => x.Equals(orderBy, StringComparison.OrdinalIgnoreCase)))
            {
                var dbField = orderBy.ToLower() switch
                {
                    "id" => "Id",
                    "name" => "Name",
                    "description" => "Description",
                    "createdat" => "CreatedAt",
                    "updatedat" => "UpdatedAt",
                    _ => "CreatedAt"
                };

                var direction = orderDirection?.ToUpper() == "ASC" ? "ASC" : "DESC";
                return $"{dbField} {direction}";
            }

            return "CreatedAt DESC";
        }

        public async Task<bool> IsNameUniqueAsync(string name, CancellationToken ct = default)
        {
            const string sql = "SELECT COUNT(1) FROM crm_sales_teams WHERE Name = @Name";
            var count = await Connection.ExecuteScalarAsync<int>(sql, new { Name = name }, Transaction);
            return count == 0;
        }

        public async Task<int> GetMemberCountAsync(long teamId, CancellationToken ct = default)
        {
            const string sql = "SELECT COUNT(1) FROM crm_team_members WHERE TeamId = @TeamId";
            return await Connection.ExecuteScalarAsync<int>(sql, new { TeamId = teamId }, Transaction);
        }

        public async Task<PagedResult<TeamMember>> GetTeamMembersAsync(long teamId, TeamMemberQueryRequest query, CancellationToken ct = default)
        {
            var sqlBuilder = new SqlBuilder();
            sqlBuilder.Select("*");
            var selector = sqlBuilder.AddTemplate(@"
                SELECT /**select**/ FROM crm_team_members /**where**/ /**orderby**/ LIMIT @Take OFFSET @Skip
            ", new { Take = query.PageSize, Skip = (query.Page - 1) * query.PageSize });

            var countSelector = sqlBuilder.AddTemplate(@"
                SELECT COUNT(1) FROM crm_team_members /**where**/
            ");

            // Build WHERE clause
            sqlBuilder.Where("TeamId = @TeamId", new { TeamId = teamId });

            if (!string.IsNullOrEmpty(query.Role))
            {
                sqlBuilder.Where("Role = @Role", new { Role = query.Role });
            }

            // Build ORDER BY clause
            sqlBuilder.OrderBy("JoinedAt DESC");

            // Execute queries
            using var multi = await Connection.QueryMultipleAsync(
                $"{selector.RawSql}; {countSelector.RawSql}",
                selector.Parameters,
                Transaction);

            var items = await multi.ReadAsync<TeamMember>();
            var totalCount = await multi.ReadSingleAsync<int>();

            return new PagedResult<TeamMember>
            {
                Items = items,
                TotalCount = totalCount
            };
        }

        public async Task<long> AddMemberAsync(TeamMember member, CancellationToken ct = default)
        {
            const string sql = @"
                INSERT INTO crm_team_members (team_id, user_email, role, joined_at)
                VALUES (@TeamId, @UserEmail, @Role, @JoinedAt);
                SELECT LAST_INSERT_ID();";

            return await Connection.ExecuteScalarAsync<long>(sql, member, Transaction);
        }

        public async Task<TeamMember?> GetTeamMemberAsync(long teamId, string userEmail, CancellationToken ct = default)
        {
            const string sql = "SELECT * FROM crm_team_members WHERE team_id = @TeamId AND user_email = @UserEmail";
            return await Connection.QuerySingleOrDefaultAsync<TeamMember>(
                sql, new { TeamId = teamId, UserEmail = userEmail }, Transaction);
        }

        public async Task<bool> UpdateMemberRoleAsync(long teamId, string userEmail, TeamMember member, CancellationToken ct = default)
        {
            const string sql = @"
                UPDATE crm_team_members
                SET role = @Role
                WHERE team_id = @TeamId AND user_email = @UserEmail";

            var rowsAffected = await Connection.ExecuteAsync(sql, new { teamId = teamId, UserEmail = userEmail, Role = member.Role }, Transaction);
            return rowsAffected > 0;
        }

        public async Task<int> GetDealCountAsync(long teamId, CancellationToken ct = default)
        {
            const string sql = "SELECT COUNT(1) FROM crm_deal WHERE sales_team_id = @TeamId";
            return await Connection.ExecuteScalarAsync<int>(sql, new { TeamId = teamId }, Transaction);
        }

        public async Task<int> GetCustomerCountAsync(long teamId, CancellationToken ct = default)
        {
            const string sql = "SELECT COUNT(1) FROM crm_customer WHERE sales_team_id = @TeamId";
            return await Connection.ExecuteScalarAsync<int>(sql, new { TeamId = teamId }, Transaction);
        }
    }
}