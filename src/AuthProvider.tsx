import React from 'react';
import { createRoot } from 'react-dom/client';
import { Auth0Provider } from '@auth0/auth0-react';
import App from './App';

const domain = process.env.REACT_APP_AUTH0_DOMAIN || '';
const clientId = process.env.REACT_APP_AUTH0_CLIENT_ID || '';

if (!domain || !clientId) {
  console.warn('Missing Auth0 env vars: REACT_APP_AUTH0_DOMAIN and/or REACT_APP_AUTH0_CLIENT_ID');
}

const container = document.getElementById('root');
if (!container) throw new Error('Root element not found');

createRoot(container).render(
  <React.StrictMode>
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: window.location.origin
      }}
    >
      <App />
    </Auth0Provider>
  </React.StrictMode>
);
