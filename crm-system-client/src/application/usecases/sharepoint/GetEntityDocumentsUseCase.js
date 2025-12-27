export class GetEntityDocumentsUseCase {
  constructor(sharepointRepository) {
    this.sharepointRepository = sharepointRepository
  }
  async execute(entityType, entityId) {
    return await this.sharepointRepository.getDocumentsByEntity(entityType, entityId)
  }
}
