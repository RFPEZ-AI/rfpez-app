import React, { useState, useEffect } from 'react';
import { IonContent, IonHeader, IonPage, IonToolbar, IonButtons } from '@ionic/react';
import AuthButtons from '../components/AuthButtons';
import SessionHistory from '../components/SessionHistory';
import SessionDialog from '../components/SessionDialog';
import ArtifactWindow from '../components/ArtifactWindow';
import AgentSelector from '../components/AgentSelector';
import AgentIndicator from '../components/AgentIndicator';
import { useSupabase } from '../context/SupabaseContext';
import { useIsMobile } from '../utils/useMediaQuery';
import DatabaseService from '../services/database';
import { AgentService } from '../services/agentService';
import type { SessionActiveAgent } from '../types/database';

// Local interfaces for UI compatibility
interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  agentName?: string; // Agent name for assistant messages
}

interface Session {
  id: string;
  title: string;
  timestamp: Date;
  agent_name?: string; // Name of the active agent for this session
}

interface Artifact {
  id: string;
  name: string;
  type: 'document' | 'image' | 'pdf' | 'other';
  size: string;
  url?: string;
  content?: string;
}

const Home: React.FC = () => {
  const { user, session, loading: supabaseLoading, userProfile } = useSupabase();
  const isMobile = useIsMobile();
  
  // Derived authentication state
  const isAuthenticated = !!session;
  const userId = user?.id;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>();
  const [currentSessionId, setCurrentSessionId] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  
  // Agent-related state
  const [currentAgent, setCurrentAgent] = useState<SessionActiveAgent | null>(null);
  const [showAgentSelector, setShowAgentSelector] = useState(false);

  // Load user sessions on mount if authenticated
  useEffect(() => {
    console.log('Auth state:', { isAuthenticated, supabaseLoading, user: !!user, userProfile: !!userProfile });
    console.log('Session details:', session);
    console.log('User details:', user);
    console.log('UserProfile details:', userProfile);
    
    // Always load default agent and show initial prompt, regardless of authentication
    if (!supabaseLoading) {
      console.log('Loading default agent for all users...');
      loadDefaultAgentWithPrompt();
    }
    
    // Check if we have basic authentication (session and user) for loading sessions
    if (isAuthenticated && !supabaseLoading && user) {
      console.log('User is authenticated, loading sessions...');
      loadUserSessions();
      
      // If we don't have a user profile yet, that's OK - the profile loading might be in progress
      if (!userProfile) {
        console.log('User profile not loaded yet, but proceeding with authenticated state');
      }
    } else {
      console.log('Not loading sessions because:', {
        isAuthenticated,
        supabaseLoading,
        hasUser: !!user,
        hasUserProfile: !!userProfile
      });
    }
  }, [isAuthenticated, supabaseLoading, user, userProfile]);

  // Load active agent when session changes
  useEffect(() => {
    if (currentSessionId && userId) {
      loadSessionAgent(currentSessionId);
    } else if (!currentSessionId && isAuthenticated && userId && messages.length === 0) {
      // Load default agent with initial prompt only if no messages yet
      loadDefaultAgentWithPrompt();
    }
  }, [currentSessionId, userId, isAuthenticated]);

  // Agent-related functions
  const loadDefaultAgentWithPrompt = async () => {
    try {
      const defaultAgent = await AgentService.getDefaultAgent();
      if (defaultAgent) {
        const sessionActiveAgent: SessionActiveAgent = {
          agent_id: defaultAgent.id,
          agent_name: defaultAgent.name,
          agent_instructions: defaultAgent.instructions,
          agent_initial_prompt: defaultAgent.initial_prompt,
          agent_avatar_url: defaultAgent.avatar_url
        };
        setCurrentAgent(sessionActiveAgent);
        console.log('Loaded default agent with prompt:', sessionActiveAgent);

        // Display the initial prompt to start the conversation
        const initialMessage: Message = {
          id: 'initial-prompt',
          content: defaultAgent.initial_prompt,
          isUser: false,
          timestamp: new Date(),
          agentName: defaultAgent.name
        };
        setMessages([initialMessage]);
        console.log('Displayed initial prompt:', defaultAgent.initial_prompt);
      }
    } catch (error) {
      console.error('Failed to load default agent with prompt:', error);
    }
  };

  const loadSessionAgent = async (sessionId: string) => {
    try {
      const agent = await AgentService.getSessionActiveAgent(sessionId);
      setCurrentAgent(agent);
      console.log('Loaded session agent:', agent);
    } catch (error) {
      console.error('Failed to load session agent:', error);
    }
  };

  const handleAgentChanged = (newAgent: SessionActiveAgent) => {
    setCurrentAgent(newAgent);
    console.log('Agent changed to:', newAgent);
    
    // If we're not in an active session (preview mode), update the initial message
    if (!currentSessionId && messages.length <= 1) {
      const initialMessage: Message = {
        id: 'initial-prompt',
        content: newAgent.agent_initial_prompt,
        isUser: false,
        timestamp: new Date(),
        agentName: newAgent.agent_name
      };
      setMessages([initialMessage]);
    }
  };

  const handleShowAgentSelector = () => {
    setShowAgentSelector(true);
  };

  // Load sessions from Supabase
  const loadUserSessions = async () => {
    if (!isAuthenticated || !userId) {
      console.log('User not authenticated or userId not available, skipping session load');
      return;
    }
    
    try {
      console.log('Attempting to load sessions from Supabase for user:', userId);
      const sessionsData = await DatabaseService.getUserSessions(userId);
      console.log('Sessions loaded:', sessionsData);
      const formattedSessions: Session[] = sessionsData.map(session => ({
        id: session.id,
        title: session.title,
        timestamp: new Date(session.updated_at),
        agent_name: session.agent_name
      }));
      setSessions(formattedSessions);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  };

  // Load messages for a specific session
  const loadSessionMessages = async (sessionId: string) => {
    try {
      console.log('Loading messages for session:', sessionId);
      const messagesData = await DatabaseService.getSessionMessages(sessionId);
      console.log('Raw messages data:', messagesData);
      const formattedMessages: Message[] = messagesData
        .map(msg => ({
          id: msg.id,
          content: msg.content,
          isUser: msg.role === 'user',
          timestamp: new Date(msg.created_at),
          agentName: msg.agent_name // Include agent name from database
        }))
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()); // Ensure chronological order
      console.log('Formatted messages:', formattedMessages);
      setMessages(formattedMessages);
      
      // Load session artifacts
      const artifactsData = await DatabaseService.getSessionArtifacts(sessionId);
      const formattedArtifacts: Artifact[] = artifactsData.map(artifact => ({
        id: artifact.id,
        name: artifact.name,
        type: artifact.file_type as 'document' | 'image' | 'pdf' | 'other',
        size: artifact.file_size ? `${(artifact.file_size / 1024).toFixed(1)} KB` : 'Unknown'
      }));
      setArtifacts(formattedArtifacts);
    } catch (error) {
      console.error('Failed to load session messages:', error);
    }
  };

  // Create a new session in Supabase with current agent
  const createNewSession = async (): Promise<string | null> => {
    console.log('Creating new session, auth state:', { isAuthenticated, user: !!user, userProfile: !!userProfile });
    if (!isAuthenticated || !userId) {
      console.log('Not authenticated or userId not available, skipping session creation');
      return null;
    }
    
    try {
      console.log('Attempting to create session in Supabase with current agent:', currentAgent?.agent_id);
      const session = await DatabaseService.createSessionWithAgent(
        userId, 
        'New Chat Session',
        currentAgent?.agent_id // Use current agent if available
      );
      console.log('Session created:', session);
      if (session) {
        await loadUserSessions(); // Refresh sessions list
        return session.id;
      }
    } catch (error) {
      console.error('Failed to create session:', error);
    }
    return null;
  };

  const handleSendMessage = async (content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      isUser: true,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newMessage]);
    setIsLoading(true);

    let activeSessionId = currentSessionId;

    try {
      // For authenticated users, save to Supabase
      if (isAuthenticated && user) {
        console.log('Authenticated user sending message, currentSessionId:', activeSessionId);
        // Create session if none exists
        if (!activeSessionId) {
          console.log('No current session, creating new one...');
          const newSessionId = await createNewSession();
          if (newSessionId) {
            activeSessionId = newSessionId;
            setCurrentSessionId(newSessionId);
            setSelectedSessionId(newSessionId);
            console.log('New session created with ID:', newSessionId);
          }
        }

        // Save user message to database
        if (activeSessionId && userId) {
          console.log('Saving user message to session:', activeSessionId);
          const savedMessage = await DatabaseService.addMessage(
            activeSessionId, 
            userId, 
            content, 
            'user',
            currentAgent?.agent_id, // Include agent ID
            currentAgent?.agent_name // Include agent name
          );
          console.log('User message saved:', savedMessage);
          
          // Check if this is the first message in the session and update title
          const sessionMessages = await DatabaseService.getSessionMessages(activeSessionId);
          if (sessionMessages.length === 1) {
            // This is the first message, use it to generate a session title
            const sessionTitle = content.length > 50 ? content.substring(0, 47) + '...' : content;
            await DatabaseService.updateSession(activeSessionId, { title: sessionTitle });
            console.log('Updated session title to:', sessionTitle);
            // Refresh sessions list to show updated title
            await loadUserSessions();
          }
        } else {
          console.log('No session ID or user ID available, message not saved');
        }
      } else {
        console.log('User not authenticated, messages not saved to Supabase');
      }

      // Simulate AI response
      setTimeout(async () => {
        // Provide a contextual response based on whether this is a follow-up to the initial prompt
        const isFirstUserMessage = messages.length <= 2; // Initial prompt + user's first message
        
        let aiResponse: string;
        if (isFirstUserMessage && currentAgent?.agent_name === 'Solutions') {
          // First response from Solutions agent - acknowledge and ask follow-up
          aiResponse = "Great! I'd be happy to help you with competitive sourcing. Could you tell me more about what type of product or service you're looking to source? This will help me provide you with the most relevant guidance.";
        } else {
          // Default response for other situations
          aiResponse = "I understand your request. Let me help you with that. Could you provide more details so I can assist you better?";
        }
        
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: aiResponse,
          isUser: false,
          timestamp: new Date(),
          agentName: currentAgent?.agent_name
        };
        
        setMessages(prev => [...prev, aiMessage]);
        setIsLoading(false);

        // Save AI response to database if authenticated - use activeSessionId instead of currentSessionId
        if (isAuthenticated && userId && activeSessionId) {
          try {
            console.log('Saving AI response to session:', activeSessionId);
            const savedAiMessage = await DatabaseService.addMessage(
              activeSessionId, 
              userId, 
              aiResponse, 
              'assistant',
              currentAgent?.agent_id, // Include agent ID
              currentAgent?.agent_name // Include agent name
            );
            console.log('AI message saved:', savedAiMessage);
            await loadUserSessions(); // Refresh to update last message
          } catch (error) {
            console.error('Failed to save AI message:', error);
          }
        } else {
          console.log('AI response not saved - auth:', isAuthenticated, 'user:', !!user, 'sessionId:', activeSessionId);
        }
      }, 1500);
    } catch (error) {
      console.error('Failed to send message:', error);
      setIsLoading(false);
    }
  };

  const handleNewSession = async () => {
    // Clear the UI state
    setMessages([]);
    setArtifacts([]);
    setSelectedSessionId(undefined);
    setCurrentSessionId(undefined);
    
    // Use the currently selected agent, or default if none selected
    if (isAuthenticated && userId) {
      if (currentAgent) {
        // Use the currently selected agent for the new session
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
        // Fallback to default agent if no current agent is selected
        await loadDefaultAgentWithPrompt();
      }
    }
    
    console.log('New session started with initial prompt displayed');
  };

  const handleSelectSession = async (sessionId: string) => {
    console.log('Session selected:', sessionId);
    setSelectedSessionId(sessionId);
    setCurrentSessionId(sessionId);
    await loadSessionMessages(sessionId);
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!isAuthenticated || !userId) {
      console.log('Not authenticated, cannot delete session');
      return;
    }

    try {
      const success = await DatabaseService.deleteSession(sessionId);
      if (success) {
        console.log('Session deleted successfully:', sessionId);
        
        // If the deleted session was the current one, clear the UI
        if (currentSessionId === sessionId) {
          setMessages([]);
          setArtifacts([]);
          setSelectedSessionId(undefined);
          setCurrentSessionId(undefined);
        }
        
        // Refresh the sessions list
        await loadUserSessions();
      } else {
        console.error('Failed to delete session');
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const handleAttachFile = async (file: File) => {
    const newArtifact: Artifact = {
      id: Date.now().toString(),
      name: file.name,
      type: file.type.includes('pdf') ? 'pdf' : 'document',
      size: `${(file.size / 1024).toFixed(1)} KB`
    };
    setArtifacts(prev => [...prev, newArtifact]);

    // Save to Supabase if authenticated and session exists
    if (isAuthenticated && user && currentSessionId) {
      try {
        // Upload file to Supabase storage
        const storagePath = await DatabaseService.uploadFile(file, currentSessionId);
        if (storagePath) {
          await DatabaseService.addArtifact(
            currentSessionId,
            null, // Not linked to specific message
            file.name,
            file.type.includes('pdf') ? 'pdf' : 'document',
            file.size,
            storagePath,
            file.type
          );
        }
      } catch (error) {
        console.error('Failed to save artifact:', error);
      }
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          {/* Left section - Logo and title */}
          <div slot="start" style={{ display: 'flex', alignItems: 'center', padding: '0 8px' }}>
            <img 
              src="/logo.svg" 
              alt="RFPEZ.AI" 
              style={{ height: '32px', marginRight: isMobile ? '6px' : '12px' }}
            />
            {!isMobile && (
              <span style={{ fontSize: '18px', fontWeight: 'bold' }}>RFPEZ.AI</span>
            )}
            {isAuthenticated && user && userProfile && !isMobile && (
              <span style={{ 
                fontSize: '12px', 
                marginLeft: '12px', 
                padding: '4px 8px',
                backgroundColor: 'var(--ion-color-success)',
                color: 'white',
                borderRadius: '12px'
              }}>
                Saved
              </span>
            )}
          </div>
          
          {/* Center section - Agent Indicator */}
          <div style={{ 
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flex: 1,
            padding: '0 8px',
            minWidth: 0 // Allow shrinking
          }}>
            <div style={{ maxWidth: '100%' }}>
              <AgentIndicator
                agent={currentAgent}
                onSwitchAgent={handleShowAgentSelector}
                compact={true}
                showSwitchButton={true}
              />
            </div>
          </div>
          
          {/* Right section - Auth buttons */}
          <IonButtons slot="end">
            <AuthButtons />
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <div style={{ 
          height: 'calc(100vh - 56px)', 
          display: 'flex', 
          flexDirection: 'column' 
        }}>
          {/* Main Layout */}
          <div style={{ 
            flex: 1, 
            display: 'flex',
            overflow: 'hidden'
          }}>
            {/* Left Panel - Session History */}
            <SessionHistory
              sessions={sessions}
              onNewSession={handleNewSession}
              onSelectSession={handleSelectSession}
              onDeleteSession={handleDeleteSession}
              selectedSessionId={selectedSessionId}
            />

            {/* Center Panel - Dialog with integrated prompt */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <SessionDialog
                messages={messages}
                isLoading={isLoading}
                onSendMessage={handleSendMessage}
                onAttachFile={handleAttachFile}
                promptPlaceholder="Ask RFPEZ.AI about RFPs, proposals, or document analysis..."
              />
            </div>

            {/* Right Panel - Artifacts */}
            <ArtifactWindow
              artifacts={artifacts}
              onDownload={(artifact) => console.log('Download:', artifact)}
              onView={(artifact) => console.log('View:', artifact)}
            />
          </div>
        </div>

        {/* Agent Selector Modal */}
        <AgentSelector
          isOpen={showAgentSelector}
          onClose={() => setShowAgentSelector(false)}
          sessionId={currentSessionId || 'preview'} // Use 'preview' when no session
          supabaseUserId={userId || ''} // Pass empty string for non-authenticated users
          currentAgent={currentAgent}
          onAgentChanged={handleAgentChanged}
          hasProperAccountSetup={false} // TODO: Implement proper account setup check
          isAuthenticated={isAuthenticated} // Pass authentication status
        />
      </IonContent>
    </IonPage>
  );
};

export default Home;
