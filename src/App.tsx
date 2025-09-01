// Copyright Mark Skiba, 2025 All rights reserved

import React from 'react';
import { Route, Redirect, useParams } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import Home from './pages/Home';
import BidSubmissionPage from './pages/BidSubmissionPage';
import RjsfTestPage from './pages/RjsfTestPage';
import DebugPage from './pages/DebugPage';
import MCPTestComponent from './components/MCPTestComponent';
import AgentManagementTest from './components/AgentManagementTest';
import AgentAvatarDemo from './pages/AgentAvatarDemo';
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

// Component to handle RFP bid URL redirect
const RfpBidRedirect: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return <Redirect to={`/bid/submit?rfp_id=${id}`} />;
};

const App: React.FC = () => (
  <SupabaseProvider>
    <IonApp>
      <IonReactRouter>
        <IonRouterOutlet>
          <Route exact path="/home" component={Home} />
          <Route exact path="/bid/submit" component={BidSubmissionPage} />
          <Route exact path="/rfp/:id/bid" component={RfpBidRedirect} />
          <Route exact path="/test/rjsf" component={RjsfTestPage} />
          <Route exact path="/debug" component={DebugPage} />
          <Route exact path="/debug/avatars" component={AgentAvatarDemo} />
          <Route exact path="/test/agent-management" component={AgentManagementTest} />
          <Route exact path="/mcp-test" component={MCPTestComponent} />
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
