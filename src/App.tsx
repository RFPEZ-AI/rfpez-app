// Copyright Mark Skiba, 2025 All rights reserved

import React, { useEffect, useState } from 'react';
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
import OfflineNotification from './components/OfflineNotification';
import PWAUpdatePrompt from './components/PWAUpdatePrompt';
import AuthDebugPanel from './components/AuthDebugPanel';

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

const App: React.FC = () => {
  const [showAuthDebug, setShowAuthDebug] = useState(false);

  useEffect(() => {
    // Add global keyboard shortcut for auth debug panel (Ctrl+Shift+D)
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'D') {
        event.preventDefault();
        setShowAuthDebug(true);
        console.log('🔧 Auth debug panel opened');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fix ARIA accessibility issue - prevent aria-hidden on focused elements
  useEffect(() => {
    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      if (target && (target.matches('button, input, textarea, select') || target.classList.contains('button-native'))) {
        // Find any ancestor with aria-hidden="true"
        let ancestor = target.parentElement;
        while (ancestor) {
          if (ancestor.getAttribute('aria-hidden') === 'true') {
            console.log('🔧 Removing aria-hidden from ancestor due to focused element:', target);
            ancestor.removeAttribute('aria-hidden');
            break;
          }
          ancestor = ancestor.parentElement;
        }
      }
    };

    // Listen for focus events on the document
    document.addEventListener('focusin', handleFocusIn);
    return () => document.removeEventListener('focusin', handleFocusIn);
  }, []);

  return (
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
      <OfflineNotification />
      <PWAUpdatePrompt />
      <AuthDebugPanel 
        isOpen={showAuthDebug} 
        onClose={() => setShowAuthDebug(false)} 
      />
    </IonApp>
  </SupabaseProvider>
  );
};

export default App;
