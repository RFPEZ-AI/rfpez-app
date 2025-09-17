// Copyright Mark Skiba, 2025 All rights reserved

import React, { useEffect, useState } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useSupabase } from '../context/SupabaseContext';
import { UserContextService } from '../services/userContextService';
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
  } = useAgentManagement();

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
  } = useRFPManagement(userId);

  const {
    artifacts,
    selectedArtifact,
    selectArtifact,
    setSelectedArtifactFromState,
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
    }
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
    if (isAuthenticated && sessions.length > 0 && !currentSessionId) {
      // Try to restore last session if available
      const lastSessionId = artifactWindowState.getLastSession();
      if (lastSessionId) {
        const session = sessions.find(s => s.id === lastSessionId);
        if (session) {
          console.log('Restoring last session:', lastSessionId);
          handleSelectSession(lastSessionId);
        }
      }
    }
  }, [sessions, isAuthenticated, currentSessionId]);

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
    const handleRfpRefreshMessage = (event: MessageEvent) => {
      if (event.data?.type === 'REFRESH_CURRENT_RFP') {
        console.log('🔄 Received RFP refresh request from Claude function');
        // Trigger a refresh of the current RFP context
        if (userId) {
          // Force reload the current RFP context by calling the hook's load function
          const refreshRfpContext = async () => {
            try {
              const currentRfp = await UserContextService.getCurrentRfp(userId);
              if (currentRfp) {
                handleSetCurrentRfp(currentRfp.id);
                console.log('✅ RFP context refreshed from database:', currentRfp.name);
              } else {
                handleClearCurrentRfp();
                console.log('✅ RFP context cleared (no current RFP in database)');
              }
            } catch (error) {
              console.error('❌ Failed to refresh RFP context:', error);
            }
          };
          refreshRfpContext();
        }
      }
    };

    window.addEventListener('message', handleRfpRefreshMessage);
    return () => window.removeEventListener('message', handleRfpRefreshMessage);
  }, [userId, handleSetCurrentRfp, handleClearCurrentRfp]);

  // Load active agent when session changes
  useEffect(() => {
    if (currentSessionId && userId) {
      loadSessionAgent(currentSessionId);
      loadSessionArtifacts(currentSessionId);
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

  const handleSelectSession = async (sessionId: string) => {
    console.log('Session selected:', sessionId);
    setSelectedSessionId(sessionId);
    setCurrentSessionId(sessionId);
    
    // Save as last session for persistence
    artifactWindowState.saveLastSession(sessionId);
    
    await loadSessionMessages(sessionId);
    const sessionArtifacts = await loadSessionArtifacts(sessionId);
    
    // Try to restore the last selected artifact for this session
    const restoredArtifactId = artifactWindowState.restoreSessionArtifact(sessionId);
    
    if (restoredArtifactId && sessionArtifacts?.some(a => a.id === restoredArtifactId)) {
      // If we found a valid saved artifact, use it
      setSelectedArtifactFromState(restoredArtifactId);
      console.log('Restored saved artifact:', restoredArtifactId);
    } else if (sessionArtifacts && sessionArtifacts.length > 0) {
      // Otherwise, fall back to the most recent artifact
      const mostRecentArtifact = sessionArtifacts.reduce((latest, current) => {
        return parseInt(current.id) > parseInt(latest.id) ? current : latest;
      });
      selectArtifact(mostRecentArtifact.id);
      console.log('Selected most recent artifact:', mostRecentArtifact.id);
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
        const agentMessage = handleAgentChanged(agent);
        return agentMessage;
      },
      selectedArtifact // Add current artifact context
    );
  };

  const handleArtifactSelect = (artifactRef: ArtifactReference) => {
    console.log('Artifact selected:', artifactRef);
    // Find the artifact by ID and select it
    const artifact = artifacts.find(a => a.id === artifactRef.artifactId);
    if (artifact) {
      selectArtifact(artifact.id);
      artifactWindowState.selectArtifact(artifact.id);
      artifactWindowState.openWindow();
      artifactWindowState.expandWindow();
      console.log('Selected artifact for display:', artifact.name);
    }
  };

  const onAgentChanged = (newAgent: SessionActiveAgent) => {
    const agentMessage = handleAgentChanged(newAgent);
    if (agentMessage) {
      setMessages((prev: Message[]) => [...prev, agentMessage]);
    }
  };

  // Form submission handler with auto-prompt
  const handleFormSubmissionWithAutoPrompt = async (artifact: Artifact, formData: Record<string, unknown>) => {
    console.log('=== FORM SUBMISSION WITH AUTO-PROMPT ===');
    console.log('Artifact name:', artifact.name);
    console.log('Form data:', formData);
    
    try {
      // Use currentRfpId from props
      if (!currentRfpId) {
        console.error('❌ No RFP context available');
        alert('No RFP context available. Please select an RFP first.');
        return;
      }

      console.log('📤 Updating RFP using RFPService...');
      
      // Save the form response to the database using RFP service
      const { RFPService } = await import('../services/rfpService');
      const updatedRfp = await RFPService.update(currentRfpId, {
        buyer_questionnaire_response: formData
      });

      if (updatedRfp) {
        console.log('✅ Form response saved successfully');
        
        // Also save to artifact_submissions table for persistence across sessions
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
          // Continue - this is not critical for the main functionality
        }
        
        alert('Questionnaire submitted successfully!');
        
        // Send auto-prompt after successful submission
        const formName = artifact.name || 'Form';
        console.log('📤 Sending auto-prompt for form:', formName);
        
        await sendAutoPrompt(
          formName,
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
            const agentMessage = handleAgentChanged(agent);
            return agentMessage;
          }
        );
      } else {
        console.error('❌ Failed to save form response - RFPService.update returned null');
        alert('Failed to save questionnaire response. Please try again.');
      }
      
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
                // This is a buyer questionnaire - get buyer_questionnaire_response
                responseData = (currentRfp.buyer_questionnaire_response as Record<string, unknown>) || {};
                console.log('Using buyer questionnaire response data:', responseData);
              } else if (artifact.name.toLowerCase().includes('bid') || 
                        artifact.name.toLowerCase().includes('supplier') ||
                        artifact.id.startsWith('bid-form-')) {
                // This is a bid form - check if we have bid responses (this would be in a separate table)
                // For now, use the form defaults as bid responses aren't stored in the RFP record
                responseData = formData.formData || {};
                console.log('Using form defaults for bid form (no submitted responses available)');
              } else {
                // Unknown form type, try buyer response first, then defaults
                responseData = (currentRfp.buyer_questionnaire_response as Record<string, unknown>) || formData.formData || {};
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
        <div style={{ 
          height: '100vh',
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
      <HomeFooter currentRfp={currentRfp} />

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
