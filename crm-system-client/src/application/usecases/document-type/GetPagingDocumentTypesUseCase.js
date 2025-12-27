export class GetPagingDocumentTypesUseCase {
  constructor(documentTypeRepository) {
    this.documentTypeRepository = documentTypeRepository
  }
  async execute(_page, _pageSize, _sortColumn, _sortOrder, _payload) {
    return await this.documentTypeRepository.getAllPaging(_page, _pageSize, _sortColumn, _sortOrder, _payload)
  }
}
