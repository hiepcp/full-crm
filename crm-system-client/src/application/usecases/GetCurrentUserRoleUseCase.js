export default class GetCurrentUserRoleUseCase {
  constructor(roleProfileRepo) {
    this.roleProfileRepo = roleProfileRepo;
  }

  async execute() {
    return await this.roleProfileRepo.getCurrentUser();
  }
}
