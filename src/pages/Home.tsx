// Copyright Mark Skiba, 2025 All rights reserved

import React, { useEffect, useState, useCallback } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useSupabase } from '../context/SupabaseContext';
import DatabaseService from '../services/database';
import { Message, ArtifactReference, Artifact } from '../types/home';
import { SessionActiveAgent } from '../types/database';
import { DocxExporter } from '../utils/docxExporter';
import type { FormSpec } from '../types/rfp';

// Import all our custom hooks
import { useHomeState } from '../hooks/useHomeState';
import { useSessionState } from '../hooks/useSessionState';
import { useAgentManagement } from '../hooks/useAgentManagement';
import { useRFPManagement } from '../hooks/useRFPManagement';
import { useArtifactManagement } from '../hooks/useArtifactManagement';
import { useArtifactWindowState } from '../hooks/useArtifactWindowState';
import { useMessageHandling } from '../hooks/useMessageHandling';

// Import test functions for debugging
import '../test-claude-functions';
import { AbortControllerMonitor } from '../utils/abortControllerMonitor';

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
  
  // Initialize AbortController monitoring for debugging
  useEffect(() => {
    console.log('🔧 Initializing AbortController monitoring for debugging');
    AbortControllerMonitor.instance.startMonitoring();
    
    // Add global debug functions
    (window as typeof window & {
      debugAborts?: () => void;
      viewAbortLogs?: () => unknown[];
      clearAbortLogs?: () => void;
    }).debugAborts = () => {
      console.log('🔍 Manual abort debug check triggered');
      AbortControllerMonitor.instance.printReport();
    };
    
    (window as typeof window & {
      debugAborts?: () => void;
      viewAbortLogs?: () => unknown[];
      clearAbortLogs?: () => void;
    }).viewAbortLogs = () => {
      try {
        const logs = JSON.parse(localStorage.getItem('abortLogs') || '[]');
        console.group('📊 PERSISTENT ABORT LOGS');
        console.log('Total stored abort events:', logs.length);
        logs.forEach((log: Record<string, unknown>, index: number) => {
          console.group(`🚨 Abort #${index + 1} (${new Date(String(log.timestamp)).toLocaleString()})`);
          console.log('Request ID:', log.requestId);
          console.log('Duration before abort:', log.duration + 'ms');
          console.log('Reason:', log.reason);
          console.log('Message:', log.messageContent);
          console.log('Agent:', log.agentName);
          console.log('Controller matches:', log.controllerMatches);
          console.log('URL:', log.url);
          console.log('Stack trace:', log.stackTrace);
          console.groupEnd();
        });
        console.groupEnd();
        return logs;
      } catch (error) {
        console.error('❌ Failed to read abort logs:', error);
        return [];
      }
    };
    
    (window as typeof window & {
      debugAborts?: () => void;
      viewAbortLogs?: () => unknown[];
      clearAbortLogs?: () => void;
    }).clearAbortLogs = () => {
      localStorage.removeItem('abortLogs');
      console.log('🧹 Cleared persistent abort logs');
    };
    
    return () => {
      AbortControllerMonitor.instance.stopMonitoring();
    };
  }, []);
  
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
    setCurrentSessionId
  } = useHomeState();

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
  } = useRFPManagement(currentSessionId);

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
    currentRfp, 
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

  const { handleSendMessage, sendAutoPrompt, cancelRequest } = useMessageHandling();

  // Main menu handler
  const handleMainMenuSelect = (item: string) => {
    if (item === 'Agents') setShowAgentsMenu(true);
    if (item === 'RFP') setShowRFPMenu(true);
    if (item === 'Debug') history.push('/debug');
  };

  // Define handleSelectSession before useEffects that call it
  const handleSelectSession = useCallback(async (sessionId: string) => {
    console.log('Session selected:', sessionId);
    
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
      const sessionWithContext = await DatabaseService.getSessionWithContext(sessionId);
      
      // Restore RFP context if it exists
      if (sessionWithContext?.current_rfp_id) {
        console.log('🎯 Restoring RFP context from session:', sessionWithContext.current_rfp_id);
        await handleSetCurrentRfp(sessionWithContext.current_rfp_id);
      } else {
        console.log('📝 No RFP context found in session');
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

  // Load user sessions on mount if authenticated
  useEffect(() => {
    console.log('Auth state:', { isAuthenticated, supabaseLoading, user: !!user, userProfile: !!userProfile });
    
    // If user logs out (no session), clear UI state and show default agent
    if (!isAuthenticated && !supabaseLoading) {
      console.log('User not authenticated, clearing UI state and loading default agent...');
      clearUIState();
      clearArtifacts();
      loadDefaultAgentWithPrompt().then(initialMessage => {
        if (initialMessage) {
          setMessages([initialMessage]);
        }
      });
      return;
    }
    
    // Always load default agent and show initial prompt, regardless of authentication
    if (!supabaseLoading) {
      console.log('Loading default agent for all users...');
      loadDefaultAgentWithPrompt().then(initialMessage => {
        if (initialMessage && messages.length === 0) {
          setMessages([initialMessage]);
        }
      });
    }
    
    // Check if we have basic authentication (session and user) for loading sessions
    if (isAuthenticated && !supabaseLoading && user) {
      console.log('User is authenticated, loading sessions...');
      loadUserSessions();
    }
  }, [isAuthenticated, supabaseLoading, user, userProfile]);

  // Separate useEffect to handle session restoration after sessions are loaded
  useEffect(() => {
    console.log('Session restoration check:', { 
      isAuthenticated, 
      sessionsCount: sessions.length, 
      currentSessionId: !!currentSessionId 
    });
    
    if (isAuthenticated && sessions.length > 0 && !currentSessionId) {
      // Try to restore last session if available
      const lastSessionId = artifactWindowState.getLastSession();
      console.log('Attempting to restore last session:', lastSessionId);
      
      if (lastSessionId) {
        const session = sessions.find(s => s.id === lastSessionId);
        if (session) {
          console.log('Restoring last session:', lastSessionId);
          handleSelectSession(lastSessionId);
        } else {
          console.log('Last session not found in current sessions list');
        }
      } else {
        console.log('No last session found in localStorage');
      }
    }
  }, [sessions, isAuthenticated, currentSessionId, handleSelectSession]);

  // Monitor session changes specifically for logout detection
  useEffect(() => {
    if (!session && !supabaseLoading) {
      console.log('Session removed - user logged out, clearing UI state');
      clearUIState();
      clearArtifacts();
      loadDefaultAgentWithPrompt().then(initialMessage => {
        if (initialMessage) {
          setMessages([initialMessage]);
        }
      });
    }
  }, [session, supabaseLoading]);

  // Listen for RFP refresh messages from Claude functions
  useEffect(() => {
    const handleRfpRefreshMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'REFRESH_CURRENT_RFP') {
        console.log('🔄 Received RFP refresh request from Claude function');
        
        // Reload the current session's RFP context from the database
        if (currentSessionId) {
          try {
            console.log('📊 Reloading session RFP context for session:', currentSessionId);
            const sessionWithContext = await DatabaseService.getSessionWithContext(currentSessionId);
            
            if (sessionWithContext?.current_rfp_id) {
              console.log('🎯 Refreshing RFP context from session:', sessionWithContext.current_rfp_id);
              await handleSetCurrentRfp(sessionWithContext.current_rfp_id);
              console.log('✅ RFP context refreshed successfully');
            } else {
              console.log('📝 No RFP context found in session after refresh');
              handleClearCurrentRfp();
            }
          } catch (error) {
            console.warn('⚠️ Failed to refresh session RFP context:', error);
          }
        } else {
          console.log('⚠️ No current session to refresh RFP context for');
        }
      }
    };

    window.addEventListener('message', handleRfpRefreshMessage);
    return () => window.removeEventListener('message', handleRfpRefreshMessage);
  }, [currentSessionId, handleSetCurrentRfp, handleClearCurrentRfp]);

  // Load active agent when session changes - but only if not already handled by handleSelectSession
  useEffect(() => {
    if (currentSessionId && userId) {
      // Only load agent - artifacts and messages are handled by handleSelectSession
      loadSessionAgent(currentSessionId);
    } else if (!currentSessionId && isAuthenticated && userId && messages.length === 0) {
      loadDefaultAgentWithPrompt().then(initialMessage => {
        if (initialMessage) {
          setMessages([initialMessage]);
        }
      });
    }
  }, [currentSessionId, userId, isAuthenticated]);

  const handleNewSession = async () => {
    // Clear the UI state
    setMessages([]);
    clearArtifacts();
    setSelectedSessionId(undefined);
    setCurrentSessionId(undefined);
    
    // Reset artifact window for new session (blank state, closed)
    artifactWindowState.resetForNewSession();
    artifactWindowState.saveLastSession(null);
    setForceSessionHistoryCollapsed(false);
    
    // Use the currently selected agent, or default if none selected
    if (isAuthenticated && userId) {
      if (currentAgent) {
        const initialMessage: Message = {
          id: 'initial-prompt',
          content: currentAgent.agent_initial_prompt,
          isUser: false,
          timestamp: new Date(),
          agentName: currentAgent.agent_name
        };
        setMessages([initialMessage]);
        console.log('New session started with current agent:', currentAgent.agent_name);
      } else {
        const initialMessage = await loadDefaultAgentWithPrompt();
        if (initialMessage) {
          setMessages([initialMessage]);
        }
      }
    } else {
      const initialMessage = await loadDefaultAgentWithPrompt();
      if (initialMessage) {
        setMessages([initialMessage]);
      }
    }
    
    console.log('New session started with initial prompt displayed');
  };

  const handleDeleteSession = async (sessionId: string) => {
    const success = await deleteSession(sessionId);
    if (success && currentSessionId === sessionId) {
      setMessages([]);
      clearArtifacts();
      setSelectedSessionId(undefined);
      setCurrentSessionId(undefined);
    }
  };

  const onSendMessage = async (content: string) => {
    // IMMEDIATE DEBUG - Add visual overlay to confirm this function is called
    console.error('🌟🌟🌟 ON_SEND_MESSAGE CALLED IN HOME.TSX:', content);
    const homeDebug = document.createElement('div');
    homeDebug.style.cssText = 'position:fixed;top:75px;left:0;background:yellow;color:black;padding:5px;z-index:99999;font-weight:bold;';
    homeDebug.innerHTML = `🌟 HOME ON_SEND_MESSAGE: ${content.substring(0, 30)}`;
    document.body.appendChild(homeDebug);
    
    await handleSendMessage(
      content,
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
      currentRfp,
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
      selectedArtifact // Add current artifact context
    );
  };

  const handleArtifactSelect = (artifactRef: ArtifactReference) => {
    console.log('Artifact selected:', artifactRef);
    console.log('Available artifacts:', artifacts.map(a => ({ id: a.id, name: a.name, type: a.type })));
    
    // Find the artifact by ID and select it
    const artifact = artifacts.find(a => a.id === artifactRef.artifactId);
    if (artifact) {
      selectArtifact(artifact.id);
      artifactWindowState.selectArtifact(artifact.id);
      artifactWindowState.openWindow();
      artifactWindowState.expandWindow();
      console.log('Selected artifact for display:', artifact.name);
    } else {
      console.warn('❌ Artifact not found in artifacts array:', artifactRef.artifactId);
      console.log('🔍 This suggests the artifact reference exists but the actual artifact data was not created/stored properly');
      
      // Try to show a helpful message to the user
      alert(`Artifact "${artifactRef.artifactName}" could not be loaded. Please try recreating it.`);
    }
  };

  const onAgentChanged = async (newAgent: SessionActiveAgent) => {
    const agentMessage = await handleAgentChanged(newAgent);
    if (agentMessage) {
      setMessages((prev: Message[]) => [...prev, agentMessage]);
    }
  };

  // Handler for viewing bids - creates and displays a bid view artifact
  const handleViewBids = () => {
    if (!currentRfp) {
      console.warn('No current RFP selected');
      return;
    }

    // Create a bid view artifact
    const bidViewArtifact: Artifact = {
      id: `bid-view-${currentRfp.id}-${Date.now()}`,
      name: `Bids for ${currentRfp.name}`,
      type: 'bid_view',
      size: '0 KB',
      content: currentRfp.name, // Pass RFP name as content
      rfpId: currentRfp.id,
      role: 'buyer'
    };

    console.log('Creating bid view artifact:', bidViewArtifact.id);

    // Add artifact to state
    setArtifacts((prev: Artifact[]) => {
      const existing = prev.find(a => a.id === bidViewArtifact.id);
      if (existing) {
        return prev;
      }
      return [...prev, bidViewArtifact];
    });

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
        
      alert('Form submitted successfully!');
        
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
        currentRfp,
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
        }
      );
      
    } catch (error) {
      console.error('❌ Error submitting form:', error);
      alert('An error occurred while submitting the questionnaire.');
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
              alert('Error converting document to Word format. The document will be downloaded as a text file instead.');
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
            
            alert(
              'This form artifact does not contain a valid form schema. ' +
              'The artifact appears to contain metadata or raw form data instead of a structured form definition. ' +
              'Please check that this is a properly formatted form artifact.'
            );
            return;
          }
        } catch (jsonError) {
          // If JSON parsing fails and it's a form, show error
          if (artifact.type === 'form') {
            console.warn('⚠️ Form artifact has invalid JSON content');
            alert('This form artifact appears to be empty or contains invalid data.');
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
              alert('Error converting document to Word format. The document will be downloaded as a text file instead.');
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
        alert('This artifact does not have downloadable content.');
      }
      
    } catch (error) {
      console.error('❌ Error downloading artifact:', error);
      alert('An error occurred while downloading the artifact. Please try again.');
    }
  };

  return (
    <IonPage>
      <HomeHeader
        userProfile={userProfile}
        isAuthenticated={isAuthenticated}
        user={user}
        rfps={rfps}
        currentRfpId={currentRfpId}
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
            currentRfpId={currentRfpId}
            onDownloadArtifact={handleDownloadArtifact}
            onArtifactSelect={handleArtifactSelect}
            onFormSubmit={handleFormSubmissionWithAutoPrompt}
            currentAgent={currentAgent}
            onCancelRequest={cancelRequest}
            // New artifact window state props
            artifactWindowOpen={artifactWindowState.isOpen}
            artifactWindowCollapsed={artifactWindowState.isCollapsed}
            onToggleArtifactWindow={artifactWindowState.toggleWindow}
            onToggleArtifactCollapse={artifactWindowState.toggleCollapse}
            forceSessionHistoryCollapsed={forceSessionHistoryCollapsed}
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
          hasProperAccountSetup={false}
          isAuthenticated={isAuthenticated}
        />
      </IonContent>

      {/* Footer outside of IonContent for better MCP browser compatibility */}
      <HomeFooter 
        currentRfp={currentRfp} 
        onViewBids={handleViewBids}
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
