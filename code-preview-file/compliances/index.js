export class CreateCompliancesUseCase {
  constructor(complianceDetailRepository) {
    this.complianceDetailRepository = complianceDetailRepository
  }
  async execute(payload) {
    return await this.complianceDetailRepository.create(payload)
  }
}

export class GetPagingCompliancesUseCase {
  constructor(complianceDetailRepository) {
    this.complianceDetailRepository = complianceDetailRepository
  }
  async execute(_page, _pageSize, _sortColumn, _sortOrder, _payload) {
    return await this.complianceDetailRepository.getAllPaging(_page, _pageSize, _sortColumn, _sortOrder, _payload)
  }
}

export class UpdateCompliancesUseCase {
  constructor(complianceDetailRepository) {
    this.complianceDetailRepository = complianceDetailRepository
  }
  async execute(payload) {
    return await this.complianceDetailRepository.update(payload)
  }
}

export class DeleteCompliancesUseCase {
  constructor(complianceDetailRepository) {
    this.complianceDetailRepository = complianceDetailRepository
  }
  async execute(id) {
    return await this.complianceDetailRepository.delete(id)
  }
}

export class DeleteMultiCompliancesUseCase {
  constructor(complianceDetailRepository) {
    this.complianceDetailRepository = complianceDetailRepository
  }
  async execute(ids) {
    return await this.complianceDetailRepository.deleteMulti(ids)
  }
}

export class CreateCompliancesWithCategoryIdUseCase {
  constructor(complianceDetailRepository) {
    this.complianceDetailRepository = complianceDetailRepository
  }
  async execute(categoryId, payload) {
    return await this.complianceDetailRepository.createWithCategoryId(categoryId, payload)
  }
}

export class CreateCompliancesWithFileAndCategoryUseCase {
  constructor(complianceDetailRepository) {
    this.complianceDetailRepository = complianceDetailRepository
  }
  async execute(payload) {
    return await this.complianceDetailRepository.createWithFileAndCategory(payload)
  }
}

export class UpdateCompliancesCheckUpgradeVersionUseCase {
  constructor(complianceDetailRepository) {
    this.complianceDetailRepository = complianceDetailRepository
  }
  async execute(payload) {
    return await this.complianceDetailRepository.updateCheckUpgradeVersion(payload)
  }
}

export class GetCompliancesByCategoryIdsUseCase {
  constructor(complianceDetailRepository) {
    this.complianceDetailRepository = complianceDetailRepository
  }
  async execute(_page, _pageSize, _sortColumn, _sortOrder, _payload) {
    return await this.complianceDetailRepository.getByCategoryIdsPaging(_page, _pageSize, _sortColumn, _sortOrder, _payload)
  }
}

export class GetFileByIdRefUseCase {
  constructor(complianceDetailRepository) {
    this.complianceDetailRepository = complianceDetailRepository
  }
  async execute(idRef) {
    return await this.complianceDetailRepository.getFileByIdRef(idRef)
  }
}