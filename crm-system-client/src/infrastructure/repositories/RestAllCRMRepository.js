import allCRMApi from '@infrastructure/api/allCRMApi'

export class RestAllCRMRepository {
  async get365Paging(refType, page, pageSize, sortColumn, sortOrder, payload) {
    const res = await allCRMApi.get365Paging(refType, page, pageSize, sortColumn, sortOrder, payload)
    return res.data
  }

  async getByModalName(modalName, page, pageSize, sortColumn, sortOrder, payload) {
    const res = await allCRMApi.getByModalName(modalName, page, pageSize, sortColumn, sortOrder, payload)
    return res.data
  }

  async getAllCRMs(payload) {
    const res = await allCRMApi.getAllCRMs(payload)
    return res.data
  }
}
