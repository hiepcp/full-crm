export class SearchDocumentsUseCase {
  constructor(sharepointRepository) {
    this.sharepointRepository = sharepointRepository
  }
  async execute(query, entityType = null, entityId = null) {
    return await this.sharepointRepository.searchDocuments(query, entityType, entityId)
  }
}
