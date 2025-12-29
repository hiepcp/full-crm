using FluentValidation;
using Shared.Dapper.Models;

namespace CRMSys.Application.Interfaces.Services
{
    public interface IBaseService<TEntity, TKey, TRequestDto>
        where TEntity : class
    {
        Task<TEntity?> GetByIdAsync(TKey id, CancellationToken ct = default);
        Task<IEnumerable<TEntity>?> GetAllAsync(CancellationToken ct = default);
        Task<TKey> AddAsync(TRequestDto dto, string userEmail, CancellationToken ct = default);
        Task UpdateAsync(TKey id, TRequestDto dto, string userEmail, CancellationToken ct = default);
        Task DeleteAsync(TKey id, string userEmail, CancellationToken ct = default);
        Task<PagedResult<TEntity>> GetPagedAsync(PagedRequest request, CancellationToken ct = default);
        Task DeleteMultiAsync(IEnumerable<TKey> ids, CancellationToken ct = default);
    }
}
