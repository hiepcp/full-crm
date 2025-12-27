export class GetVersionHistoryUseCase {
  constructor(sharepointRepository) {
    this.sharepointRepository = sharepointRepository
  }
  async execute(fileId) {
    return await this.sharepointRepository.getVersionHistory(fileId)
  }
}
