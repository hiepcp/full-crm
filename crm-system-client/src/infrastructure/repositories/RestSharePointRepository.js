import sharepointApi from '@infrastructure/api/sharepointApi'

export class RestSharePointRepository {
  async upload(formData) {
    const res = await sharepointApi.upload(formData)
    return res.data
  }

  async getDocumentsByEntity(entityType, entityId) {
    const res = await sharepointApi.getDocumentsByEntity(entityType, entityId)
    return res.data
  }

  async searchDocuments(query, entityType = null, entityId = null) {
    const res = await sharepointApi.searchDocuments(query, entityType, entityId)
    return res.data
  }

  async syncPermissions(entityType, entityId, userRoles) {
    const res = await sharepointApi.syncPermissions(entityType, entityId, userRoles)
    return res.data
  }

  async getPermissions(entityType, entityId) {
    const res = await sharepointApi.getPermissions(entityType, entityId)
    return res.data
  }

  async revokePermission(entityType, entityId, principalId) {
    const res = await sharepointApi.revokePermission(entityType, entityId, principalId)
    return res.data
  }

  async getVersionHistory(fileId) {
    const res = await sharepointApi.getVersionHistory(fileId)
    return res.data
  }

  async bulkMigrate(migrationRequest) {
    const res = await sharepointApi.bulkMigrate(migrationRequest)
    return res.data
  }
}
