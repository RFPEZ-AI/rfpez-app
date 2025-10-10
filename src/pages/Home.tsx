// Copyright Mark Skiba, 2025 All rights reserved

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useSupabase } from '../context/SupabaseContext';
import DatabaseService from '../services/database';
import { ArtifactService } from '../services/artifactService';
import { Message, ArtifactReference, Artifact } from '../types/home';
import { SessionActiveAgent } from '../types/database';
import { DocxExporter } from '../utils/docxExporter';
import type { FormSpec, RFP } from '../types/rfp';

// Import all our custom hooks
import { useHomeState } from '../hooks/useHomeState';
import { useSessionState } from '../hooks/useSessionState';
import { useAgentManagement } from '../hooks/useAgentManagement';
import { useRFPManagement } from '../hooks/useRFPManagement';
import { useArtifactManagement } from '../hooks/useArtifactManagement';
import { useMessageHandling } from '../hooks/useMessageHandling';
import { useArtifactWindowState } from '../hooks/useArtifactWindowState';
import { useGlobalRFPContext } from '../hooks/useGlobalRFPContext';

// Import clickable element decorator for development testing
import '../utils/clickableElementDecorator';
import '../utils/testIdManager';
import ClickableDebugToggle from '../components/ClickableDebugToggle';

// Import debug utilities in development
import '../utils/rfpDesignerDebugger';
import '../utils/claudeMessageDiagnosis';

// Import test functions for debugging
import '../test-claude-functions';

// Import custom hooks
import { useDebugMonitoring } from '../hooks/useDebugMonitoring';
import { useSessionInitialization } from '../hooks/useSessionInitialization';
// import { useHomeHandlers } from '../hooks/useHomeHandlers'; // Unused - commented out to fix lint warning

// Import layout components
import HomeHeader from '../components/HomeHeader';
import HomeContent from '../components/HomeContent';
import HomeFooter from '../components/HomeFooter';

// Import modal components
import AgentEditModal from '../components/AgentEditModal';
import RFPEditModal from '../components/RFPEditModal';
import RFPPreviewModal from '../components/RFPPreviewModal';
import AgentSelector from '../components/AgentSelector';

