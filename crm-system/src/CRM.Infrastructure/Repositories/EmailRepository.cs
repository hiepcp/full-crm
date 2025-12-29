using CRMSys.Application.Dtos.Request;
using CRMSys.Application.Interfaces.Repositories;
using CRMSys.Domain.Entities;
using Dapper;
using static Dapper.SqlBuilder;
using Shared.Dapper.Interfaces;
using Shared.Dapper.Models;
using Shared.Dapper.Repositories;

namespace CRMSys.Infrastructure.Repositories
{
    /// <summary>
    /// Email repository implementation using Dapper
    /// </summary>
    public class EmailRepository : DapperRepository<Email, long>, IEmailRepository
    {
        public EmailRepository(IUnitOfWork unitOfWork)
            : base(unitOfWork)
        {
        }

        /// <summary>
        /// Query emails with advanced filtering, pagination, ordering and field selection
        /// </summary>
        public async Task<PagedResult<Email>> QueryAsync(EmailQueryRequest query, CancellationToken ct = default)
        {
            // Build dynamic SQL based on query parameters
            var sqlBuilder = new SqlBuilder();
            sqlBuilder.Select("*");
            var selector = sqlBuilder.AddTemplate(@"
                SELECT /**select**/ FROM crm_email /**where**/ /**orderby**/ LIMIT @Take OFFSET @Skip
            ", new { Take = query.PageSize, Skip = (query.Page - 1) * query.PageSize });

            var countSelector = sqlBuilder.AddTemplate(@"
                SELECT COUNT(1) FROM crm_email /**where**/
            ");

            // Build WHERE clause
            BuildWhereClause(sqlBuilder, query);

            // Build ORDER BY clause
            if (!string.IsNullOrEmpty(query.OrderBy))
            {
                var orderBy = ParseOrderBy(query.OrderBy);
                sqlBuilder.OrderBy(orderBy);
            }
            else
            {
                sqlBuilder.OrderBy("ReceivedDateTime DESC");
            }

            // Execute queries
            using var multi = await Connection.QueryMultipleAsync(
                $"{selector.RawSql}; {countSelector.RawSql}",
                selector.Parameters,
                Transaction);

            var items = await multi.ReadAsync<Email>();
            var totalCount = await multi.ReadSingleAsync<int>();

            return new PagedResult<Email>
            {
                Items = items,
                TotalCount = totalCount
            };
        }

        /// <summary>
        /// Get email by ID
        /// </summary>
        public new async Task<Email?> GetByIdAsync(long id, CancellationToken ct = default)
        {
            return await base.GetByIdAsync(id, ct);
        }

        /// <summary>
        /// Create new email
        /// </summary>
        public async Task<long> CreateAsync(Email email, CancellationToken ct = default)
        {
            return await base.AddAsync(email, ct);
        }

        /// <summary>
        /// Update existing email
        /// </summary>
        public new async Task<bool> UpdateAsync(Email email, CancellationToken ct = default)
        {
            await base.UpdateAsync(email, ct);
            return true;
        }

        /// <summary>
        /// Delete email by ID
        /// </summary>
        public new async Task<bool> DeleteAsync(long id, CancellationToken ct = default)
        {
            await base.DeleteAsync(id, ct);
            return true;
        }

        /// <summary>
        /// Check if email exists by ID
        /// </summary>
        public async Task<bool> ExistsAsync(long id, CancellationToken ct = default)
        {
            var email = await GetByIdAsync(id, ct);
            return email != null;
        }

        /// <summary>
        /// Get emails by conversation ID
        /// </summary>
        public async Task<IEnumerable<Email>> GetByConversationIdAsync(string conversationId, CancellationToken ct = default)
        {
            return await Connection.QueryAsync<Email>(
                "SELECT * FROM crm_email WHERE ConversationId = @ConversationId ORDER BY ReceivedDateTime DESC",
                new { ConversationId = conversationId },
                Transaction);
        }

        /// <summary>
        /// Get emails by sender address
        /// </summary>
        public async Task<IEnumerable<Email>> GetBySenderAsync(string senderAddress, CancellationToken ct = default)
        {
            return await Connection.QueryAsync<Email>(
                "SELECT * FROM crm_email WHERE SenderAddress = @SenderAddress ORDER BY ReceivedDateTime DESC",
                new { SenderAddress = senderAddress },
                Transaction);
        }

        /// <summary>
        /// Get unread emails
        /// </summary>
        public async Task<IEnumerable<Email>> GetUnreadEmailsAsync(CancellationToken ct = default)
        {
            return await Connection.QueryAsync<Email>(
                "SELECT * FROM crm_email WHERE IsRead = 0 ORDER BY ReceivedDateTime DESC",
                transaction: Transaction);
        }

        /// <summary>
        /// Build WHERE clause from query parameters
        /// </summary>
        private void BuildWhereClause(SqlBuilder sqlBuilder, EmailQueryRequest query)
        {
            if (query.ActivityId.HasValue)
                sqlBuilder.Where("ActivityId = @ActivityId", new { ActivityId = query.ActivityId.Value });

            if (!string.IsNullOrEmpty(query.ConversationId))
                sqlBuilder.Where("ConversationId = @ConversationId", new { ConversationId = query.ConversationId });

            if (!string.IsNullOrEmpty(query.Subject))
                sqlBuilder.Where("Subject LIKE @Subject", new { Subject = $"%{query.Subject}%" });

            if (!string.IsNullOrEmpty(query.Importance))
                sqlBuilder.Where("Importance = @Importance", new { Importance = query.Importance });

            if (query.IsRead.HasValue)
                sqlBuilder.Where("IsRead = @IsRead", new { IsRead = query.IsRead.Value });

            if (query.IsDraft.HasValue)
                sqlBuilder.Where("IsDraft = @IsDraft", new { IsDraft = query.IsDraft.Value });

            if (query.HasAttachments.HasValue)
                sqlBuilder.Where("HasAttachments = @HasAttachments", new { HasAttachments = query.HasAttachments.Value });

            if (!string.IsNullOrEmpty(query.FromAddress))
                sqlBuilder.Where("FromAddress LIKE @FromAddress", new { FromAddress = $"%{query.FromAddress}%" });

            if (!string.IsNullOrEmpty(query.SenderAddress))
                sqlBuilder.Where("SenderAddress LIKE @SenderAddress", new { SenderAddress = $"%{query.SenderAddress}%" });

            if (query.ReceivedDateFrom.HasValue)
                sqlBuilder.Where("ReceivedDateTime >= @ReceivedDateFrom", new { ReceivedDateFrom = query.ReceivedDateFrom.Value });

            if (query.ReceivedDateTo.HasValue)
                sqlBuilder.Where("ReceivedDateTime <= @ReceivedDateTo", new { ReceivedDateTo = query.ReceivedDateTo.Value });

            if (query.SentDateFrom.HasValue)
                sqlBuilder.Where("SentDateTime >= @SentDateFrom", new { SentDateFrom = query.SentDateFrom.Value });

            if (query.SentDateTo.HasValue)
                sqlBuilder.Where("SentDateTime <= @SentDateTo", new { SentDateTo = query.SentDateTo.Value });
        }

        /// <summary>
        /// Parse order by string to SQL-safe format
        /// </summary>
        private string ParseOrderBy(string orderBy)
        {
            // White-list allowed fields
            var allowedFields = new HashSet<string>
            {
                "id",
                "conversationId",
                "subject",
                "bodyPreview",
                "importance",
                "hasAttachments",
                "isRead",
                "isDraft",
                "fromName",
                "fromAddress",
                "senderName",
                "senderAddress",
                "receivedDateTime",
                "sentDateTime",
                "createdDateTime",
                "lastModifiedDateTime",
                "createdOn",
                "updatedOn",
                "createdBy",
                "updatedBy"
            };

            var parts = orderBy.Split(',');
            var orderClauses = new List<string>();

            foreach (var part in parts)
            {
                var trimmed = part.Trim();
                if (string.IsNullOrEmpty(trimmed)) continue;

                var isDescending = trimmed.StartsWith('-');
                var field = isDescending ? trimmed[1..] : trimmed;

                // Validate field name
                if (allowedFields.Contains(field.ToLower()))
                {
                    // Map to actual database column names
                    var dbField = field.ToLower() switch
                    {
                        "id" => "Id",
                        "conversationId" => "ConversationId",
                        "subject" => "Subject",
                        "bodyPreview" => "BodyPreview",
                        "importance" => "Importance",
                        "hasAttachments" => "HasAttachments",
                        "isRead" => "IsRead",
                        "isDraft" => "IsDraft",
                        "fromName" => "FromName",
                        "fromAddress" => "FromAddress",
                        "senderName" => "SenderName",
                        "senderAddress" => "SenderAddress",
                        "receivedDateTime" => "ReceivedDateTime",
                        "sentDateTime" => "SentDateTime",
                        "createdDateTime" => "CreatedDateTime",
                        "lastModifiedDateTime" => "LastModifiedDateTime",
                        "createdOn" => "CreatedOn",
                        "updatedOn" => "UpdatedOn",
                        "createdBy" => "CreatedBy",
                        "updatedBy" => "UpdatedBy",
                        _ => null
                    };

                    if (dbField != null)
                    {
                        orderClauses.Add($"{dbField} {(isDescending ? "DESC" : "ASC")}");
                    }
                }
            }

            return string.Join(", ", orderClauses);
        }
    }
}
