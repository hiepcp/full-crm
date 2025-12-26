export class UpdateDocumentTypeUseCase {
  constructor(documentTypeRepository) {
    this.documentTypeRepository = documentTypeRepository
  }
  async execute(payload) {
    return await this.documentTypeRepository.update(payload)
  }
}