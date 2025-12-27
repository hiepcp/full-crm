import { IDocumentTypeRepository } from '@domain/interfaces/IDocumentTypeRepository'
import documentTypeApi from '@infrastructure/api/documentTypeApi'
import { DocumentType } from '@domain/entities/DocumentType'

export class RestDocumentTypeRepository extends IDocumentTypeRepository {
  async getAll() {
    const res = await documentTypeApi.getAll()
    return res.data.map(p => new DocumentType(p))
  }
  async getAllPaging(_page, _pageSize, _sortColumn, _sortOrder, _payload) {
    const res = await documentTypeApi.getAllPaging(_page, _pageSize, _sortColumn, _sortOrder, _payload)
    return res.data
  }
  async getById(id) {
    const res = await documentTypeApi.getById(id)
    return new DocumentType(res.data)
  }
  async create(payload) {
    const res = await documentTypeApi.create(payload)
    return res.data
  }
  async update(payload) {
    const res = await documentTypeApi.update(payload.id, payload)
    return res.data
  }
  async delete(id) {
    const res = await documentTypeApi.delete(id)
    return res.data
  }
  async deleteMulti(ids) {
    const res = await documentTypeApi.deleteMulti(ids)
    return res.data
  }
}
