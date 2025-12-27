import { IAuthRepository } from "@domain/interfaces/IAuthRepository";

export class LocalAuthRepository extends IAuthRepository {
  async saveToken(token, expiresIn) {
    localStorage.setItem("accessToken", token);
    localStorage.setItem("expiresIn", expiresIn);
  }

  async getToken() {
    return localStorage.getItem("accessToken");
  }

  // Email-specific token methods
  async saveEmailToken(accessTokenEmail, expiresInEmail) {
    localStorage.setItem("accessTokenEmail", accessTokenEmail);
    localStorage.setItem("expiresInEmail", expiresInEmail);
  }

  async getEmailToken() {
    return localStorage.getItem("accessTokenEmail");
  }

  async clearEmailToken() {
    localStorage.removeItem("accessTokenEmail");
    localStorage.removeItem("expiresInEmail");
  }

  async clearToken() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("expiresIn");
  }
}
