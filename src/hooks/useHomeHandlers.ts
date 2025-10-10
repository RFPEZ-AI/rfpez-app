// Copyright Mark Skiba, 2025 All rights reserved

import { useCallback, useRef, Dispatch, SetStateAction } from 'react';
import DatabaseService from '../services/database';
import { ArtifactService } from '../services/artifactService';
import { ArtifactDownloadService } from '../services/artifactDownloadService';
import type { 
  Message, 
  Artifact, 
  ArtifactReference 
} from '../types/home';
import type { SessionActiveAgent } from '../types/database';
import type { RFP } from '../types/rfp';

interface UseHomeHandlersParams {
  currentSessionId: string | undefined;
  setCurrentSessionId: Dispatch<SetStateAction<string | undefined>>;
  setSelectedSessionId: Dispatch<SetStateAction<string | undefined>>;
  isCreatingNewSession: boolean;
  setIsCreatingNewSession: Dispatch<SetStateAction<boolean>>;
  setIsSessionLoading: Dispatch<SetStateAction<boolean>>;
  setForceSessionHistoryCollapsed: Dispatch<SetStateAction<boolean>>;
  setForceScrollToBottom: Dispatch<SetStateAction<boolean>>;
  isAuthenticated: boolean;
  userId: string | undefined;
  user: { id: string } | null;
  userProfile: unknown;
  messages: Message[];
  setMessages: Dispatch<SetStateAction<Message[]>>;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  currentAgent: SessionActiveAgent | null;
  currentRfp: RFP | null;
  currentRfpId: number | null;
  globalCurrentRfpId: number | null;
  artifacts: Artifact[];
  setArtifacts: Dispatch<SetStateAction<Artifact[]>>;
  selectedArtifact: string | null;
  
  // Hook functions
  loadSessionMessages: (sessionId: string) => Promise<void>;
  loadSessionAgent: (sessionId: string) => Promise<void>;
  loadSessionArtifacts: (sessionId: string) => Promise<Artifact[] | undefined>;
  deleteSession: (sessionId: string) => Promise<boolean>;
  clearUIState: () => void;
  clearArtifacts: () => void;
  createNewSession: ((agent: SessionActiveAgent | null, initialRfpId?: number) => Promise<string | undefined>) | null;
  loadUserSessions: (() => Promise<void>) | null;
  loadDefaultAgentWithPrompt: () => Promise<Message | null>;
  handleAgentChanged: (agent: SessionActiveAgent) => Promise<Message | null>;
  addClaudeArtifacts: (artifactRefs: ArtifactReference[], messageId?: string) => Promise<void>;
  selectArtifact: (artifactId: string) => void;
  handleSetCurrentRfp: (rfpId: number, rfpData?: RFP, forceGlobal?: boolean) => Promise<void>;
  handleSendMessage: (
    content: string,
    messages: Message[],
    setMessages: Dispatch<SetStateAction<Message[]>>,
    setIsLoading: Dispatch<SetStateAction<boolean>>,
    sessionId: string | undefined,
    setCurrentSessionId: Dispatch<SetStateAction<string | undefined>>,
    setSelectedSessionId: Dispatch<SetStateAction<string | undefined>>,
    createNewSession: ((agent: SessionActiveAgent | null, initialRfpId?: number) => Promise<string | undefined>) | null,
    loadUserSessions: (() => Promise<void>) | null,
    isAuthenticated: boolean,
    userId: string | undefined,
    currentAgent: SessionActiveAgent | null,
    userProfile: unknown,
    currentRfp: RFP | null,
    addClaudeArtifacts: (artifactRefs: ArtifactReference[], messageId?: string) => Promise<void>,
    loadSessionAgent: (sessionId: string) => Promise<void>,
    onAgentChanged: (agent: SessionActiveAgent) => null,
    loadSessionArtifacts: (sessionId: string) => Promise<Artifact[] | undefined>,
    selectedArtifact: string | null
  ) => Promise<void>;
  sendAutoPrompt: (
    formName: string,
    formData: Record<string, unknown>,
    messages: Message[],
    setMessages: Dispatch<SetStateAction<Message[]>>,
    setIsLoading: Dispatch<SetStateAction<boolean>>,
    sessionId: string | undefined,
    setCurrentSessionId: Dispatch<SetStateAction<string | undefined>>,
    setSelectedSessionId: Dispatch<SetStateAction<string | undefined>>,
    createNewSession: ((agent: SessionActiveAgent | null, initialRfpId?: number) => Promise<string | undefined>) | null,
    loadUserSessions: (() => Promise<void>) | null,
    isAuthenticated: boolean,
    userId: string | undefined,
    currentAgent: SessionActiveAgent | null,
    userProfile: unknown,
    currentRfp: RFP | null,
    addClaudeArtifacts: (artifactRefs: ArtifactReference[], messageId?: string) => Promise<void>,
    loadSessionAgent: (sessionId: string) => Promise<void>,
    onAgentChanged: (agent: SessionActiveAgent) => null,
    loadSessionArtifacts: (sessionId: string) => Promise<Artifact[] | undefined>
  ) => Promise<void>;
  
