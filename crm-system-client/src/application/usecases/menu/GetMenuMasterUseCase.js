export default class GetMenuMasterUseCase {
  constructor(menuRepo) {
    this.menuRepo = menuRepo;
  }

  execute() {
    return this.menuRepo.getMenuMaster();
  }
}
