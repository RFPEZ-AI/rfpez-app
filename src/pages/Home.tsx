import React, { useState } from 'react';
import { IonContent, IonHeader, IonPage, IonToolbar, IonButtons } from '@ionic/react';
import AuthButtons from '../components/AuthButtons';
import SessionHistory from '../components/SessionHistory';
import SessionDialog from '../components/SessionDialog';
import ArtifactWindow from '../components/ArtifactWindow';
import PromptComponent from '../components/PromptComponent';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface Session {
  id: string;
  title: string;
  lastMessage: string;
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions] = useState<Session[]>([]); // Remove setSessions to fix ESLint warning
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = (content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      isUser: true,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newMessage]);
    setIsLoading(true);
    
    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm RFPEZ.AI, your RFP assistant. I can help you with proposal creation, document analysis, and RFP management. How can I assist you today?",
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const handleNewSession = () => {
    setMessages([]);
    setSelectedSessionId(undefined);
  };

  const handleSelectSession = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    // Load session messages here
  };

  const handleAttachFile = (file: File) => {
    const newArtifact: Artifact = {
      id: Date.now().toString(),
      name: file.name,
      type: file.type.includes('pdf') ? 'pdf' : 'document',
      size: `${(file.size / 1024).toFixed(1)} KB`
    };
    setArtifacts(prev => [...prev, newArtifact]);
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
