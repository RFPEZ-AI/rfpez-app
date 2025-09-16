// Copyright Mark Skiba, 2025 All rights reserved

// Agent Management Test Component - Demonstrates Phase 1 LLM-driven agent switching

import React, { useState, useRef } from 'react';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonItem,
  IonLabel,
  IonText,
  IonTextarea,
  IonList,
  IonSpinner,
  IonAlert,
  IonBadge
} from '@ionic/react';
import { ClaudeService } from '../services/claudeService';
import { AgentService } from '../services/agentService';
import type { Agent } from '../types/database';

interface TestMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  agentName?: string;
  metadata?: {
    functions_called?: string[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    agent_switches?: any[]; // Agent switch results can have various structures
  };
}

const AgentManagementTest: React.FC = () => {
  const [messages, setMessages] = useState<TestMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null);
  const [sessionId] = useState(`test-session-${Date.now()}`);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);

  // Initialize with default agent
  React.useEffect(() => {
    const initializeAgent = async () => {
      try {
        const defaultAgent = await AgentService.getDefaultAgent();
        if (defaultAgent) {
          setCurrentAgent(defaultAgent);
          const initialMessage: TestMessage = {
            id: 'initial',
            content: `Hello! I'm ${defaultAgent.name}. I can help you test agent switching. Try asking me to:
            
• "Switch to the RFP agent" 
• "Who are the available agents?"
• "Recommend an agent for technical support"
• "Switch to someone who can help with procurement"`,
            isUser: false,
            timestamp: new Date(),
            agentName: defaultAgent.name
          };
          setMessages([initialMessage]);
        }
      } catch (error) {
        console.error('Failed to initialize agent:', error);
        setAlertMessage('Failed to initialize agent');
        setShowAlert(true);
      }
    };
    initializeAgent();
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !currentAgent) return;

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    const userMessage: TestMessage = {
      id: Date.now().toString(),
      content: inputMessage,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setInputMessage('');

    try {
      // Convert conversation history for Claude
      const conversationHistory = messages
        .filter(msg => msg.id !== 'initial')
        .map(msg => ({
          role: (msg.isUser ? 'user' : 'assistant') as 'user' | 'assistant',
          content: msg.content
        }));

      // Generate response with agent management capabilities
      const response = await ClaudeService.generateResponse(
        inputMessage,
        currentAgent,
        conversationHistory,
        sessionId,
        {
          id: 'test-user',
          email: 'test@example.com',
          full_name: 'Test User',
          role: 'user'
        },
        null, // rfp context
        null, // artifact context
        abortControllerRef.current.signal
      );

      const aiMessage: TestMessage = {
        id: (Date.now() + 1).toString(),
        content: response.content,
        isUser: false,
        timestamp: new Date(),
        agentName: currentAgent.name,
        metadata: {
          functions_called: response.metadata.functions_called,
          agent_switches: response.metadata.function_results?.filter(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (result: any) => result.function === 'switch_agent'
          )
        }
      };

      setMessages(prev => [...prev, aiMessage]);

      // Check if agent was switched
      const switchResults = response.metadata.function_results?.filter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (result: any) => result.function === 'switch_agent'
      );

      if (switchResults && switchResults.length > 0) {
        const switchResult = switchResults[0].result;
        if (switchResult.success && switchResult.new_agent) {
          // Update current agent display
          const newAgent = await AgentService.getAgentById(switchResult.new_agent.id);
          if (newAgent) {
            setCurrentAgent(newAgent);
            setAlertMessage(`Agent switched to: ${newAgent.name}`);
            setShowAlert(true);
          }
        }
      }

    } catch (error) {
      console.error('Error generating response:', error);
      
      // Check if this was a cancellation
      if (error instanceof Error && error.message === 'Request was cancelled') {
        console.log('Request was cancelled by user');
        return; // Don't show error message for cancelled requests
      }
      
      const errorMessage: TestMessage = {
        id: (Date.now() + 1).toString(),
        content: `Error: ${error instanceof Error ? error.message : 'Failed to generate response'}`,
        isUser: false,
        timestamp: new Date(),
        agentName: 'System'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const cancelRequest = () => {
    if (abortControllerRef.current) {
      console.log('Cancelling Claude request...');
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  const testQueries = [
    "Show me the available agents",
    "Switch to the RFP agent",
    "I need help with technical support",
    "Recommend an agent for procurement questions",
    "Who is the current agent?",
    "Switch to someone who can help with sales questions"
  ];

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>Agent Management Test - Phase 1</IonCardTitle>
          <IonText color="medium">
            <p>Test LLM-driven agent switching capabilities</p>
          </IonText>
        </IonCardHeader>
        <IonCardContent>
          {currentAgent && (
            <div style={{ marginBottom: '16px' }}>
              <IonLabel>
                <strong>Current Agent:</strong> {currentAgent.name}
                {currentAgent.is_default && <IonBadge color="warning" style={{ marginLeft: '8px' }}>Default</IonBadge>}
                {currentAgent.is_free && <IonBadge color="success" style={{ marginLeft: '8px' }}>Free</IonBadge>}
                {currentAgent.is_restricted && <IonBadge color="medium" style={{ marginLeft: '8px' }}>Premium</IonBadge>}
              </IonLabel>
            </div>
          )}
        </IonCardContent>
      </IonCard>

      <IonCard>
        <IonCardHeader>
          <IonCardTitle>Quick Test Queries</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <IonList>
            {testQueries.map((query, index) => (
              <IonItem key={index} button onClick={() => setInputMessage(query)}>
                <IonLabel>{query}</IonLabel>
              </IonItem>
            ))}
          </IonList>
        </IonCardContent>
      </IonCard>

      <IonCard>
        <IonCardHeader>
          <IonCardTitle>Conversation</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '16px' }}>
            {messages.map((message) => (
              <div
                key={message.id}
                style={{
                  marginBottom: '12px',
                  padding: '8px',
                  backgroundColor: message.isUser ? '#e3f2fd' : '#f5f5f5',
                  borderRadius: '8px',
                  borderLeft: message.isUser ? '4px solid #2196f3' : '4px solid #4caf50'
                }}
              >
                <div style={{ fontWeight: 'bold', fontSize: '0.9em', marginBottom: '4px' }}>
                  {message.isUser ? 'You' : message.agentName || 'AI'}
                  {message.metadata?.functions_called && message.metadata.functions_called.length > 0 && (
                    <span style={{ marginLeft: '8px' }}>
                      {message.metadata.functions_called.map(func => (
                        <IonBadge key={func} color="tertiary" style={{ marginLeft: '4px', fontSize: '0.7em' }}>
                          {func}
                        </IonBadge>
                      ))}
                    </span>
                  )}
                </div>
                <div style={{ whiteSpace: 'pre-wrap' }}>{message.content}</div>
                <div style={{ fontSize: '0.8em', color: '#666', marginTop: '4px' }}>
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            ))}
            {isLoading && (
              <div style={{ textAlign: 'center', padding: '16px' }}>
                <IonSpinner />
                <div style={{ 
                  marginTop: '8px', 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  gap: '8px' 
                }}>
                  <span>{currentAgent?.name || 'AI'} Agent is working...</span>
                  <IonButton 
                    size="small" 
                    fill="outline" 
                    color="danger"
                    onClick={cancelRequest}
                  >
                    Cancel
                  </IonButton>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <IonTextarea
              value={inputMessage}
              onIonInput={(e) => setInputMessage(e.detail.value || '')}
              placeholder="Type your message..."
              autoGrow
              style={{ flex: 1 }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <IonButton 
              onClick={handleSendMessage} 
              disabled={!inputMessage.trim() || isLoading}
            >
              Send
            </IonButton>
          </div>
        </IonCardContent>
      </IonCard>

      <IonAlert
        isOpen={showAlert}
        onDidDismiss={() => setShowAlert(false)}
        header="Agent Management"
        message={alertMessage}
        buttons={['OK']}
      />
    </div>
  );
};

export default AgentManagementTest;
