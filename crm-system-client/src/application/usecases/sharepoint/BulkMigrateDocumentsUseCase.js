export class BulkMigrateDocumentsUseCase {
  constructor(sharepointRepository) {
    this.sharepointRepository = sharepointRepository
  }
  async execute(migrationRequest) {
    return await this.sharepointRepository.bulkMigrate(migrationRequest)
  }
}