  // Artifact window state
  artifactWindowState: {
    isOpen: boolean;
    isCollapsed: boolean;
    selectArtifact: (artifactId: string | null) => void;
    openWindow: () => void;
    expandWindow: () => void;
    closeWindow: () => void;
    saveLastSession: (sessionId: string) => void;
    saveSessionArtifact: (sessionId: string, artifactId: string | null) => void;
    restoreSessionArtifact: (sessionId: string) => string | null;
  };
  
  setSelectedArtifactFromState: (artifactId: string) => void;
  loadToolInvocationsForSession: (sessionId: string) => void;
}

export const useHomeHandlers = (params: UseHomeHandlersParams) => {
  const {
    currentSessionId,
    setCurrentSessionId,
    setSelectedSessionId,
    isCreatingNewSession,
    setIsCreatingNewSession,
    setIsSessionLoading,
    setForceSessionHistoryCollapsed,
    setForceScrollToBottom,
    isAuthenticated,
    userId,
    user,
    messages,
    setMessages,
    setIsLoading,
    currentAgent,
    currentRfp,
    currentRfpId,
    globalCurrentRfpId,
    artifacts,
    setArtifacts,
    selectedArtifact,
    loadSessionMessages,
    loadSessionAgent,
    loadSessionArtifacts,
    deleteSession,
    // clearUIState, // Unused - commented out to fix lint warning
    clearArtifacts,
    createNewSession,
    loadUserSessions,
    loadDefaultAgentWithPrompt,
    handleAgentChanged,
    addClaudeArtifacts,
    selectArtifact,
    handleSetCurrentRfp,
    handleSendMessage,
    sendAutoPrompt,
    artifactWindowState,
    setSelectedArtifactFromState,
    loadToolInvocationsForSession,
    userProfile
  } = params;

  // CRITICAL FIX: Use ref to keep session ID synchronized and avoid stale closures
  const currentSessionIdRef = useRef<string | undefined>(currentSessionId);
  
  // Keep ref synchronized with state
  if (currentSessionIdRef.current !== currentSessionId) {
    currentSessionIdRef.current = currentSessionId;
  }

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
    setSelectedArtifactFromState,
    setIsCreatingNewSession,
    setIsSessionLoading,
    setForceSessionHistoryCollapsed,
    setForceScrollToBottom,
    loadToolInvocationsForSession
  ]);

  const handleNewSession = async () => {
    console.log('Creating new session...');
    
    // Set flag to indicate we're creating a new session (prevents auto-restore)
    setIsCreatingNewSession(true);
    
    // Clear UI state
    setMessages([]);
    clearArtifacts();
    setSelectedSessionId(undefined);
    setCurrentSessionId(undefined);
    // CRITICAL: Clear ref as well
    currentSessionIdRef.current = undefined;
    console.log('📌 Session ID ref cleared for new session');
    
    try {
      // Only create a session if authenticated
      if (isAuthenticated && userId && createNewSession) {
        console.log('Creating authenticated session with global RFP context:', globalCurrentRfpId);
        
        // Create the session with global RFP context if available
        const newSessionId = await createNewSession(currentAgent, globalCurrentRfpId ?? undefined);
        
        if (newSessionId) {
          setCurrentSessionId(newSessionId);
          setSelectedSessionId(newSessionId);
          // CRITICAL: Update ref immediately for synchronous access
          currentSessionIdRef.current = newSessionId;
          console.log('📌 Session ID ref updated for new session:', newSessionId);
          
          // Save as last session for persistence
          artifactWindowState.saveLastSession(newSessionId);
          
          // Update user profile with current session ID
          try {
            await DatabaseService.setUserCurrentSession(newSessionId);
            console.log('✅ New session saved to user profile:', newSessionId);
          } catch (error) {
            console.warn('⚠️ Failed to save new session to user profile:', error);
          }
          
          // Reload sessions to include the new session
          if (loadUserSessions) {
            await loadUserSessions();
          }
          
          // Load default agent with initial prompt for fresh start
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
    await ArtifactDownloadService.downloadArtifact(artifact, currentRfp, addSystemMessage);
  };

  return {
    handleSelectSession,
    handleNewSession,
    handleDeleteSession,
    onSendMessage,
    handleArtifactSelect,
    onAgentChanged,
    handleViewBids,
    handleFormSave,
    handleFormSubmissionWithAutoPrompt,
    handleDownloadArtifact,
    addSystemMessage
  };
};
