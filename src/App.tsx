import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
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

const App: React.FC = () => (
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
);

export default App;
