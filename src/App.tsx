import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Auth0Provider } from '@auth0/auth0-react';
import Home from './pages/Home';
import { SupabaseProvider } from './context/SupabaseContext';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import OfflineNotification from './components/OfflineNotification';
import PWAUpdatePrompt from './components/PWAUpdatePrompt';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

// import theme vars if you have them
// import './theme/variables.css';

setupIonicReact();

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

const App: React.FC = () => (
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
    <SupabaseProvider>
      <IonApp>
        <IonReactRouter>
          <IonRouterOutlet>
            <Route exact path="/home" component={Home} />
            <Route exact path="/callback" component={Home} />
            <Route exact path="/" render={() => <Redirect to="/home" />} />
          </IonRouterOutlet>
        </IonReactRouter>
        <PWAInstallPrompt />
        <OfflineNotification />
        <PWAUpdatePrompt />
      </IonApp>
    </SupabaseProvider>
  </Auth0Provider>
);

export default App;
