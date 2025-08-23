import React, { useState, useEffect } from 'react';
import { IonContent, IonHeader, IonPage, IonToolbar, IonButtons } from '@ionic/react';
import { useAuth0 } from '@auth0/auth0-react';
import AuthButtons from '../components/AuthButtons';
import SessionHistory from '../components/SessionHistory';
import SessionDialog from '../components/SessionDialog';
import ArtifactWindow from '../components/ArtifactWindow';
import PromptComponent from '../components/PromptComponent';
import { useSupabase } from '../context/SupabaseContext';
import DatabaseService from '../services/database';
import type { 
  SessionWithStats,
  UserProfile
} from '../types/database';

// Local interfaces for UI compatibility
interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface Session {
  id: string;
  title: string;
  timestamp: Date;
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
  const { user, isAuthenticated } = useAuth0();
  const { loading: supabaseLoading, userProfile } = useSupabase();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>();
  const [currentSessionId, setCurrentSessionId] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);

  // Load user sessions on mount if authenticated
  useEffect(() => {
    console.log('Auth state:', { isAuthenticated, supabaseLoading, user: !!user, userProfile: !!userProfile });
    if (isAuthenticated && !supabaseLoading && user && userProfile) {
      console.log('Loading user sessions...');
      loadUserSessions();
    }
  }, [isAuthenticated, supabaseLoading, user, userProfile]);

  // Load sessions from Supabase
  const loadUserSessions = async () => {
    if (!isAuthenticated || !user?.sub || !userProfile) {
      console.log('User not authenticated or profile not ready, skipping session load');
      return;
    }
    
    try {
      console.log('Attempting to load sessions from Supabase for user:', user.sub);
      const sessionsData = await DatabaseService.getUserSessions(user.sub);
      console.log('Sessions loaded:', sessionsData);
      const formattedSessions: Session[] = sessionsData.map(session => ({
        id: session.id,
        title: session.title,
        timestamp: new Date(session.updated_at)
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
          timestamp: new Date(msg.created_at)
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

  // Create a new session in Supabase
  const createNewSession = async (): Promise<string | null> => {
    console.log('Creating new session, auth state:', { isAuthenticated, user: !!user, userProfile: !!userProfile });
    if (!isAuthenticated || !user?.sub || !userProfile) {
      console.log('Not authenticated or profile not ready, skipping session creation');
      return null;
    }
    
    try {
      console.log('Attempting to create session in Supabase...');
      const session = await DatabaseService.createSession(user.sub, 'New RFP Session');
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
      if (isAuthenticated && user && userProfile) {
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
        if (activeSessionId && user?.sub) {
          console.log('Saving user message to session:', activeSessionId);
          const savedMessage = await DatabaseService.addMessage(activeSessionId, user.sub, content, 'user');
          console.log('User message saved:', savedMessage);
        } else {
          console.log('No session ID or user ID available, message not saved');
        }
      } else {
        console.log('User not authenticated, messages not saved to Supabase');
      }

      // Simulate AI response
      setTimeout(async () => {
        const aiResponse = "I'm RFPEZ.AI, your RFP assistant. I can help you with proposal creation, document analysis, and RFP management. How can I assist you today?";
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: aiResponse,
          isUser: false,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, aiMessage]);
        setIsLoading(false);

        // Save AI response to database if authenticated - use activeSessionId instead of currentSessionId
        if (isAuthenticated && user?.sub && userProfile && activeSessionId) {
          try {
            console.log('Saving AI response to session:', activeSessionId);
            const savedAiMessage = await DatabaseService.addMessage(activeSessionId, user.sub, aiResponse, 'assistant');
            console.log('AI message saved:', savedAiMessage);
            await loadUserSessions(); // Refresh to update last message
          } catch (error) {
            console.error('Failed to save AI message:', error);
          }
        } else {
          console.log('AI response not saved - auth:', isAuthenticated, 'user:', !!user, 'userProfile:', !!userProfile, 'sessionId:', activeSessionId);
        }
      }, 1500);
    } catch (error) {
      console.error('Failed to send message:', error);
      setIsLoading(false);
    }
  };

  const handleNewSession = async () => {
    setMessages([]);
    setArtifacts([]);
    setSelectedSessionId(undefined);
    setCurrentSessionId(undefined);

    // Create new session in Supabase if authenticated
    if (isAuthenticated && user && userProfile) {
      const sessionId = await createNewSession();
      if (sessionId) {
        setCurrentSessionId(sessionId);
        setSelectedSessionId(sessionId);
      }
    }
  };

  const handleSelectSession = async (sessionId: string) => {
    console.log('Session selected:', sessionId);
    setSelectedSessionId(sessionId);
    setCurrentSessionId(sessionId);
    await loadSessionMessages(sessionId);
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
    if (isAuthenticated && user && userProfile && currentSessionId) {
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
          <div style={{ display: 'flex', alignItems: 'center', padding: '0 16px' }}>
            <img 
              src="/logo.svg" 
              alt="RFPEZ.AI" 
              style={{ height: '32px', marginRight: '12px' }}
            />
            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>RFPEZ.AI</span>
            {isAuthenticated && user && userProfile && (
              <span style={{ 
                fontSize: '12px', 
                marginLeft: '12px', 
                padding: '4px 8px',
                backgroundColor: 'var(--ion-color-success)',
                color: 'white',
                borderRadius: '12px'
              }}>
                Sessions Saved
              </span>
            )}
          </div>
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
            <div style={{ width: '300px', minWidth: '300px' }}>
              <SessionHistory
                sessions={sessions}
                onNewSession={handleNewSession}
                onSelectSession={handleSelectSession}
                selectedSessionId={selectedSessionId}
              />
            </div>

            {/* Center Panel - Dialog */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <SessionDialog
                messages={messages}
                isLoading={isLoading}
              />
            </div>

            {/* Right Panel - Artifacts */}
            <ArtifactWindow
              artifacts={artifacts}
              onDownload={(artifact) => console.log('Download:', artifact)}
              onView={(artifact) => console.log('View:', artifact)}
            />
          </div>

          {/* Bottom Panel - Prompt */}
          <PromptComponent
            onSendMessage={handleSendMessage}
            onAttachFile={handleAttachFile}
            isLoading={isLoading}
            placeholder="Ask RFPEZ.AI about RFPs, proposals, or document analysis..."
          />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;