const Home: React.FC = () => {
  const { user, session, loading: supabaseLoading, userProfile } = useSupabase();
  const history = useHistory();
  
  // Setup debug monitoring
  useDebugMonitoring();
  
  // Derived authentication state
  const isAuthenticated = !!session;
  const userId = user?.id;
  
  // Use our custom hooks
  const {
    isLoading,
    setIsLoading,
    selectedSessionId,
    setSelectedSessionId,
    currentSessionId,
    setCurrentSessionId,
    needsSessionRestore,
    setNeedsSessionRestore
  } = useHomeState(user?.id, !!session);

  // Global RFP context that persists across sessions
  const {
    currentRfpId: globalCurrentRfpId,
    currentRfp: globalCurrentRfp,
    setGlobalRFPContext,
    clearGlobalRFPContext,
    getGlobalRFPContext
  } = useGlobalRFPContext();

  // CRITICAL FIX: Use ref to keep session ID synchronized and avoid stale closures
  const currentSessionIdRef = useRef<string | undefined>(currentSessionId);
  
  // Track if initial agent message has been loaded to prevent infinite loops
  const initialAgentLoadedRef = useRef<boolean>(false);
  
  // Keep ref synchronized with state
  useEffect(() => {
    currentSessionIdRef.current = currentSessionId;
    console.log('📌 Session ID ref updated:', currentSessionId);
  }, [currentSessionId]);

  const {
    sessions,
    messages,
    setMessages,
    loadUserSessions,
    loadSessionMessages,
    createNewSession,
    deleteSession,
    clearUIState
  } = useSessionState(userId, isAuthenticated);

  const {
    currentAgent,
    showAgentSelector,
    setShowAgentSelector,
    agents,
    showAgentModal,
    editingAgent,
    showAgentsMenu,
    setShowAgentsMenu,
    loadDefaultAgentWithPrompt,
    loadSessionAgent,
    handleAgentChanged,
    handleNewAgent,
    handleEditAgent,
    handleDeleteAgent,
    handleSaveAgent,
    handleCancelAgent,
    handleShowAgentSelector
  } = useAgentManagement(currentSessionId);

  const {
    rfps,
    showRFPMenu,
    setShowRFPMenu,
    showRFPModal,
    showRFPPreviewModal,
    editingRFP,
    previewingRFP,
    currentRfpId,
    currentRfp,
    handleNewRFP,
    handleEditRFP,
    handlePreviewRFP,
    handleShareRFP,
    handleDeleteRFP,
    handleSaveRFP,
    handleCancelRFP,
    handleClosePreview,
    handleSetCurrentRfp,
    handleClearCurrentRfp
  } = useRFPManagement(
    currentSessionId,
    globalCurrentRfpId ?? null,
    globalCurrentRfp ?? null,
    setGlobalRFPContext,
    clearGlobalRFPContext
  );

  const {
    artifacts,
    selectedArtifact,
    selectArtifact,
    setSelectedArtifactFromState,
    setArtifacts,
    loadSessionArtifacts,
    handleAttachFile,
    addClaudeArtifacts,
    clearArtifacts
  } = useArtifactManagement(
    currentRfp ?? null, 
    currentSessionId, 
    isAuthenticated, 
    user, 
    messages, 
    setMessages,
    // Add callback to trigger artifact window auto-open
    (artifactId: string) => {
      artifactWindowState.autoOpenForArtifact(artifactId);
      // Force session history to collapse on mobile if needed
      if (window.innerWidth <= 768) {
        setForceSessionHistoryCollapsed(true);
      }
    },
    // Add callback to save artifact selections
    (sessionId: string, artifactId: string | null) => {
      artifactWindowState.saveSessionArtifact(sessionId, artifactId);
      // Also update the artifact window state
      artifactWindowState.selectArtifact(artifactId);
    },
    // Pass RFP management functions for auto-creating placeholder RFPs
    currentRfpId,
    handleSetCurrentRfp
  );

  // Artifact window state management
  const artifactWindowState = useArtifactWindowState();
  const [forceSessionHistoryCollapsed, setForceSessionHistoryCollapsed] = useState(false);
  const [isCreatingNewSession, setIsCreatingNewSession] = useState(false);
  const [forceScrollToBottom, setForceScrollToBottom] = useState(false);
  const [isSessionLoading, setIsSessionLoading] = useState(false);

  const { handleSendMessage, sendAutoPrompt, cancelRequest, toolInvocations, clearToolInvocations, loadToolInvocationsForSession } = useMessageHandling(setGlobalRFPContext);

  // Main menu handler
  const handleMainMenuSelect = (item: string) => {
    if (item === 'Agents') setShowAgentsMenu(true);
    if (item === 'RFP') setShowRFPMenu(true);
    if (item === 'Debug') history.push('/debug');
  };

  // Define handleSelectSession before useEffects that call it
  const handleSelectSession = useCallback(async (sessionId: string) => {
    console.log('Session selected:', sessionId);
    
    // Clear the new session creation flag since we're now selecting a session
    setIsCreatingNewSession(false);
    
    // Set session loading flag to trigger input focus
    setIsSessionLoading(true);
    
    // On mobile, collapse the session history to give more space for messages
    const windowWidth = window.innerWidth;
    const isMobileViewport = windowWidth <= 768;
    console.log('📱 Mobile detection check:', { isMobileViewport, windowWidth });
    
    if (isMobileViewport) {
      console.log('📱 Mobile viewport detected: collapsing session history');
      setForceSessionHistoryCollapsed(true);
    }
    
    setSelectedSessionId(sessionId);
    setCurrentSessionId(sessionId);
    // CRITICAL: Update ref immediately for synchronous access
    currentSessionIdRef.current = sessionId;
    console.log('📌 Session ID ref updated via handleSelectSession:', sessionId);
    
    // Save as last session for persistence
    artifactWindowState.saveLastSession(sessionId);
    
    // Update user profile with current session ID for database persistence
    try {
      await DatabaseService.setUserCurrentSession(sessionId);
      console.log('✅ Current session saved to user profile:', sessionId);
    } catch (error) {
      console.warn('⚠️ Failed to save current session to user profile:', error);
    }

    // Load session with context (RFP and artifact context)
    try {
      console.log('🔍 LOADING SESSION CONTEXT for sessionId:', sessionId);
      const sessionWithContext = await DatabaseService.getSessionWithContext(sessionId);
      console.log('🔍 SESSION CONTEXT LOADED:', {
        hasSession: !!sessionWithContext,
        sessionId: sessionWithContext?.id,
        currentRfpId: sessionWithContext?.current_rfp_id,
        currentArtifactId: sessionWithContext?.current_artifact_id,
        fullContext: sessionWithContext
      });
      
      // Restore RFP context if it exists
      if (sessionWithContext?.current_rfp_id) {
        console.log('🎯 RESTORING RFP CONTEXT from session:', sessionWithContext.current_rfp_id);
        try {
          // FIXED: Set as global RFP context so UI components update properly
          await handleSetCurrentRfp(sessionWithContext.current_rfp_id, undefined, true);
          console.log('✅ RFP context restoration completed as GLOBAL context');
        } catch (rfpError) {
          console.error('❌ RFP context restoration FAILED:', rfpError);
        }
      } else {
        console.log('📝 NO RFP CONTEXT found in session - checking if any RFPs exist for fallback');
        // TODO: Add fallback to find the most recent RFP for this session
      }
      
      // Note: Artifact context will be restored below when loading session artifacts
      if (sessionWithContext?.current_artifact_id) {
        console.log('📄 Session has artifact context:', sessionWithContext.current_artifact_id);
      }
    } catch (error) {
      console.warn('⚠️ Failed to load session context:', error);
    }
    
    await loadSessionMessages(sessionId);
    await loadSessionAgent(sessionId);
    const sessionArtifacts = await loadSessionArtifacts(sessionId);
    
    // Trigger scroll to bottom after session is fully loaded
    setForceScrollToBottom(true);
    // Reset the flag after a short delay to allow for one-time scroll
    setTimeout(() => setForceScrollToBottom(false), 500);
    
    // Reset session loading flag and trigger input focus after session is loaded
    setTimeout(() => setIsSessionLoading(false), 200);
    
    // Load tool invocations for this session
    loadToolInvocationsForSession(sessionId);
    
    // Try to restore the session's current artifact first, then fall back to saved or most recent
    const sessionWithContext = await DatabaseService.getSessionWithContext(sessionId);
    let artifactToSelect = sessionWithContext?.current_artifact_id;
    
    if (!artifactToSelect || !sessionArtifacts?.some(a => a.id === artifactToSelect)) {
      // Fallback to saved artifact for this session
      const restoredArtifactId = artifactWindowState.restoreSessionArtifact(sessionId);
      if (restoredArtifactId && sessionArtifacts?.some(a => a.id === restoredArtifactId)) {
        artifactToSelect = restoredArtifactId;
        console.log('Restored saved artifact:', restoredArtifactId);
      } else if (sessionArtifacts && sessionArtifacts.length > 0) {
        // Otherwise, fall back to the most recent artifact
        const mostRecentArtifact = sessionArtifacts.reduce((latest, current) => {
          return parseInt(current.id) > parseInt(latest.id) ? current : latest;
        });
        artifactToSelect = mostRecentArtifact.id;
        console.log('Selected most recent artifact:', mostRecentArtifact.id);
      }
    }
    
    if (artifactToSelect) {
      setSelectedArtifactFromState(artifactToSelect);
      console.log('Selected artifact:', artifactToSelect);
    }
    
    // If we have artifacts, ensure the window is properly shown
    if (sessionArtifacts && sessionArtifacts.length > 0) {
      if (!artifactWindowState.isOpen) {
        artifactWindowState.openWindow();
      }
      if (artifactWindowState.isCollapsed) {
        artifactWindowState.expandWindow();
      }
    }
  }, [
    setSelectedSessionId,
    setCurrentSessionId,
    artifactWindowState,
    handleSetCurrentRfp,
    loadSessionMessages,
    loadSessionAgent,
    loadSessionArtifacts,
    setSelectedArtifactFromState
  ]);

  // Session initialization and lifecycle management (extracted to hook)
  useSessionInitialization({
    isAuthenticated,
    supabaseLoading,
    user,
    userProfile,
    session,
    currentSessionId,
    isCreatingNewSession,
    sessions,
    messages,
    currentRfpId,
    artifacts,
    needsSessionRestore,
    setMessages,
    setArtifacts,
    setIsCreatingNewSession,
    setNeedsSessionRestore,
    clearUIState,
    clearArtifacts,
    loadUserSessions,
    loadDefaultAgentWithPrompt,
    handleSelectSession,
    handleSetCurrentRfp,
    artifactWindowState
  });

  // Listen for RFP refresh messages from Claude functions and enhanced client updates
  useEffect(() => {
    const handleRfpRefreshMessage = async (event: MessageEvent) => {
      console.log('🐛 HOME MESSAGE DEBUG: Window message received:', {
        type: event.data?.type,
        target: event.data?.target,
        callbackType: event.data?.callbackType,
        origin: event.origin,
        timestamp: new Date().toISOString(),
        hasData: !!event.data,
        dataKeys: event.data ? Object.keys(event.data) : 'none',
        dataSize: event.data ? JSON.stringify(event.data).length : 0,
        fullData: event.data
      });
      
      // ENHANCED: Handle Edge Function callbacks
      if (event.data?.type === 'EDGE_FUNCTION_CALLBACK') {
        console.log('🎯 HOME MESSAGE DEBUG: Edge Function callback detected:', {
          callbackType: event.data.callbackType,
          target: event.data.target,
          hasPayload: !!event.data.payload,
          payloadKeys: event.data.payload ? Object.keys(event.data.payload) : 'none',
          debugInfo: event.data.debugInfo,
          timestamp: new Date().toISOString()
        });
        
        // Handle different callback targets
        switch (event.data.target) {
          case 'rfp_context':
            console.log('🎯 HOME MESSAGE DEBUG: RFP context callback processing:', {
              callbackType: event.data.callbackType,
              hasPayload: !!event.data.payload,
              rfpId: event.data.payload?.rfp_id,
              rfpName: event.data.payload?.rfp_name,
              message: event.data.payload?.message,
              payloadSize: event.data.payload ? JSON.stringify(event.data.payload).length : 0,
              fullPayload: event.data.payload
            });
            
            if (event.data.payload?.rfp_id) {
              try {
                const startTime = Date.now();
                
                // ENHANCED: Use rfp_data directly when available to avoid database re-query timing issues
                if (event.data.payload.rfp_data) {
                  console.log(`� HOME MESSAGE DEBUG: Using rfp_data directly from callback:`, {
                    rfpId: event.data.payload.rfp_id,
                    rfpName: event.data.payload.rfp_data.name,
                    hasFullData: true
                  });
                  
                  // Call handleSetCurrentRfp with direct RFP data to avoid database timing issues
                  await handleSetCurrentRfp(event.data.payload.rfp_id, event.data.payload.rfp_data);
                  
                  // Update session context if we have an active session
                  if (currentSessionId) {
                    try {
                      await DatabaseService.updateSessionContext(currentSessionId, { 
                        current_rfp_id: event.data.payload.rfp_id 
                      });
                      console.log('✅ RFP context saved to session via direct data:', currentSessionId, event.data.payload.rfp_id);
                    } catch (error) {
                      console.warn('⚠️ Failed to save RFP context to session via direct data:', error);
                    }
                  }
                } else {
                  console.log(`🔧 HOME MESSAGE DEBUG: No rfp_data in payload, calling handleSetCurrentRfp with ID: ${event.data.payload.rfp_id}`);
                  await handleSetCurrentRfp(event.data.payload.rfp_id);
                }
                
                const duration = Date.now() - startTime;
                console.log(`✅ HOME MESSAGE DEBUG: RFP context updated successfully in ${duration}ms:`, {
                  rfpId: event.data.payload.rfp_id,
                  rfpName: event.data.payload.rfp_name || event.data.payload.rfp_data?.name || 'unnamed',
                  method: event.data.payload.rfp_data ? 'direct_data' : 'database_query',
                  duration
                });
              } catch (error) {
                console.error('❌ HOME MESSAGE DEBUG: Edge Function RFP context update failed:', {
                  rfpId: event.data.payload.rfp_id,
                  error: error instanceof Error ? error.message : error,
                  stack: error instanceof Error ? error.stack : undefined
                });
              }
            } else {
              console.warn('⚠️ HOME MESSAGE DEBUG: Edge Function callback received but no rfp_id in payload:', {
                hasPayload: !!event.data.payload,
                payloadKeys: event.data.payload ? Object.keys(event.data.payload) : 'none',
                payload: event.data.payload
              });
            }
            break;

          case 'agent_context':
            console.log('🤖 HOME MESSAGE DEBUG: Agent context callback processing:', {
              callbackType: event.data.callbackType,
              hasPayload: !!event.data.payload,
              agentId: event.data.payload?.agent_id,
              agentName: event.data.payload?.agent_name,
              message: event.data.payload?.message,
              fullPayload: event.data.payload
            });
            
            if (event.data.payload?.agent_id) {
              try {
                console.log(`🔧 HOME MESSAGE DEBUG: Processing agent context update with ID: ${event.data.payload.agent_id}`);
                const startTime = Date.now();
                
                // Find the agent and convert to SessionActiveAgent format
                const targetAgent = agents.find(agent => agent.id === event.data.payload.agent_id);
                if (targetAgent) {
                  const sessionAgent: SessionActiveAgent = {
                    agent_id: targetAgent.id,
                    agent_name: targetAgent.name,
                    agent_role: targetAgent.role,
                    agent_instructions: targetAgent.instructions,
                    agent_initial_prompt: targetAgent.initial_prompt || '',
                    agent_avatar_url: targetAgent.avatar_url
                  };
                  await handleAgentChanged(sessionAgent);
                  const duration = Date.now() - startTime;
                  console.log(`✅ HOME MESSAGE DEBUG: Agent context updated successfully in ${duration}ms:`, {
                    agentId: event.data.payload.agent_id,
                    agentName: event.data.payload.agent_name || targetAgent.name,
                    duration
                  });
                } else {
                  console.warn('⚠️ HOME MESSAGE DEBUG: Agent not found in local agents list:', {
                    requestedAgentId: event.data.payload.agent_id,
                    availableAgents: agents.map(a => ({ id: a.id, name: a.name }))
                  });
                }
              } catch (error) {
                console.error('❌ HOME MESSAGE DEBUG: Edge Function agent context update failed:', {
                  agentId: event.data.payload.agent_id,
                  error: error instanceof Error ? error.message : error,
                  stack: error instanceof Error ? error.stack : undefined
                });
              }
            } else {
              console.warn('⚠️ HOME MESSAGE DEBUG: Agent context callback received but no agent_id in payload:', {
                hasPayload: !!event.data.payload,
                payloadKeys: event.data.payload ? Object.keys(event.data.payload) : 'none',
                payload: event.data.payload
              });
            }
            break;

          case 'artifact_viewer':
            console.log('📎 HOME MESSAGE DEBUG: Artifact viewer callback processing:', {
              callbackType: event.data.callbackType,
              hasPayload: !!event.data.payload,
              artifactId: event.data.payload?.artifactId,
              type: event.data.payload?.type,
              fullPayload: event.data.payload
            });
            
            if (event.data.payload?.artifactId) {
              try {
                console.log(`� HOME MESSAGE DEBUG: Processing artifact viewer update with ID: ${event.data.payload.artifactId}`);
                const startTime = Date.now();
                
                // Create artifact reference for the handler
                const artifactRef: ArtifactReference = {
                  artifactId: event.data.payload.artifactId,
                  artifactName: event.data.payload.name || `Artifact ${event.data.payload.artifactId}`,
                  artifactType: event.data.payload.type || 'form',
                  isCreated: true
                };
                
                handleArtifactSelect(artifactRef);
                const duration = Date.now() - startTime;
                console.log(`✅ HOME MESSAGE DEBUG: Artifact viewer updated successfully in ${duration}ms:`, {
                  artifactId: event.data.payload.artifactId,
                  type: event.data.payload.type,
                  duration
                });
              } catch (error) {
                console.error('❌ HOME MESSAGE DEBUG: Edge Function artifact viewer update failed:', {
                  artifactId: event.data.payload.artifactId,
                  error: error instanceof Error ? error.message : error,
                  stack: error instanceof Error ? error.stack : undefined
                });
              }
            } else {
              console.warn('⚠️ HOME MESSAGE DEBUG: Artifact viewer callback received but no artifactId in payload:', {
                hasPayload: !!event.data.payload,
                payloadKeys: event.data.payload ? Object.keys(event.data.payload) : 'none',
                payload: event.data.payload
              });
            }
            break;

          default:
            console.log(`📝 HOME MESSAGE DEBUG: Edge Function callback for unhandled target: ${event.data.target}`, {
              target: event.data.target,
              callbackType: event.data.callbackType,
              hasPayload: !!event.data.payload
            });
            break;
        }
      }
      
      // ENHANCED: Handle direct RFP updates from edge functions
      if (event.data?.type === 'UPDATE_CURRENT_RFP_DIRECT') {
        console.log('🎯 DEBUG: Direct RFP update from edge function:', event.data);
        if (event.data.rfp_data) {
          try {
            await handleSetCurrentRfp(event.data.rfp_data.id, event.data.rfp_data);
            console.log('✅ Direct RFP update successful:', event.data.rfp_data.name);
          } catch (error) {
            console.error('❌ Direct RFP update failed:', error);
          }
        }
        return;
      }
      
      // ENHANCED: Handle success messages from edge functions
      if (event.data?.type === 'SHOW_SUCCESS_MESSAGE') {
        console.log('🎯 DEBUG: Success message from edge function:', event.data.message);
        // You could integrate this with a toast system or notification component
        // For now, just log it - can be enhanced later with proper UI notifications
        return;
      }
      
      // ENHANCED: Handle UI refresh requests from edge functions
      if (event.data?.type === 'REFRESH_UI_STATE') {
        console.log('🎯 DEBUG: UI refresh request from edge function:', event.data);
        if (event.data.component === 'RFP_INDICATOR' && event.data.force_refresh) {
          // Force a re-render of RFP indicator component
          // This could trigger a state update that forces re-render
          console.log('🔄 Forcing RFP indicator refresh');
        }
        return;
      }

      // NEW: Handle RFP_CREATED_SUCCESS messages from useMessageHandling
      if (event.data?.type === 'RFP_CREATED_SUCCESS') {
        console.log('🎯 HOME MESSAGE DEBUG: RFP_CREATED_SUCCESS received:', {
          rfpId: event.data.rfp_id,
          rfpName: event.data.rfp_name,
          sessionId: event.data.sessionId,
          timestamp: new Date().toISOString()
        });
        
        if (event.data.rfp_id) {
          try {
            await handleSetCurrentRfp(event.data.rfp_id);
            console.log('✅ HOME MESSAGE DEBUG: RFP context updated from RFP_CREATED_SUCCESS:', event.data.rfp_id);
            
            // Also refresh artifacts to ensure new form artifacts are loaded
            if (currentSessionId) {
              await loadSessionArtifacts(currentSessionId);
              console.log('✅ Artifacts refreshed after RFP creation');
            }
          } catch (error) {
            console.error('❌ HOME MESSAGE DEBUG: Failed to update RFP context from RFP_CREATED_SUCCESS:', error);
          }
        }
        return;
      }

      // NEW: Handle REFRESH_SESSION_CONTEXT messages from useMessageHandling
      if (event.data?.type === 'REFRESH_SESSION_CONTEXT') {
        console.log('🎯 HOME MESSAGE DEBUG: REFRESH_SESSION_CONTEXT received:', {
          sessionId: event.data.sessionId,
          timestamp: new Date().toISOString()
        });
        
        if (event.data.sessionId && currentSessionId === event.data.sessionId) {
          try {
            // Reload session context to get updated RFP context
            const sessionWithContext = await DatabaseService.getSessionWithContext(event.data.sessionId);
            if (sessionWithContext?.current_rfp_id) {
              await handleSetCurrentRfp(sessionWithContext.current_rfp_id, undefined, true);
              console.log('✅ HOME MESSAGE DEBUG: Session context refreshed with RFP:', sessionWithContext.current_rfp_id);
            }
            
            // Also refresh artifacts to ensure they're up to date
            await loadSessionArtifacts(event.data.sessionId);
            console.log('✅ Artifacts refreshed from session context');
          } catch (error) {
            console.error('❌ HOME MESSAGE DEBUG: Failed to refresh session context:', error);
          }
        }
        return;
      }

      // NEW: Handle ARTIFACT_REFRESH_NEEDED messages from useMessageHandling
      if (event.data?.type === 'ARTIFACT_REFRESH_NEEDED') {
        console.log('🎯 HOME MESSAGE DEBUG: ARTIFACT_REFRESH_NEEDED received:', {
          sessionId: event.data.sessionId,
          timestamp: event.data.timestamp
        });
        
        if (event.data.sessionId && currentSessionId === event.data.sessionId) {
          try {
            console.log('🔄 Refreshing artifacts after tool execution for session:', event.data.sessionId);
            await loadSessionArtifacts(event.data.sessionId);
            console.log('✅ Artifacts refreshed successfully after tool execution');
          } catch (error) {
            console.error('❌ HOME MESSAGE DEBUG: Failed to refresh artifacts after tool execution:', error);
          }
        }
        return;
      }
      
      // ORIGINAL: Handle legacy RFP refresh messages
      if (event.data?.type === 'REFRESH_CURRENT_RFP') {
        console.log('🎯 DEBUG: handleRfpRefreshMessage called - processing REFRESH_CURRENT_RFP');
        console.log('🔄 Received RFP refresh request from Claude function', {
          eventData: event.data,
          currentSessionId
        });
        
        // Priority 1: Use rfp_id from event data if provided
        if (event.data.rfp_id) {
          console.log('🎯 DEBUG: Setting current RFP from event data - using RFP ID:', event.data.rfp_id);
          try {
            await handleSetCurrentRfp(event.data.rfp_id);
            console.log('🎯 DEBUG: RFP context set successfully from event data');
            return; // Exit early since we successfully set RFP from event
          } catch (error) {
            console.warn('🎯 DEBUG: Failed to set RFP from event data, falling back to session:', error);
          }
        }
        
        // Priority 2: Fall back to session context reload
        if (currentSessionId) {
          const attemptSessionReload = async (retryCount = 0) => {
            try {
              console.log('🎯 DEBUG: Reloading session RFP context for session:', currentSessionId, 'attempt:', retryCount + 1);
              const sessionWithContext = await DatabaseService.getSessionWithContext(currentSessionId);
              
              if (sessionWithContext?.current_rfp_id) {
                console.log('🎯 DEBUG: Setting current RFP from session context:', sessionWithContext.current_rfp_id);
                await handleSetCurrentRfp(sessionWithContext.current_rfp_id, undefined, true);
                console.log('🎯 DEBUG: RFP context refreshed from session successfully');
              } else if (retryCount < 3) {
                // If we have an RFP name but no session context yet, retry after delay
                if (event.data.rfp_name) {
                  console.log('🎯 DEBUG: No session context yet for RFP:', event.data.rfp_name, '- retrying in 1s');
                  setTimeout(() => attemptSessionReload(retryCount + 1), 1000);
                } else {
                  console.log('🎯 DEBUG: No RFP context found in session after refresh - clearing RFP');
                  handleClearCurrentRfp();
                }
              } else {
                console.log('🎯 DEBUG: Max retries reached - No RFP context found in session after refresh');
                console.log('🎯 DEBUG: NOT clearing RFP - the RFP may have been created successfully but session context update failed');
                
                // Try to find RFP by name as a fallback
                if (event.data.rfp_name) {
                  console.log('🎯 DEBUG: Attempting to find RFP by name:', event.data.rfp_name);
                  try {
                    // Import RFPService dynamically to avoid circular dependencies
                    const { RFPService } = await import('../services/rfpService');
                    const rfps: RFP[] = await RFPService.getAll();
                    const matchingRfp = rfps.find((rfp: RFP) => rfp.name === event.data.rfp_name);
                    if (matchingRfp) {
                      console.log('🎯 DEBUG: Found RFP by name - setting as current:', matchingRfp.id);
                      await handleSetCurrentRfp(matchingRfp.id);
                    } else {
                      console.log('🎯 DEBUG: No RFP found with name:', event.data.rfp_name);
                    }
                  } catch (error) {
                    console.error('🎯 DEBUG: Failed to search for RFP by name:', error);
                  }
                }
              }
            } catch (error) {
              console.warn('🎯 DEBUG: Failed to refresh session RFP context (attempt', retryCount + 1, '):', error);
              if (retryCount < 3) {
                setTimeout(() => attemptSessionReload(retryCount + 1), 1000);
              }
            }
          };
          
          attemptSessionReload();
        } else {
          console.log('🎯 DEBUG: No current session to refresh RFP context for');
        }
      }
      
      // 🚀 MCP UI REFRESH FIX: Trigger immediate poll after any RFP-related message
      // This helps with MCP browser tests where operations complete but UI isn't updated
      if (event.data?.type === 'REFRESH_CURRENT_RFP' || 
          event.data?.type === 'RFP_CREATED_SUCCESS' || 
          event.data?.type === 'EDGE_FUNCTION_CALLBACK') {
        console.log('🔄 MCP UI REFRESH: Triggering immediate state poll after message event');
        setTimeout(async () => {
          if (currentSessionId && session) {
            try {
              const sessionWithContext = await DatabaseService.getSessionWithContext(currentSessionId);
              if (sessionWithContext?.current_rfp_id && sessionWithContext.current_rfp_id !== currentRfpId) {
                console.log('🔄 MCP UI REFRESH: Immediate poll found missing RFP context:', sessionWithContext.current_rfp_id);
                await handleSetCurrentRfp(sessionWithContext.current_rfp_id, undefined, true);
              }
            } catch (error) {
              console.warn('🔄 MCP UI REFRESH: Error during immediate poll:', error);
            }
          }
        }, 500); // Quick poll after a short delay
      }
    };

    console.log('🎧 HOME MESSAGE DEBUG: Setting up window message event listener');
    window.addEventListener('message', handleRfpRefreshMessage);
    console.log('✅ HOME MESSAGE DEBUG: Window message event listener registered');
    
    return () => {
      console.log('🗑️ HOME MESSAGE DEBUG: Removing window message event listener');
      window.removeEventListener('message', handleRfpRefreshMessage);
    };
  }, [currentSessionId, handleSetCurrentRfp, handleClearCurrentRfp]);

  // Load active agent when session changes - but only if not already handled by handleSelectSession
  useEffect(() => {
    if (currentSessionId && userId) {
      // Only load agent - artifacts and messages are handled by handleSelectSession
      loadSessionAgent(currentSessionId);
      // Reset initial load flag when switching sessions
      initialAgentLoadedRef.current = false;
    } else if (!currentSessionId && isAuthenticated && userId && !initialAgentLoadedRef.current) {
      // Only load once using ref to prevent infinite loop
      initialAgentLoadedRef.current = true;
      loadDefaultAgentWithPrompt().then(initialMessage => {
        if (initialMessage) {
          setMessages([initialMessage]);
        }
      });
    }
  }, [currentSessionId, userId, isAuthenticated]);

  const handleNewSession = async () => {
    console.log('🆕 Starting new session creation with global RFP context inheritance...');
    setIsCreatingNewSession(true);
    setIsSessionLoading(true); // Trigger auto-focus on message input
    
    try {
      // Get global RFP context for inheritance
      const globalContext = getGlobalRFPContext();
      console.log('🌐 Global RFP context for new session:', globalContext);
      
      // Clear ALL UI state completely (but preserve global RFP context)
      setMessages([]);
      clearArtifacts();
      setSelectedSessionId(undefined);
      setCurrentSessionId(undefined);
      // CRITICAL: Clear ref as well
      currentSessionIdRef.current = undefined;
      console.log('📌 Session ID ref cleared in handleNewSession');
      
      // Reset artifact window state completely for new session
      artifactWindowState.resetForNewSession();
      artifactWindowState.saveLastSession(null);
      // Don't force-collapse session history - let user access session management naturally
      
      // 🔥 CRITICAL FIX: Actually create a new session in the database with global RFP context
      if (isAuthenticated && userId && createNewSession) {
        console.log('🔥 Creating actual new session in database with inherited RFP:', globalContext.rfpId);
        // For new sessions, inherit global RFP context but use default Solutions agent
        const newSessionId = await createNewSession(null, globalContext.rfpId ?? undefined);
        
        if (newSessionId) {
          console.log('✅ New session created successfully:', newSessionId);
          console.log('🔄 Setting currentSessionId and selectedSessionId...');
          setCurrentSessionId(newSessionId);
          setSelectedSessionId(newSessionId);
          // CRITICAL: Update ref immediately for synchronous access
          currentSessionIdRef.current = newSessionId;
          console.log('📌 Session ID ref updated immediately:', newSessionId);
          
          // Clear tool invocations for the new session (start fresh)
          clearToolInvocations(newSessionId);
          loadToolInvocationsForSession(newSessionId);
          
          console.log('⏳ State set, isCreatingNewSession should be cleared by useEffect when currentSessionId updates');
          
          // Wait for React state to update before continuing
          // Use a small delay to ensure state updates are processed
          await new Promise(resolve => setTimeout(resolve, 50));
          
          // Reload sessions to include the new session
          if (loadUserSessions) {
            console.log('♻️  Reloading sessions to include new session...');
            await loadUserSessions();
          }
          
          // Always load the default agent for new sessions since we passed null to createNewSession
          const initialMessage = await loadDefaultAgentWithPrompt();
          if (initialMessage) {
            setMessages([initialMessage]);
            console.log('New session started with default agent:', initialMessage.agentName);
          }
          
          console.log('🎉 New session created successfully with clean state');
        } else {
          console.error('❌ Failed to create new session');
          // Fallback to loading default agent without session
          const initialMessage = await loadDefaultAgentWithPrompt();
          if (initialMessage) {
            setMessages([initialMessage]);
          }
        }
      } else {
        console.log('⚠️  Not authenticated or missing dependencies, creating local session only');
        const initialMessage = await loadDefaultAgentWithPrompt();
        if (initialMessage) {
          setMessages([initialMessage]);
        }
      }
      
    } catch (error) {
      console.error('❌ Error creating new session:', error);
      // Ensure we still have some UI state even if session creation fails
      const initialMessage = await loadDefaultAgentWithPrompt();
      if (initialMessage) {
        setMessages([initialMessage]);
      }
    } finally {
      // Clear the flags after successfully setting up the new session
      setTimeout(() => {
        console.log('🏁 New session creation complete, clearing flags');
        setIsCreatingNewSession(false);
        setIsSessionLoading(false); // Reset auto-focus trigger
      }, 100); // Small delay to ensure all state updates are processed
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    const success = await deleteSession(sessionId);
    if (success && currentSessionId === sessionId) {
      setMessages([]);
      clearArtifacts();
      setSelectedSessionId(undefined);
      setCurrentSessionId(undefined);
      // CRITICAL: Clear ref as well
      currentSessionIdRef.current = undefined;
      console.log('📌 Session ID ref cleared after deletion');
    }
  };

  const onSendMessage = async (content: string) => {
    // CRITICAL FIX: Use ref for immediate access to current session ID, avoiding stale closures
    const refSessionId = currentSessionIdRef.current;
    
    // Enhanced debugging for session ID issues
    console.log('📤 onSendMessage called with:', {
      content: content.substring(0, 50) + '...',
      currentSessionId,
      refSessionId,
      isCreatingNewSession,
      isAuthenticated,
      userId
    });
    
    // Prevent sending messages while creating a new session to avoid session ID race conditions
    if (isCreatingNewSession) {
      console.log('🚫 Message sending blocked - new session creation in progress');
      return;
    }
    
    // CRITICAL FIX: Use ref for most current session ID value
    let activeSessionId = refSessionId;
    
    if (!activeSessionId && isAuthenticated && userId) {
      console.warn('⚠️  No session ID available for authenticated user - creating emergency session');
      console.log('🔍 State before emergency session:', {
        currentSessionId,
        isCreatingNewSession,
        isAuthenticated,
        userId,
        messagesLength: messages.length
      });
      
      // Create an emergency session synchronously with global RFP context
      if (createNewSession) {
        try {
          console.log('🆘 Creating emergency session with global RFP context:', globalCurrentRfpId);
          const emergencySessionId = await createNewSession(currentAgent, globalCurrentRfpId ?? undefined);
          if (emergencySessionId) {
            console.log('✅ Emergency session created:', emergencySessionId);
            activeSessionId = emergencySessionId;
            // Update state to reflect the new session
            setCurrentSessionId(emergencySessionId);
            setSelectedSessionId(emergencySessionId);
            // CRITICAL: Update ref immediately for synchronous access
            currentSessionIdRef.current = emergencySessionId;
            console.log('📌 Emergency session ID ref updated:', emergencySessionId);
            // Reload sessions to include the new session
            if (loadUserSessions) {
              await loadUserSessions();
            }
          } else {
            console.error('❌ Failed to create emergency session');
            return;
          }
        } catch (error) {
          console.error('❌ Error creating emergency session:', error);
          return;
        }
      } else {
        console.error('❌ No createNewSession function available');
        return;
      }
    }
    
    await handleSendMessage(
      content,
      messages,
      setMessages,
      setIsLoading,
      activeSessionId, // Use the validated session ID
      setCurrentSessionId,
      setSelectedSessionId,
      createNewSession,
      loadUserSessions,
      isAuthenticated,
      userId,
      currentAgent,
      userProfile,
      currentRfp ?? null,
      addClaudeArtifacts,
      loadSessionAgent,
      (agent) => {
        // Create a synchronous wrapper that returns null immediately
        // and handles the async operation in the background
        handleAgentChanged(agent).then(agentMessage => {
          if (agentMessage) {
            setMessages((prev: Message[]) => [...prev, agentMessage]);
          }
        }).catch(error => {
          console.error('Failed to handle agent change:', error);
        });
        return null; // Return null immediately to satisfy the sync interface
      },
      loadSessionArtifacts,
      selectedArtifact // Add current artifact context
    );
  };

  // Helper function to create system messages instead of alert popups
  const addSystemMessage = (content: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const icons = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    };
    
    const systemMessage: Message = {
      id: `system-${type}-${Date.now()}`,
      content: `${icons[type]} ${content}`,
      isUser: false,
      timestamp: new Date(),
      agentName: 'System'
    };
    
    setMessages((prev: Message[]) => [...prev, systemMessage]);
  };

  const handleArtifactSelect = async (artifactRef: ArtifactReference) => {
    console.log('Artifact selected:', artifactRef);
    console.log('Available artifacts:', artifacts.map(a => ({ id: a.id, name: a.name, type: a.type })));
    
    // Function to attempt artifact selection with retry logic
    const attemptArtifactSelection = async (retryCount = 0): Promise<boolean> => {
      const artifact = artifacts.find(a => a.id === artifactRef.artifactId);
      
      if (artifact) {
        selectArtifact(artifact.id);
        artifactWindowState.selectArtifact(artifact.id);
        artifactWindowState.openWindow();
        artifactWindowState.expandWindow();
        console.log('✅ Selected artifact for display:', artifact.name);
        return true;
      }
      
      // If artifact not found and we haven't exhausted retries, try again
      if (retryCount < 3) {
        console.log(`⏳ Artifact not immediately available, retrying in ${100 * (retryCount + 1)}ms... (attempt ${retryCount + 1}/3)`);
        await new Promise(resolve => setTimeout(resolve, 100 * (retryCount + 1)));
        return attemptArtifactSelection(retryCount + 1);
      }
      
      return false;
    };
    
    // Try to select the artifact with retry logic
    const success = await attemptArtifactSelection();
    
    if (!success) {
      console.warn('❌ Artifact not found after retries:', artifactRef.artifactId);
      console.log('🔍 This suggests a sync issue between artifact creation and UI state updates');
      
      // Try to reload artifacts from database before showing error
      if (currentSessionId) {
        console.log('🔄 Attempting to reload session artifacts from database...');
        try {
          await loadSessionArtifacts(currentSessionId);
          // Try one more time after reload
          const artifactAfterReload = artifacts.find(a => a.id === artifactRef.artifactId);
          if (artifactAfterReload) {
            selectArtifact(artifactAfterReload.id);
            artifactWindowState.selectArtifact(artifactAfterReload.id);
            artifactWindowState.openWindow();
            artifactWindowState.expandWindow();
            console.log('✅ Found artifact after database reload:', artifactAfterReload.name);
            return;
          }
        } catch (error) {
          console.error('Failed to reload session artifacts:', error);
        }
      }
      
      // Create a system message instead of showing an alert popup
      const errorMessage: Message = {
        id: `artifact-error-${artifactRef.artifactId}-${Date.now()}`,
        content: `⚠️ Artifact "${artifactRef.artifactName}" could not be loaded. Please try refreshing the page.`,
        isUser: false,
        timestamp: new Date(),
        agentName: 'System'
      };
      setMessages((prev: Message[]) => [...prev, errorMessage]);
    }
  };

  const onAgentChanged = async (newAgent: SessionActiveAgent) => {
    const agentMessage = await handleAgentChanged(newAgent);
    if (agentMessage) {
      setMessages((prev: Message[]) => [...prev, agentMessage]);
    }
  };

  // Handler for viewing bids - creates or reuses a single bid view artifact per RFP
  const handleViewBids = () => {
    if (!currentRfp) {
      console.warn('No current RFP selected');
      return;
    }

    // Generate deterministic ID for this RFP's bid view (one per RFP)
    const bidViewId = `bid-view-${currentRfp.id}`;
    
    // Check if a bid view already exists for this RFP
    const existingBidView = artifacts.find(a => a.id === bidViewId);
    
    let bidViewArtifact: Artifact;
    
    if (existingBidView) {
      console.log('Reusing existing bid view artifact:', existingBidView.id);
      // Update the name in case RFP name changed
      bidViewArtifact = {
        ...existingBidView,
        name: `Bids for ${currentRfp.name}`,
        content: currentRfp.name
      };
      
      // Update in state if name changed
      setArtifacts((prev: Artifact[]) => 
        prev.map(a => a.id === bidViewId ? bidViewArtifact : a)
      );
    } else {
      console.log('Creating new bid view artifact:', bidViewId);
      // Create a new bid view artifact (one per RFP - no timestamp in ID)
      bidViewArtifact = {
        id: bidViewId,
        name: `Bids for ${currentRfp.name}`,
        type: 'bid_view',
        size: '0 KB',
        content: currentRfp.name, // Pass RFP name as content
        rfpId: currentRfp.id,
        role: 'buyer'
      };
      
      // Add artifact to state
      setArtifacts((prev: Artifact[]) => [...prev, bidViewArtifact]);
    }

    // Select the artifact after a brief delay to ensure state is updated
    setTimeout(() => {
      const artifactRef: ArtifactReference = {
        artifactId: bidViewArtifact.id,
        artifactName: bidViewArtifact.name,
        artifactType: 'bid_view',
        isCreated: true,
        displayText: `View bids for ${currentRfp.name}`
      };
      
      console.log('Attempting to select artifact:', artifactRef.artifactId);
      
      // Select artifact directly using the artifact management functions
      selectArtifact(bidViewArtifact.id);
      artifactWindowState.selectArtifact(bidViewArtifact.id);
      artifactWindowState.openWindow();
      artifactWindowState.expandWindow();
      console.log('Selected bid view artifact for display:', bidViewArtifact.name);
    }, 100);
  };

  // Form save handler (draft save without submission)
  const handleFormSave = async (artifact: Artifact, formData: Record<string, unknown>) => {
    console.log('=== FORM SAVE (DRAFT) ===');
    console.log('Artifact name:', artifact.name);
    console.log('Form data:', formData);
    
    try {
      await ArtifactService.saveFormData(artifact, formData, user, addSystemMessage);
      console.log('✅ Form draft saved successfully');
    } catch (error) {
      console.error('❌ Failed to save form draft:', error);
      addSystemMessage('Failed to save draft', 'error');
      throw error;
    }
  };

  // Form submission handler with auto-prompt
  const handleFormSubmissionWithAutoPrompt = async (artifact: Artifact, formData: Record<string, unknown>) => {
    console.log('=== FORM SUBMISSION WITH AUTO-PROMPT ===');
    console.log('Artifact name:', artifact.name);
    console.log('Form data:', formData);
    
    try {
      // Save to artifact_submissions table (always available)
      console.log('💾 Saving form submission to artifact_submissions table...');
      try {
        await DatabaseService.saveArtifactSubmission(
          artifact.id,
          formData,
          currentSessionId,
          user?.id
        );
        console.log('✅ Form submission saved to artifact_submissions table');
      } catch (submissionError) {
        console.warn('⚠️ Could not save to artifact_submissions table:', submissionError);
        // Continue - try other methods
      }

      // If we have RFP context, also save there
      if (currentRfpId) {
        console.log('📤 Updating RFP questionnaire response using RFPService...');
        
        // Prepare the questionnaire response data
        const questionnaireResponse = {
          default_values: formData,
          supplier_info: {
            name: 'Anonymous User', // Default for anonymous submissions
            email: 'anonymous@example.com'
          },
          submitted_at: new Date().toISOString(),
          form_version: '1.0'
        };

        // Save the questionnaire response using the new RFPService method
        const { RFPService } = await import('../services/rfpService');
        const updatedRfp = await RFPService.updateRfpBuyerQuestionnaireResponse(
          currentRfpId, 
          questionnaireResponse
        );

        if (updatedRfp) {
          console.log('✅ Form response saved to RFP successfully');
        }
      } else {
        console.log('ℹ️ No RFP context - form saved to artifact submissions only');
      }
        
      addSystemMessage('Form submitted successfully!', 'success');
        
      // Send auto-prompt after successful submission
      const formName = artifact.name || 'Form';
      console.log('📤 Sending auto-prompt for form:', formName);
      
      await sendAutoPrompt(
        formName,
        formData, // Pass the actual form data
        messages,
        setMessages,
        setIsLoading,
        currentSessionId,
        setCurrentSessionId,
        setSelectedSessionId,
        createNewSession,
        loadUserSessions,
        isAuthenticated,
        userId,
        currentAgent,
        userProfile,
        currentRfp ?? null,
        addClaudeArtifacts,
        loadSessionAgent,
        (agent) => {
          // Create a synchronous wrapper that returns null immediately
          // and handles the async operation in the background
          handleAgentChanged(agent).then(agentMessage => {
            if (agentMessage) {
              setMessages((prev: Message[]) => [...prev, agentMessage]);
            }
          }).catch(error => {
            console.error('Failed to handle agent change:', error);
          });
          return null; // Return null immediately to satisfy the sync interface
        },
        loadSessionArtifacts
      );
      
    } catch (error) {
      console.error('❌ Error submitting form:', error);
      addSystemMessage('An error occurred while submitting the questionnaire.', 'error');
    }
  };

  // Download handler for artifacts
  const handleDownloadArtifact = async (artifact: Artifact) => {
    console.log('Download artifact:', artifact);
    console.log('Artifact type:', artifact.type);
    console.log('Artifact content (first 200 chars):', typeof artifact.content === 'string' ? artifact.content.substring(0, 200) : artifact.content);
    
    try {
      // Check if it's a form artifact or document with form-like content
      if ((artifact.type === 'form' || artifact.type === 'document') && artifact.content) {
        console.log('Processing potential form/document artifact...');
        
        try {
          const formData = JSON.parse(artifact.content);
          console.log('Form data structure:', {
            hasSchema: !!formData.schema,
            hasUiSchema: !!formData.uiSchema,
            hasFormData: !!formData.formData,
            title: formData.title,
            keys: Object.keys(formData)
          });
          
          // Check if it's a buyer questionnaire with schema (structured form)
          if (formData.schema && typeof formData.schema === 'object') {
            console.log('Valid form schema found, proceeding with document generation...');
            // Convert to FormSpec format expected by DocxExporter
            const formSpec: FormSpec = {
              version: 'rfpez-form@1',
              schema: formData.schema,
              uiSchema: formData.uiSchema || {},
              defaults: formData.formData || {}
            };
            
            // Get actual submitted response data from the current RFP
            let responseData: Record<string, unknown> = {};
            
            if (currentRfp) {
              // Check which type of form this is and get the appropriate response data
              if (artifact.name.toLowerCase().includes('buyer') || 
                  artifact.name.toLowerCase().includes('questionnaire') ||
                  artifact.id.startsWith('buyer-form-')) {
                // This is a buyer questionnaire - get response using new method
                try {
                  const { RFPService } = await import('../services/rfpService');
                  const questionnaireResponse = await RFPService.getRfpBuyerQuestionnaireResponse(currentRfp.id);
                  responseData = questionnaireResponse?.default_values || {};
                  console.log('Using buyer questionnaire response data from new method:', responseData);
                } catch (error) {
                  console.warn('Failed to load questionnaire response, falling back to legacy:', error);
                  responseData = (currentRfp.buyer_questionnaire_response as Record<string, unknown>) || {};
                }
              } else if (artifact.name.toLowerCase().includes('bid') || 
                        artifact.name.toLowerCase().includes('supplier') ||
                        artifact.id.startsWith('bid-form-')) {
                // This is a bid form - check if we have bid responses (this would be in a separate table)
                // For now, use the form defaults as bid responses aren't stored in the RFP record
                responseData = formData.formData || {};
                console.log('Using form defaults for bid form (no submitted responses available)');
              } else {
                // Unknown form type, try new method first, then legacy, then defaults
                try {
                  const { RFPService } = await import('../services/rfpService');
                  const questionnaireResponse = await RFPService.getRfpBuyerQuestionnaireResponse(currentRfp.id);
                  responseData = questionnaireResponse?.default_values || (currentRfp.buyer_questionnaire_response as Record<string, unknown>) || formData.formData || {};
                } catch (error) {
                  responseData = (currentRfp.buyer_questionnaire_response as Record<string, unknown>) || formData.formData || {};
                }
                console.log('Unknown form type, using available response data:', responseData);
              }
            } else {
              // No RFP context, use form defaults
              responseData = formData.formData || {};
              console.log('No RFP context, using form defaults');
            }
            
            // If response data is empty, show a warning but still proceed with empty fields
            if (Object.keys(responseData).length === 0) {
              console.warn('⚠️ No response data available for this form, will create document with empty fields');
              const proceed = confirm(
                'This form has not been submitted yet or has no response data. ' +
                'The downloaded document will contain empty fields for you to fill out. Do you want to continue?'
              );
              if (!proceed) {
                return;
              }
              // Use form defaults or empty object to create fillable form
              responseData = formData.formData || {};
            }
            
            // Set up export options
            const exportOptions = {
              title: formData.title || artifact.name || 'Form Response',
              filename: `${artifact.name || 'form-response'}.docx`,
              companyName: (responseData.companyName as string) || 'Your Company',
              rfpName: currentRfp?.name || 'RFP Response',
              submissionDate: new Date(),
              includeHeaders: true
            };
            
            // Download as DOCX
            await DocxExporter.downloadBidDocx(formSpec, responseData, exportOptions);
            console.log('✅ Form artifact downloaded as DOCX');
            return;
          } 
          // Check if it's a document artifact with structured content (from generate_text_artifact or generate_proposal_artifact)
          else if (artifact.type === 'document' && formData.content && formData.content_type) {
            console.log('Document artifact with structured content found, converting to DOCX...');
            
            // Extract the actual document content from the JSON structure
            const documentContent = formData.content;
            const contentType = formData.content_type || 'markdown';
            
            console.log('Document content type:', contentType);
            console.log('Document content (first 200 chars):', documentContent.substring(0, 200));
            
            // Handle document conversion based on content type
            const exportOptions = {
              title: formData.title || artifact.name || 'Document',
              filename: `${artifact.name || 'document'}.docx`,
              rfpName: currentRfp?.name || '',
              submissionDate: new Date(),
              includeHeaders: true
            };
            
            try {
              if (contentType === 'markdown' || contentType === 'text') {
                await DocxExporter.downloadMarkdownDocx(documentContent, exportOptions);
                console.log('✅ Structured document downloaded as DOCX');
                return;
              } else {
                // For other content types, try markdown conversion as fallback
                console.log('⚠️ Unknown content type, attempting markdown conversion as fallback');
                await DocxExporter.downloadMarkdownDocx(documentContent, exportOptions);
                console.log('✅ Document downloaded as DOCX (fallback)');
                return;
              }
            } catch (docxError) {
              console.error('❌ Error converting structured document to DOCX:', docxError);
              addSystemMessage('Error converting document to Word format. The document will be downloaded as a text file instead.', 'warning');
              // Continue to fallback download with the extracted content
              const blob = new Blob([documentContent], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `${artifact.name || 'document'}.txt`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
              console.log('✅ Document content downloaded as text file (fallback)');
              return;
            }
          }
          else if (artifact.type === 'form') {
            // Only show this error for actual form artifacts without schema
            console.warn('⚠️ Form artifact does not have valid schema structure');
            console.log('Form data keys:', Object.keys(formData));
            console.log('Schema type:', typeof formData.schema);
            
            addSystemMessage(
              'This form artifact does not contain a valid form schema. ' +
              'The artifact appears to contain metadata or raw form data instead of a structured form definition. ' +
              'Please check that this is a properly formatted form artifact.', 'warning'
            );
            return;
          }
        } catch (jsonError) {
          // If JSON parsing fails and it's a form, show error
          if (artifact.type === 'form') {
            console.warn('⚠️ Form artifact has invalid JSON content');
            addSystemMessage('This form artifact appears to be empty or contains invalid data.', 'warning');
            return;
          }
          // If it's a document that's not JSON, check if it's markdown/text content
          if (artifact.type === 'document' && typeof artifact.content === 'string') {
            console.log('Document artifact contains text/markdown content, converting to DOCX...');
            
            // Handle markdown/text documents
            const exportOptions = {
              title: artifact.name || 'Document',
              filename: `${artifact.name || 'document'}.docx`,
              rfpName: currentRfp?.name || '',
              submissionDate: new Date(),
              includeHeaders: true
            };
            
            try {
              await DocxExporter.downloadMarkdownDocx(artifact.content, exportOptions);
              console.log('✅ Markdown document downloaded as DOCX');
              return;
            } catch (docxError) {
              console.error('❌ Error converting markdown to DOCX:', docxError);
              addSystemMessage('Error converting document to Word format. The document will be downloaded as a text file instead.', 'warning');
              // Fall through to basic download
            }
          } else {
            console.log('Document artifact is not text content, treating as regular document for download');
          }
        }
      }
      
      // For other artifact types, fall back to basic download
      if (artifact.url) {
        const link = document.createElement('a');
        link.href = artifact.url as string; // We know it's defined from the if check
        link.download = artifact.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log('✅ Artifact downloaded via URL');
      } else if (artifact.content && typeof artifact.content === 'string') {
        // Create a blob from content and download
        const blob = new Blob([artifact.content as string], { type: 'text/plain' }); // We know it's a string from the if check
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${artifact.name}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        console.log('✅ Artifact content downloaded as text file');
      } else {
        console.warn('⚠️ No downloadable content found in artifact');
        addSystemMessage('This artifact does not have downloadable content.', 'info');
      }
      
    } catch (error) {
      console.error('❌ Error downloading artifact:', error);
      addSystemMessage('An error occurred while downloading the artifact. Please try again.', 'error');
    }
  };

  return (
    <IonPage>
      <HomeHeader
        userProfile={userProfile}
        isAuthenticated={isAuthenticated}
        user={user}
        rfps={rfps}
        currentRfpId={currentRfpId ?? null}
        showRFPMenu={showRFPMenu}
        setShowRFPMenu={setShowRFPMenu}
        onNewRFP={handleNewRFP}
        onEditRFP={handleEditRFP}
        onDeleteRFP={handleDeleteRFP}
        onPreviewRFP={handlePreviewRFP}
        onShareRFP={handleShareRFP}
        onSetCurrentRfp={handleSetCurrentRfp}
        onClearCurrentRfp={handleClearCurrentRfp}
        agents={agents}
        showAgentsMenu={showAgentsMenu}
        setShowAgentsMenu={setShowAgentsMenu}
        currentAgent={currentAgent}
        onNewAgent={handleNewAgent}
        onEditAgent={handleEditAgent}
        onDeleteAgent={handleDeleteAgent}
        onSwitchAgent={handleShowAgentSelector}
        onMainMenuSelect={handleMainMenuSelect}
      />

      <IonContent fullscreen scrollY={false} style={{ 
        '--overflow': 'hidden',
        '--padding-top': '0',
        '--padding-bottom': '0'
      }}>
        {/* Proper content container that accounts for header */}
        <div style={{ 
          position: 'absolute',
          top: '56px', // Start below the header
          left: 0,
          right: 0,
          bottom: '40px', // Account for footer
          display: 'flex', 
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <HomeContent
            sessions={sessions}
            selectedSessionId={selectedSessionId}
            onNewSession={handleNewSession}
            onSelectSession={handleSelectSession}
            onDeleteSession={handleDeleteSession}
            messages={messages}
            isLoading={isLoading}
            onSendMessage={onSendMessage}
            onAttachFile={handleAttachFile}
            artifacts={artifacts}
            selectedArtifact={selectedArtifact}
            currentRfpId={currentRfpId ?? null}
            onDownloadArtifact={handleDownloadArtifact}
            onArtifactSelect={handleArtifactSelect}
            onFormSubmit={handleFormSubmissionWithAutoPrompt}
            onFormSave={handleFormSave}
            currentAgent={currentAgent}
            onCancelRequest={cancelRequest}
            toolInvocations={toolInvocations}
            // New artifact window state props
            artifactWindowOpen={artifactWindowState.isOpen}
            artifactWindowCollapsed={artifactWindowState.isCollapsed}
            onToggleArtifactWindow={artifactWindowState.toggleWindow}
            onToggleArtifactCollapse={artifactWindowState.toggleCollapse}
            forceSessionHistoryCollapsed={forceSessionHistoryCollapsed}
            forceScrollToBottom={forceScrollToBottom}
            isSessionLoading={isSessionLoading}
            onSessionHistoryToggle={(expanded) => {
              // Reset force collapsed state when user manually expands
              if (expanded) {
                setForceSessionHistoryCollapsed(false);
              }
              
              // If session history is being expanded and we're on mobile, collapse artifact window
              if (expanded && window.innerWidth <= 768 && artifactWindowState.isOpen) {
                artifactWindowState.closeWindow();
              }
            }}
          />
        </div>

        {/* Agent Selector Modal */}
        <AgentSelector
          isOpen={showAgentSelector}
          onClose={() => setShowAgentSelector(false)}
          sessionId={currentSessionId || 'preview'}
          supabaseUserId={userId || ''}
          currentAgent={currentAgent}
          onAgentChanged={onAgentChanged}
          hasProperAccountSetup={isAuthenticated} // Enable premium agents for authenticated users until billing system is implemented
          isAuthenticated={isAuthenticated}
        />
      </IonContent>

      {/* Footer outside of IonContent for better MCP browser compatibility */}
      <HomeFooter 
        currentRfp={currentRfp ?? null} 
        onViewBids={handleViewBids}
        onClearRfpContext={() => clearGlobalRFPContext()}
        onRfpChange={async (rfpId: number) => {
          console.log('RFP selected from dropdown:', rfpId);
          await handleSetCurrentRfp(rfpId);
          
          // Update the current session's RFP context
          if (currentSessionId) {
            try {
              await DatabaseService.updateSessionContext(currentSessionId, { current_rfp_id: rfpId });
              console.log('✅ Session RFP context updated:', { sessionId: currentSessionId, rfpId });
            } catch (error) {
              console.error('❌ Failed to update session RFP context:', error);
            }
          }
        }}
      />

      {/* Debug toggle for development testing */}
      <ClickableDebugToggle 
        className="debug-toggle"
        style={{ 
          position: 'fixed', 
          bottom: '10px', 
          right: '10px', 
          zIndex: 9999 
        }}
      />

      {/* Modals */}
      <AgentEditModal
        agent={editingAgent}
        isOpen={showAgentModal}
        onSave={handleSaveAgent}
        onCancel={handleCancelAgent}
      />
      
      <RFPEditModal
        rfp={editingRFP}
        isOpen={showRFPModal}
        onSave={handleSaveRFP}
        onCancel={handleCancelRFP}
      />
      
      <RFPPreviewModal
        isOpen={showRFPPreviewModal}
        onClose={handleClosePreview}
        rfp={previewingRFP}
      />
    </IonPage>
  );
};

export default Home;
