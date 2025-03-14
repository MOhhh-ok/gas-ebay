import { AuthSettings, getEbayAuthSettings } from "./authSettings.js";

const urls: Record<AuthSettings['env'], { auth: string, token: string }> = {
  'sandbox': { auth: 'https://signin.sandbox.ebay.com/authorize', token: 'https://api.sandbox.ebay.com/identity/v1/oauth2/token' },
  'production': { auth: 'https://auth.ebay.com/oauth2/authorize', token: 'https://api.ebay.com/identity/v1/oauth2/token' }
} as const;

export function getEbayAuthService() {
  const settings = getEbayAuthSettings();
  const { clientId, clientSecret, ruName, callbackName, env, scopes } = settings;

  return OAuth2.createService('eBay')
    .setAuthorizationBaseUrl(urls[env].auth)
    .setTokenUrl(urls[env].token)
    .setClientId(clientId)
    .setClientSecret(clientSecret)
    .setCallbackFunction(callbackName)
    .setPropertyStore(PropertiesService.getUserProperties())
    .setRedirectUri(ruName)
    .setScope(scopes?.join(' '))
    .setTokenHeaders({
      Authorization: 'Basic ' +
        Utilities.base64Encode(clientId + ':' + clientSecret)
    });
}

