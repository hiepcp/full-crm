using Shared.Dapper.Models;

namespace ResAuthZApi.Application.Interfaces.Services
{
    public interface IBaseService<TEntity, TKey>
        where TEntity : class
    {
        Task<TEntity?> GetByIdAsync(TKey id, CancellationToken ct = default);
        Task<IEnumerable<TEntity>> GetAllAsync(CancellationToken ct = default);
        Task<TKey> AddAsync(TEntity entity, CancellationToken ct = default);
        Task UpdateAsync(TEntity entity, CancellationToken ct = default);
        Task DeleteAsync(TKey id, CancellationToken ct = default);
        Task<PagedResult<TEntity>> GetPagedAsync(PagedRequest request, CancellationToken ct = default);
    }
}
