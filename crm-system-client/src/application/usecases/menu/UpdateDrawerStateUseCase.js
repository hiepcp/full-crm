export default class UpdateDrawerStateUseCase {
  constructor(menuRepo) {
    this.menuRepo = menuRepo;
  }

  execute(isOpen) {
    return this.menuRepo.updateDrawerState(isOpen);
  }
}
