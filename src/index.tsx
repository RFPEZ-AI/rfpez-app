import React from 'react';
import { createRoot } from 'react-dom/client';
import { Auth0Provider } from '@auth0/auth0-react';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import reportWebVitals from './reportWebVitals';

import { devLog } from './utils/devLog';

const domain = process.env.REACT_APP_AUTH0_DOMAIN || '';
const clientId = process.env.REACT_APP_AUTH0_CLIENT_ID || '';

// Debug environment variables
devLog.log('Auth0 Config:', {
  domain: domain || 'MISSING',
  clientId: clientId || 'MISSING',
  redirectUri: window.location.origin,
  allEnvVars: Object.keys(process.env).filter(key => key.startsWith('REACT_APP_'))
});

if (!domain || !clientId) {
  devLog.error('Missing Auth0 env vars. Please check your .env.local file');
  devLog.error('Available env vars:', Object.keys(process.env).filter(key => key.startsWith('REACT_APP_')));
}

const container = document.getElementById('root');
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: `${window.location.origin}/callback`
      }}
      onRedirectCallback={(appState) => {
        console.log('Auth0 redirect callback:', appState);
      }}
    >
      <App />
    </Auth0Provider>
  </React.StrictMode>
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
serviceWorkerRegistration.unregister();

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
