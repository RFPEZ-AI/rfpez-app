// Copyright Mark Skiba, 2025 All rights reserved

import React, { useEffect, useState } from 'react';
import { Route, Redirect, useParams, Switch } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import Home from './pages/Home';
import BidSubmissionPage from './pages/BidSubmissionPage';
import RjsfTestPage from './pages/RjsfTestPage';
import DebugPage from './pages/DebugPage';
import GmailOAuth from './pages/GmailOAuth';
import MCPTestComponent from './components/MCPTestComponent';
import AgentManagementTest from './components/AgentManagementTest';
import AgentAvatarDemo from './pages/AgentAvatarDemo';
import { SupabaseProvider, useSupabase } from './context/SupabaseContext';
import OfflineNotification from './components/OfflineNotification';
import PWAUpdatePrompt from './components/PWAUpdatePrompt';
import AuthDebugPanel from './components/AuthDebugPanel';
import LoadingScreen from './components/LoadingScreen';

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

// Wrapper component to show loading screen while auth initializes
const AppContent: React.FC = () => {
  const { loading } = useSupabase();
  const [showAuthDebug, setShowAuthDebug] = useState(false);
  const [minimumLoadTimeElapsed, setMinimumLoadTimeElapsed] = useState(false);
  const [hasShownLoading, setHasShownLoading] = useState(false);

  // Remove the initial HTML loading screen once React takes over
  useEffect(() => {
    console.log('⚛️ React App mounting - removing initial loading screen');
    const initialScreen = document.getElementById('initial-loading-screen');
    if (initialScreen) {
      // Fade out the initial loading screen
      initialScreen.classList.add('fade-out');
      setTimeout(() => {
        initialScreen.remove();
        console.log('✅ Initial loading screen removed');
      }, 300); // Match CSS transition duration
    }
  }, []);

  // Ensure loading screen shows for at least 500ms for better UX
  useEffect(() => {
    if (loading && !hasShownLoading) {
      console.log('🔄 Auth loading started - showing loading screen');
      setHasShownLoading(true);
      setMinimumLoadTimeElapsed(false);
      
      const timer = setTimeout(() => {
        console.log('⏰ Minimum load time elapsed');
        setMinimumLoadTimeElapsed(true);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [loading, hasShownLoading]);

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
  
  // Show loading screen while authentication is initializing OR minimum time hasn't elapsed
  const shouldShowLoading = loading || (hasShownLoading && !minimumLoadTimeElapsed);
  
  if (shouldShowLoading) {
    console.log('📺 Displaying loading screen', { loading, minimumLoadTimeElapsed, hasShownLoading });
    return <LoadingScreen message="Initializing..." />;
  }
  
  console.log('✅ Loading complete - showing app content');
  
  return (
    <>
      <IonRouterOutlet>
        <Switch>
          {/* Root path redirect - must be first */}
          <Route exact path="/" render={() => <Redirect to="/home" />} />
          
          {/* Specific routes - must come before specialty catch-all */}
          <Route exact path="/home" component={Home} />
          <Route exact path="/debug" component={DebugPage} />
          <Route exact path="/debug/avatars" component={AgentAvatarDemo} />
          <Route exact path="/mcp-test" component={MCPTestComponent} />
          <Route exact path="/callback" component={Home} />
          
          {/* Test routes */}
          <Route exact path="/test/rjsf" component={RjsfTestPage} />
          <Route exact path="/test/gmail-oauth" component={GmailOAuth} />
          <Route exact path="/test/agent-management" component={AgentManagementTest} />
          
          {/* Bid submission routes */}
          <Route path="/bid/submit" component={BidSubmissionPage} />
          <Route exact path="/rfp/:id/bid" component={RfpBidRedirect} />
          
          {/* Specialty site routes - MUST come last as catch-all */}
          {/* This will match any single-segment path not matched above */}
          <Route 
            exact 
            path="/:specialty" 
            component={Home}
          />
        </Switch>
      </IonRouterOutlet>
      <OfflineNotification />
      <PWAUpdatePrompt />
      <AuthDebugPanel 
        isOpen={showAuthDebug} 
        onClose={() => setShowAuthDebug(false)} 
      />
    </>
  );
};

const App: React.FC = () => {

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
          <AppContent />
        </IonReactRouter>
      </IonApp>
    </SupabaseProvider>
  );
};

export default App;
