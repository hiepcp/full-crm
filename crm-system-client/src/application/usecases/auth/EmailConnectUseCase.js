export class EmailConnectUseCase {
  constructor(emailAuthRepository) {
    this.emailAuthRepository = emailAuthRepository;
  }

  async execute() {
    try {
      const connectionInfo = await this.emailAuthRepository.login();
      return {
        success: true,
        data: connectionInfo,
        message: `Successfully connected to ${connectionInfo.email}`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to connect email account'
      };
    }
  }
}
