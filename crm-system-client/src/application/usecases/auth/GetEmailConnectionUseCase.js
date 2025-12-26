export class GetEmailConnectionUseCase {
  constructor(emailAuthRepository) {
    this.emailAuthRepository = emailAuthRepository;
  }

  async execute() {
    try {
      const connectionInfo = this.emailAuthRepository.getConnectionInfo();
      const isConnected = this.emailAuthRepository.isConnected();

      return {
        success: true,
        data: {
          connectionInfo,
          isConnected
        },
        message: isConnected ? 'Email is connected' : 'Email is not connected'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to get email connection status'
      };
    }
  }
}
