using AutoMapper;
using CRMSys.Application.Interfaces.Services;
using CRMSys.Domain.Entities;
using FluentValidation;
using Shared.Dapper.Interfaces;

namespace CRMSys.Application.Services
{
    public class CRMSharepointFileService
        : BaseService<CRMSharepointFile, long, CRMSharepointFile>, ICRMSharepointFileService
    {
        public CRMSharepointFileService(
            IRepository<CRMSharepointFile, long> repository,
            IUnitOfWork unitOfWork,
            IMapper mapper,
            IValidator<CRMSharepointFile> validator
        ) : base(repository, unitOfWork, mapper, validator)
        {
        }

        
    }
}
