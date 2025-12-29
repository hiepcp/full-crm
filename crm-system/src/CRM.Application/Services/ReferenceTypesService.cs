using AutoMapper;
using CRMSys.Application.Constants;
using CRMSys.Application.Dtos.Request;
using CRMSys.Application.Interfaces.Services;
using CRMSys.Domain.Entities;
using FluentValidation;
using Shared.Dapper.Interfaces;
using Shared.Dapper.Models;

namespace CRMSys.Application.Services
{
    public class ReferenceTypesService
        : BaseService<ReferenceTypes, long, ReferenceTypesRequestDto>, IReferenceTypesService
    {
        private readonly IMapper _mapper;
        public ReferenceTypesService(
            IRepository<ReferenceTypes, long> repository,
            IUnitOfWork unitOfWork,
            IMapper mapper,
            IValidator<ReferenceTypesRequestDto> validator
        ) : base(repository, unitOfWork, mapper, validator)
        {
            _mapper = mapper;
        }

        public async Task<IEnumerable<EnumDto>> GetPagedAsync(PagedRequest request, CancellationToken ct = default)
        {
            var rs = await base.GetPagedAsync(request, ct);

            var list = new List<EnumDto>();
            var entity = _mapper.Map(rs.Items, list);

            return entity;
        }

    }
}
