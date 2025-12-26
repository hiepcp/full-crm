export class DisconnectEmailUseCase {
  constructor(emailAuthRepository) {
    this.emailAuthRepository = emailAuthRepository;
  }

  async execute() {
    try {
      await this.emailAuthRepository.disconnect();
      return {
        success: true,
        message: 'Email account disconnected successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to disconnect email account'
      };
    }
  }
}
