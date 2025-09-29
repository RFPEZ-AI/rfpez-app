// Simple Frontend Integration Test for Unified Claude Service
// Tests integration with existing Home page structure

import React, { useState } from 'react';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonInput,
  IonItem,
  IonLabel,
  IonPage,
  IonTextarea
} from '@ionic/react';
// import UnifiedClaudeService from '../services/unifiedClaudeService'; // DISABLED FOR COMPILATION
import ToolTransparencyDisplay from '../components/ToolTransparencyDisplay';
import { ToolInvocationEvent } from '../types/streamingProtocol';

const UnifiedClaudeTestPage: React.FC = () => {
  const [message, setMessage] = useState('I need to create an RFP for office supplies');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toolInvocations, setToolInvocations] = useState<ToolInvocationEvent[]>([]);
  const [isToolActive, setIsToolActive] = useState(false);

  const handleToolInvocation = (toolEvent: ToolInvocationEvent) => {
    console.log(`🔧 Tool event: ${toolEvent.type} - ${toolEvent.toolName}`);
    setToolInvocations(prev => [...prev, toolEvent]);
    
    if (toolEvent.type === 'tool_start') {
      setIsToolActive(true);
    } else if (toolEvent.type === 'tool_complete' || toolEvent.type === 'tool_error') {
      // Check if all tools are complete
      setTimeout(() => setIsToolActive(false), 1000);
    }
  };

  const handleStreamingText = (text: string) => {
    setResponse(prev => prev + text);
  };

  const handleTestUnifiedService = async () => {
    setIsLoading(true);
    setResponse('');
    setToolInvocations([]);
    setIsToolActive(false);

    try {
      console.log('🚀 UnifiedClaudeTestPage disabled for compilation');
      setResponse('UnifiedClaudeTestPage disabled - UnifiedClaudeService removed');
      setIsLoading(false);
      return;

      // DISABLED FOR COMPILATION - UnifiedClaudeService removed
      /*
      const result = await UnifiedClaudeService.generateStreamingResponse({
        messages: [
          { role: 'user', content: message }
        ],
        system: 'You are an RFP Design Agent. When users request RFP creation, use the create_and_set_rfp tool.',
        model: 'claude-sonnet-4-20250514',
        tools: [
          {
            name: 'create_and_set_rfp',
            description: 'Create and set a new RFP',
            input_schema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                description: { type: 'string' },
                requirements: { type: 'array', items: { type: 'string' } }
              },
              required: ['name', 'description']
            }
          }
        ],
        onToolInvocation: handleToolInvocation,
        onStreamingText: handleStreamingText,
        onComplete: (metadata) => {
          console.log('✅ Streaming completed:', metadata);
          setIsLoading(false);
        },
        onError: (error) => {
          console.error('❌ Streaming error:', error);
          setIsLoading(false);
          setResponse(`Error: ${error}`);
        }
      });

      if (result.success) {
        console.log('✅ Unified service test successful');
        console.log(`🔧 Tools used: ${result.toolInvocations.map(t => t.toolName).join(', ')}`);
      } else {
        console.error('❌ Unified service test failed:', result.error);
        setResponse(`Test failed: ${result.error}`);
      }
      */

    } catch (error) {
      console.error('❌ Test error:', error);
      setResponse(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>🧪 Unified Claude Service Test</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonItem>
              <IonLabel position="stacked">Test Message</IonLabel>
              <IonTextarea
                value={message}
                onIonInput={(e) => setMessage(e.detail.value!)}
                placeholder="Enter your test message..."
                rows={3}
              />
            </IonItem>
            
            <IonButton 
              expand="block" 
              onClick={handleTestUnifiedService}
              disabled={isLoading}
              className="ion-margin-top"
            >
              {isLoading ? 'Testing...' : 'Test Unified Streaming'}
            </IonButton>
          </IonCardContent>
        </IonCard>

        {/* Tool Transparency Display */}
        <ToolTransparencyDisplay
          toolInvocations={toolInvocations}
          isActive={isToolActive}
          className="ion-margin-top"
        />

        {/* Response Display */}
        {response && (
          <IonCard className="ion-margin-top">
            <IonCardHeader>
              <IonCardTitle>📝 Claude Response</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: '14px' }}>
                {response}
              </pre>
            </IonCardContent>
          </IonCard>
        )}

        {/* Tool Invocation Log */}
        {toolInvocations.length > 0 && (
          <IonCard className="ion-margin-top">
            <IonCardHeader>
              <IonCardTitle>🔧 Tool Execution Log</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              {toolInvocations.map((tool, index) => (
                <div key={index} style={{ marginBottom: '8px', fontSize: '12px' }}>
                  <strong>{tool.toolName}</strong>: {tool.type}
                  {tool.duration && ` (${tool.duration}ms)`}
                  {tool.error && ` - Error: ${tool.error}`}
                </div>
              ))}
            </IonCardContent>
          </IonCard>
        )}
      </IonContent>
    </IonPage>
  );
};

export default UnifiedClaudeTestPage;