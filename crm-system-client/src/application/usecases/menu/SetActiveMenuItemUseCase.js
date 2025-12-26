// src/application/usecases/SetActiveMenuItemUseCase.js
export default class SetActiveMenuItemUseCase {
  constructor(menuRepo) {
    this.menuRepo = menuRepo;
  }

  execute(openedItem) {
    return this.menuRepo.setActiveItem(openedItem);
  }
}
