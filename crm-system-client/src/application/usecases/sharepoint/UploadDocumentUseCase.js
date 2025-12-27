export class UploadDocumentUseCase {
  constructor(sharepointRepository) {
    this.sharepointRepository = sharepointRepository
  }
  async execute(formData) {
    return await this.sharepointRepository.upload(formData)
  }
}
