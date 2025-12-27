export class IDocumentTypeRepository {
  async getAll() { throw new Error('Not implemented') }
  async getAllPaging(_page, _pageSize, _sortColumn, _sortOrder, _payload) { throw new Error('Not implemented') }
  async getById(_id) { throw new Error('Not implemented') }
  async create(_payload) { throw new Error('Not implemented') }
  async update(_payload) { throw new Error('Not implemented') }
  async delete(_id) { throw new Error('Not implemented') }
  async deleteMulti(_ids) { throw new Error('Not implemented') }
}