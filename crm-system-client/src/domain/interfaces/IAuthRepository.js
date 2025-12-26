export class IAuthRepository {
  async login() {
    throw new Error("Not implemented");
  }

  async saveToken(_token, _expiresIn) {
    throw new Error("Not implemented");
  }

  async getToken() {
    throw new Error("Not implemented");
  }
}