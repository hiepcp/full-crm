export class DeleteMultiDocumentTypeUseCase {
  constructor(documentTypeRepository) {
    this.documentTypeRepository = documentTypeRepository
  }
  async execute(ids) {
    return await this.documentTypeRepository.deleteMulti(ids)
  }
}
