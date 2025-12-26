import { IAuthRepository } from "@domain/interfaces/IAuthRepository";
import config from '@src/config';

export class AzureAuthRepository extends IAuthRepository {
  constructor(localRepo) {
    super();
    this.localRepo = localRepo;
  }

  async login() {
    const authorizeUrl = `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/authorize
      ?client_id=${config.clientId}
      &response_type=code
      &redirect_uri=${encodeURIComponent(
        config.API_AUTH + "/signin-oidc"
      )}
      &response_mode=query
      &scope=openid%20profile%20email
      &state=54321`.replace(/\s+/g, "");

    window.open(authorizeUrl, "azure-login", "width=600,height=600");
  }

  async handleMessage(event) {
    if (event.data?.access_token) {
      const { access_token, expires_in } = event.data;
      await this.localRepo.saveToken(access_token, expires_in);
      return access_token;
    }
    return null;
  }
}
