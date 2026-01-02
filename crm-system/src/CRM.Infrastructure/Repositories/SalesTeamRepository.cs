using CRMSys.Application.Dtos.Teams;
using CRMSys.Application.Interfaces.Repositories;
using CRMSys.Domain.Entities;
using Dapper;
using System.Data;
using Shared.Dapper.Interfaces;
using Shared.Dapper.Models;
using static Dapper.SqlBuilder;

namespace CRMSys.Infrastructure.Repositories
{
    public class SalesTeamRepository : ISalesTeamRepository
    {
        private readonly IUnitOfWork _unitOfWork;

        protected IDbConnection Connection => _unitOfWork.Connection;
        protected IDbTransaction Transaction => _unitOfWork.Transaction;

        public SalesTeamRepository(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
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
                sqlBuilder.OrderBy("CreatedOn DESC");
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
                "id", "name", "description", "createdon", "updatedon"
            };

            if (allowedFields.Any(x => x.Equals(orderBy, StringComparison.OrdinalIgnoreCase)))
            {
                var dbField = orderBy.ToLower() switch
                {
                    "id" => "id",
                    "name" => "name",
                    "description" => "description",
                    "createdon" => "CreatedOn",
                    "updatedon" => "UpdatedOn",
                    _ => "CreatedOn"
                };

                var direction = orderDirection?.ToUpper() == "ASC" ? "ASC" : "DESC";
                return $"{dbField} {direction}";
            }

            return "CreatedOn DESC";
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
                INSERT INTO crm_team_members (TeamId, UserEmail, role, CreatedOn, UpdatedOn, CreatedBy, UpdatedBy)
                VALUES (@TeamId, @UserEmail, @Role, @CreatedOn, @UpdatedOn, @CreatedBy, @UpdatedBy);
                SELECT LAST_INSERT_ID()";

            return await Connection.ExecuteScalarAsync<long>(sql, member, Transaction);
        }

        public async Task<TeamMember?> GetTeamMemberAsync(long teamId, string userEmail, CancellationToken ct = default)
        {
            const string sql = "SELECT * FROM crm_team_members WHERE TeamId = @TeamId AND UserEmail = @UserEmail";
            return await Connection.QuerySingleOrDefaultAsync<TeamMember>(
                sql, new { TeamId = teamId, UserEmail = userEmail }, Transaction);
        }

        public async Task<bool> UpdateMemberRoleAsync(long teamId, string userEmail, TeamMember member, CancellationToken ct = default)
        {
            const string sql = @"
                UPDATE crm_team_members
                SET role = @Role
                WHERE TeamId = @TeamId AND UserEmail = @UserEmail";

            var rowsAffected = await Connection.ExecuteAsync(sql, new { teamId = teamId, UserEmail = userEmail, Role = member.Role }, Transaction);
            return rowsAffected > 0;
        }

        public async Task<bool> RemoveMemberAsync(long teamId, string userEmail, CancellationToken ct = default)
        {
            const string sql = "DELETE FROM crm_team_members WHERE TeamId = @TeamId AND UserEmail = @UserEmail";
            var rowsAffected = await Connection.ExecuteAsync(sql, new { TeamId = teamId, UserEmail = userEmail }, Transaction);
            return rowsAffected > 0;
        }

        public async Task<int> GetDealCountAsync(long teamId, CancellationToken ct = default)
        {
            const string sql = "SELECT COUNT(1) FROM crm_deal WHERE SalesTeamId = @TeamId";
            return await Connection.ExecuteScalarAsync<int>(sql, new { TeamId = teamId }, Transaction);
        }

        public async Task<int> GetCustomerCountAsync(long teamId, CancellationToken ct = default)
        {
            const string sql = "SELECT COUNT(1) FROM crm_customer WHERE SalesTeamId = @TeamId";
            return await Connection.ExecuteScalarAsync<int>(sql, new { TeamId = teamId }, Transaction);
        }

        public async Task<SalesTeam?> GetByIdAsync(long id, CancellationToken ct = default)
        {
            const string sql = "SELECT * FROM crm_sales_teams WHERE Id = @Id";
            return await Connection.QuerySingleOrDefaultAsync<SalesTeam>(sql, new { Id = id }, Transaction);
        }

        public async Task<long> AddAsync(SalesTeam entity, CancellationToken ct = default)
        {
            const string sql = @"
                INSERT INTO crm_sales_teams (name, description, CreatedBy, CreatedOn, UpdatedBy, UpdatedOn)
                VALUES (@Name, @Description, @CreatedBy, @CreatedOn, @UpdatedBy, @UpdatedOn);
                SELECT LAST_INSERT_ID()";

            return await Connection.ExecuteScalarAsync<long>(sql, entity, Transaction);
        }

        public async Task<bool> UpdateAsync(SalesTeam entity, CancellationToken ct = default)
        {
            const string sql = @"
                UPDATE crm_sales_teams
                SET Name = @Name,
                    Description = @Description,
                    UpdatedBy = @UpdatedBy,
                    UpdatedOn = @UpdatedOn
                WHERE Id = @Id";

            var rowsAffected = await Connection.ExecuteAsync(sql, new
            {
                entity.Id,
                entity.Name,
                entity.Description,
                entity.UpdatedBy,
                entity.UpdatedOn
            }, Transaction);

            return rowsAffected > 0;
        }

        public async Task<bool> DeleteAsync(long id, CancellationToken ct = default)
        {
            const string sql = "DELETE FROM crm_sales_teams WHERE Id = @Id";
            var rowsAffected = await Connection.ExecuteAsync(sql, new { Id = id }, Transaction);
            return rowsAffected > 0;
        }
    }
}
