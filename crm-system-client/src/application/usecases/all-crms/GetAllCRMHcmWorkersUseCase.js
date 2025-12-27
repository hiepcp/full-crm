export class GetAllCRMHcmWorkersUseCase {
  constructor(repository) {
    this.repository = repository
  }

  async execute(page, pageSize, sortColumn, sortOrder, filters = []) {
    // HCM Workers modal name
    const modalName = "RSVNHcmWorkers"

    // Chuẩn bị payload với filters
    const payload = {
      filters: filters || []
    }

    return await this.repository.getByModalName(modalName, page, pageSize, sortColumn, sortOrder, payload)
  }
}
