using ResAuthZApi.Application.Interfaces.Services;
using Shared.Dapper.Interfaces;
using Shared.Dapper.Models;

namespace ResAuthZApi.Application.Services
{
    public class BaseService<TEntity, TKey> : IBaseService<TEntity, TKey>
        where TEntity : class
    {
        private readonly IRepository<TEntity, TKey> _repository;
        private readonly IUnitOfWork _unitOfWork;

        public BaseService(IRepository<TEntity, TKey> repository, IUnitOfWork unitOfWork)
        {
            _repository = repository;
            _unitOfWork = unitOfWork;
        }

        public virtual async Task<IEnumerable<TEntity>> GetAllAsync(CancellationToken ct = default)
        {
            return await _repository.GetAllAsync(ct);
        }

        public virtual async Task<TEntity?> GetByIdAsync(TKey id, CancellationToken ct = default)
        {
            return await _repository.GetByIdAsync(id, ct);
        }

        public virtual async Task<PagedResult<TEntity>> GetPagedAsync(PagedRequest request, CancellationToken ct = default)
        {
            return await _repository.GetPagedAsync(request, ct);
        }

        public virtual async Task<TKey> AddAsync(TEntity entity, CancellationToken ct = default)
        {
            if (entity == null) throw new ArgumentNullException(nameof(entity));

            var id = await _repository.AddAsync(entity, ct);
            await _unitOfWork.CommitAsync();

            // set lại Id cho entity nếu có property
            var prop = typeof(TEntity).GetProperty("Id");
            if (prop != null && prop.CanWrite)
            {
                object valueToSet = id;

                if (prop.PropertyType == typeof(Guid))
                {
                    // nếu id trả về là string hoặc object -> convert về Guid
                    if (id is string s)
                        valueToSet = Guid.Parse(s);
                    else if (id is Guid g)
                        valueToSet = g;
                    else
                        valueToSet = Guid.Parse(id.ToString()!);
                }
                else
                {
                    valueToSet = Convert.ChangeType(id, prop.PropertyType);
                }

                prop.SetValue(entity, valueToSet);
            }

            return id;
        }

        public virtual async Task UpdateAsync(TEntity entity, CancellationToken ct = default)
        {
            await _repository.UpdateAsync(entity, ct);
            await _unitOfWork.CommitAsync();
        }

        public virtual async Task DeleteAsync(TKey id, CancellationToken ct = default)
        {
            await _repository.DeleteAsync(id, ct);
            await _unitOfWork.CommitAsync();
        }

    }
}
