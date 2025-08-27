import React, { useState, useEffect } from 'react';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonTitle,
  IonToolbar,
  IonAlert,
  IonLoading,
  IonSpinner
} from '@ionic/react';
import { mcpClient, ConversationMessage, ConversationSession, SearchResult } from '../services/mcpClient';
import { useSupabase } from '../context/SupabaseContext';

const MCPTestComponent: React.FC = () => {
  const { user, session: authSession, loading: authLoading } = useSupabase();
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<ConversationSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [messageRole, setMessageRole] = useState<'user' | 'assistant' | 'system'>('user');
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [mcpInitialized, setMcpInitialized] = useState(false);

  useEffect(() => {
    if (user && !authLoading) {
      initializeMCP();
    }
  }, [user, authLoading]);

  const initializeMCP = async () => {
    try {
      setLoading(true);
      await mcpClient.initialize();
      setMcpInitialized(true);
      await loadRecentSessions();
    } catch (error) {
      console.error('Failed to initialize MCP:', error);
      setAlertMessage(`Failed to initialize MCP: ${error instanceof Error ? error.message : String(error)}`);
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  };

  const loadRecentSessions = async () => {
    try {
      const result = await mcpClient.getRecentSessions(10);
      setSessions(result.sessions);
    } catch (error) {
      console.error('Failed to load sessions:', error);
      setAlertMessage(`Failed to load sessions: ${error instanceof Error ? error.message : String(error)}`);
      setShowAlert(true);
    }
  };

  const loadMessages = async (sessionId: string) => {
    try {
      setLoading(true);
      const result = await mcpClient.getConversationHistory(sessionId);
      setMessages(result.messages);
      setSelectedSession(sessionId);
    } catch (error) {
      console.error('Failed to load messages:', error);
      setAlertMessage(`Failed to load messages: ${error instanceof Error ? error.message : String(error)}`);
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  };

  const createNewSession = async () => {
    if (!newSessionTitle.trim()) {
      setAlertMessage('Please enter a session title');
      setShowAlert(true);
      return;
    }

    try {
      setLoading(true);
      const result = await mcpClient.createSession(newSessionTitle.trim());
      setNewSessionTitle('');
      await loadRecentSessions();
      setSelectedSession(result.session_id);
      setMessages([]);
      setAlertMessage('Session created successfully!');
      setShowAlert(true);
    } catch (error) {
      console.error('Failed to create session:', error);
      setAlertMessage(`Failed to create session: ${error instanceof Error ? error.message : String(error)}`);
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedSession) {
      setAlertMessage('Please select a session and enter a message');
      setShowAlert(true);
      return;
    }

    try {
      setLoading(true);
      await mcpClient.storeMessage(selectedSession, newMessage.trim(), messageRole);
      setNewMessage('');
      await loadMessages(selectedSession);
    } catch (error) {
      console.error('Failed to send message:', error);
      setAlertMessage(`Failed to send message: ${error instanceof Error ? error.message : String(error)}`);
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  };

  const searchMessages = async () => {
    if (!searchQuery.trim()) {
      setAlertMessage('Please enter a search query');
      setShowAlert(true);
      return;
    }

    try {
      setLoading(true);
      const result = await mcpClient.searchMessages(searchQuery.trim());
      setSearchResults(result.results);
    } catch (error) {
      console.error('Failed to search messages:', error);
      setAlertMessage(`Failed to search messages: ${error instanceof Error ? error.message : String(error)}`);
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <IonPage>
        <IonContent className="ion-padding">
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <IonSpinner />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (!user) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>MCP Test - Authentication Required</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <IonCard>
            <IonCardContent>
              <p>Please sign in to test the MCP connector.</p>
            </IonCardContent>
          </IonCard>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>MCP Connector Test</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {/* User Info & Access Token */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Authentication Info</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonItem>
              <IonLabel>
                <h3>User Email</h3>
                <p>{user.email}</p>
              </IonLabel>
            </IonItem>
            <IonItem>
              <IonLabel>
                <h3>User ID</h3>
                <p>{user.id}</p>
              </IonLabel>
            </IonItem>
            <IonItem>
              <IonLabel>
                <h3>Access Token</h3>
                <p style={{ wordBreak: 'break-all', fontSize: '0.8em', fontFamily: 'monospace' }}>
                  {authSession?.access_token || 'No active session token'}
                </p>
              </IonLabel>
              <IonButton
                fill="clear"
                onClick={() => {
                  const token = authSession?.access_token;
                  if (token) {
                    navigator.clipboard.writeText(token);
                    setAlertMessage('Access token copied to clipboard!');
                    setShowAlert(true);
                  } else {
                    setAlertMessage('No access token available');
                    setShowAlert(true);
                  }
                }}
              >
                Copy
              </IonButton>
            </IonItem>
          </IonCardContent>
        </IonCard>

        {!mcpInitialized && (
          <IonCard color="warning">
            <IonCardContent>
              <p>MCP not initialized. Please wait...</p>
            </IonCardContent>
          </IonCard>
        )}

        {/* Create New Session */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Create New Session</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonItem>
              <IonLabel position="stacked">Session Title</IonLabel>
              <IonInput
                value={newSessionTitle}
                onIonInput={(e) => setNewSessionTitle(e.detail.value || '')}
                placeholder="Enter session title"
              />
            </IonItem>
            <IonButton
              expand="block"
              onClick={createNewSession}
              disabled={loading || !mcpInitialized}
            >
              Create Session
            </IonButton>
          </IonCardContent>
        </IonCard>

        {/* Recent Sessions */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Recent Sessions ({sessions.length})</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonList>
              {sessions.map((session) => (
                <IonItem
                  key={session.id}
                  button
                  onClick={() => loadMessages(session.id)}
                  color={selectedSession === session.id ? 'primary' : undefined}
                >
                  <IonLabel>
                    <h3>{session.title}</h3>
                    <p>{new Date(session.created_at).toLocaleString()}</p>
                    {session.description && <p>{session.description}</p>}
                  </IonLabel>
                </IonItem>
              ))}
            </IonList>
            {sessions.length === 0 && (
              <p>No sessions found. Create a new session to get started.</p>
            )}
          </IonCardContent>
        </IonCard>

        {/* Messages for Selected Session */}
        {selectedSession && (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Messages ({messages.length})</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonList>
                {messages.map((message) => (
                  <IonItem key={message.id}>
                    <IonLabel>
                      <h3>
                        <strong>{message.role}:</strong> {message.content}
                      </h3>
                      <p>{new Date(message.created_at).toLocaleString()}</p>
                    </IonLabel>
                  </IonItem>
                ))}
              </IonList>
              {messages.length === 0 && (
                <p>No messages in this session. Send a message to get started.</p>
              )}
            </IonCardContent>
          </IonCard>
        )}

        {/* Send Message */}
        {selectedSession && (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Send Message</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonItem>
                <IonLabel position="stacked">Role</IonLabel>
                <IonSelect
                  value={messageRole}
                  onIonChange={(e) => setMessageRole(e.detail.value)}
                >
                  <IonSelectOption value="user">User</IonSelectOption>
                  <IonSelectOption value="assistant">Assistant</IonSelectOption>
                  <IonSelectOption value="system">System</IonSelectOption>
                </IonSelect>
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">Message</IonLabel>
                <IonTextarea
                  value={newMessage}
                  onIonInput={(e) => setNewMessage(e.detail.value || '')}
                  placeholder="Enter your message"
                  rows={3}
                />
              </IonItem>
              <IonButton
                expand="block"
                onClick={sendMessage}
                disabled={loading || !mcpInitialized}
              >
                Send Message
              </IonButton>
            </IonCardContent>
          </IonCard>
        )}

        {/* Search Messages */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Search Messages</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonItem>
              <IonLabel position="stacked">Search Query</IonLabel>
              <IonInput
                value={searchQuery}
                onIonInput={(e) => setSearchQuery(e.detail.value || '')}
                placeholder="Enter search terms"
              />
            </IonItem>
            <IonButton
              expand="block"
              onClick={searchMessages}
              disabled={loading || !mcpInitialized}
            >
              Search
            </IonButton>
            
            {searchResults.length > 0 && (
              <IonList>
                <IonLabel>
                  <h3>Search Results ({searchResults.length})</h3>
                </IonLabel>
                {searchResults.map((result, index) => (
                  <IonItem key={index}>
                    <IonLabel>
                      <h3>{result.content}</h3>
                      <p>
                        <strong>Session:</strong> {result.sessions.title} | 
                        <strong> Role:</strong> {result.role} | 
                        <strong> Date:</strong> {new Date(result.created_at).toLocaleString()}
                      </p>
                    </IonLabel>
                  </IonItem>
                ))}
              </IonList>
            )}
          </IonCardContent>
        </IonCard>

        <IonLoading isOpen={loading} message="Processing..." />
        
        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header="Info"
          message={alertMessage}
          buttons={['OK']}
        />
      </IonContent>
    </IonPage>
  );
};

export default MCPTestComponent;
