import React from 'react';
import { createRoot } from 'react-dom/client';
import { Auth0Provider } from '@auth0/auth0-react';
import App from './App';

const domain = process.env.REACT_APP_AUTH0_DOMAIN || '';
const clientId = process.env.REACT_APP_AUTH0_CLIENT_ID || '';
const audience = process.env.REACT_APP_AUTH0_AUDIENCE || '';

// Determine redirect URI based on environment
const getRedirectUri = () => {
  // For local development, use localhost
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return window.location.origin;
  }
  // For production, use the current origin
  return window.location.origin;
};

const redirectUri = getRedirectUri();

// Enhanced debugging
console.log('Auth0 Configuration Debug:', {
  domain: domain,
  clientId: clientId,
  audience: audience,
  redirectUri: redirectUri,
  currentUrl: window.location.href,
  protocol: window.location.protocol,
  hostname: window.location.hostname,
  port: window.location.port,
  origin: window.location.origin
});

if (!domain || !clientId) {
  console.error('Missing Auth0 env vars: REACT_APP_AUTH0_DOMAIN and/or REACT_APP_AUTH0_CLIENT_ID');
}

const container = document.getElementById('root');
if (!container) throw new Error('Root element not found');

createRoot(container).render(
  <React.StrictMode>
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: redirectUri,
        audience: audience,
        scope: "openid profile email"
      }}
      useRefreshTokens={true}
      cacheLocation="localstorage"
      onRedirectCallback={(appState) => {
        console.log('Auth0 redirect callback:', appState);
        console.log('Callback redirect URI:', redirectUri);
        // Navigate to the intended page or home page
        window.history.replaceState({}, document.title, appState?.returnTo || '/');
      }}
    >
      <App />
    </Auth0Provider>
  </React.StrictMode>
);
