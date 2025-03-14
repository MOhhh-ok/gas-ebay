type Scope = 'https://api.ebay.com/oauth/api_scope';
type Env = 'production' | 'sandbox';

export interface AuthSettings {
  clientId: string,
  clientSecret: string,
  ruName: string,
  scopes: Scope[],
  callbackName: string,
  env: Env
}

export let authSettings: AuthSettings | undefined;

export function setEbayAuthSettings(settings: AuthSettings) {
  authSettings = settings;
}

export function getEbayAuthSettings(): AuthSettings {
  if (!authSettings) throw new Error('Ebay auth settings are not set');
  return { ...authSettings };
}