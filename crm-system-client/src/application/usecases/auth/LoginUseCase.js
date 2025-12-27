export class LoginUseCase {
  constructor(authRepository) {
    this.authRepository = authRepository;
  }

  async execute() {
    return await this.authRepository.login();
  }
}
