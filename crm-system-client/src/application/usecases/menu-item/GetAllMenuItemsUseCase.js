// src/application/usecases/menuItem/GetAllMenuItemsUseCase.js
export default class GetAllMenuItemsUseCase {
  constructor(menuItemRepo) {
    this.menuItemRepo = menuItemRepo;
  }

  async execute() {
    return await this.menuItemRepo.getAll();
  }
}
