export class GetDocumentTypesUseCase {
  constructor(documentTypeRepository) {
    this.documentTypeRepository = documentTypeRepository
  }
  async execute() {
    return await this.documentTypeRepository.getAll()
  }
}
