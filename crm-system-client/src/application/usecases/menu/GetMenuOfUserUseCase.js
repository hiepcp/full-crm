export default class GetMenuOfUserUseCase {
  constructor(menuRepository) {
    this.menuRepository = menuRepository
  }
  async execute(_appCode, _email) {
    return await this.menuRepository.getMenuOfUser(_appCode, _email)
  }
}
