 

export class Get365PagingUseCase {
  constructor(repository) {
    this.repository = repository
  }
  async execute(_refType, _page, _pageSize, _sortColumn, _sortOrder, _payload) {
    return await this.repository.get365Paging(_refType, _page, _pageSize, _sortColumn, _sortOrder, _payload)
  }
}

export class GetAllCRMsUseCase {
  constructor(repository) {
    this.repository = repository
  }
  async execute(_payload) {
    return await this.repository.getAllCRMs(_payload)
  }
}

export class GetAllCRMHcmWorkersUseCase {
  constructor(repository) {
    this.repository = repository
  }
  async execute(page, pageSize, sortColumn, sortOrder, filters = []) {
    // HCM Workers refType - giả định là 7 (có thể cần điều chỉnh)
    const refType = 7

    // Chuẩn bị payload với filters
    const payload = filters || []

    return await this.repository.get365Paging(refType, page, pageSize, sortColumn, sortOrder, payload)
  }
}

export class GetAllCRMCustomerUseCase {
  constructor(repository) {
    this.repository = repository
  }
  async execute(page, pageSize, sortColumn, sortOrder, filters = []) {
    const refType = 2

    const payload = filters || []

    return await this.repository.get365Paging(refType, page, pageSize, sortColumn, sortOrder, payload)
  }
}

/**
 * Use case for fetching RSVNCustTableEntities (Dynamics 365 Customers)
 * RefType = 2
 */
export class GetAllCRMCustTableEntitiesUseCase {
  constructor(repository) {
    this.repository = repository
  }

  /**
   * Execute query for Dynamics 365 Customer Table Entities
   * @param {number} page - Page number (1-indexed)
   * @param {number} pageSize - Items per page
   * @param {string} sortColumn - Column to sort by (AccountNum, Name, etc.)
   * @param {string} sortOrder - Sort order ('asc' or 'desc')
   * @param {Array} filters - Filter array [{Logic, Column, Operator, Value}]
   * @returns {Promise} Response with items and totalCount
   */
  async execute(page, pageSize, sortColumn, sortOrder, filters = []) {
    // RSVNCustTableEntities refType
    const refType = 2

    // Prepare filters payload
    const payload = filters || []

    return await this.repository.get365Paging(refType, page, pageSize, sortColumn, sortOrder, payload)
  }
}

/**
 * Use case for fetching a single RSVNCustTableEntity by AccountNum
 * RefType = 2
 */
export class GetCRMCustTableEntityByAccountNumUseCase {
  constructor(repository) {
    this.repository = repository
  }

  /**
   * Get a single customer entity by AccountNum
   * @param {string} accountNum - Customer Account Number
   * @returns {Promise<object|null>} Customer entity or null if not found
   */
  async execute(accountNum) {
    if (!accountNum) {
      throw new Error('AccountNum is required')
    }

    const refType = 2
    const page = 1
    const pageSize = 1
    const sortColumn = 'AccountNum'
    const sortOrder = 'asc'
    
    // Filter by AccountNum
    const filters = [
      {
        Logic: 'And',
        Column: 'AccountNum',
        Operator: 'eq',
        Value: accountNum
      }
    ]

    const response = await this.repository.get365Paging(
      refType, 
      page, 
      pageSize, 
      sortColumn, 
      sortOrder, 
      filters
    )

    // Return the first item or null if not found
    return response?.items?.[0] || null
  }
}