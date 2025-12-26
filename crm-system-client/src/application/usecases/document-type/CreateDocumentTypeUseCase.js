export class CreateDocumentTypeUseCase {
  constructor(documentTypeRepository) {
    this.documentTypeRepository = documentTypeRepository
  }
  async execute(payload) {
    return await this.documentTypeRepository.create(payload)
  }
}
