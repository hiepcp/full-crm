export class DeleteDocumentTypeUseCase {
  constructor(documentTypeRepository) {
    this.documentTypeRepository = documentTypeRepository
  }
  async execute(id) {
    return await this.documentTypeRepository.delete(id)
  }
}
