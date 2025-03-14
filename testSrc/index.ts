import { createSearchUrl, search } from "../src/apis/search.js";
import { getEbayAuthService } from "../src/authService.js";
import { setEbayAuthSettings } from "../src/authSettings.js";

declare const global: any;

global.test = () => {
  initAuthSettings();
  const url = createSearchUrl({ q: 'iphone', limit: 200, offset: 200 * 49 });
  const result = search(url);
  console.log(result);
  return;
  const service = getEbayAuthService();
  if (!service.hasAccess()) {
    const url = service.getAuthorizationUrl();
    console.log('Please authorize the app by clicking the following URL:');
    console.log(url);
  } else {
    const token = service.getAccessToken();
    console.log('Access token:');
    console.log(token);
  }
}

global.reset = () => {
  initAuthSettings();
  getEbayAuthService().reset();
  console.log('Auth settings reset');
}

global.ebayAuthCallback = (request: any) => {
  initAuthSettings();
  const service = getEbayAuthService();
  service.handleCallback(request);
  if (service.hasAccess()) {
    return HtmlService.createHtmlOutput('Successfully authorized');
  } else {
    return HtmlService.createHtmlOutput('Failed to get access token');
  }
}


function initAuthSettings() {
  const prp = PropertiesService.getScriptProperties();
  setEbayAuthSettings({
    clientId: prp.getProperty('CLIENT_ID') || '',
    clientSecret: prp.getProperty('CLIENT_SECRET') || '',
    ruName: prp.getProperty('RU_NAME') || '',
    scopes: ['https://api.ebay.com/oauth/api_scope'],
    callbackName: 'ebayAuthCallback',
    env: 'production',
  });
}