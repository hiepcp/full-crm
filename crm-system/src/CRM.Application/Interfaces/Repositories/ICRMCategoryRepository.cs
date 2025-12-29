using CRMSys.Domain.Entities;
using Shared.Dapper.Interfaces;
using System.Threading;
using System.Threading.Tasks;

namespace CRMSys.Application.Interfaces.Repositories
{
    public interface ICRMCategoryRepository
    {
        /// <summary>
        /// Ki?m tra tên có duy nh?t trong cùng c?p (ParentId) hay không.
        /// </summary>
        /// <param name="name">Tên c?n ki?m tra</param>
        /// <param name="parentId">ParentId cùng c?p</param>
        /// <param name="excludeId">Id c?n lo?i tr? (khi update)</param>
        /// <param name="ct">Token</param>
        /// <returns>true n?u không trùng, false n?u dã t?n t?i</returns>
        Task<bool> CheckUniqueNameAsync(string name, long? parentId, long? excludeId = null, CancellationToken ct = default);
    }
}
