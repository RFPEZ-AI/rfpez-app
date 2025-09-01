import React, { useState } from 'react';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonButton,
  IonItem,
  IonLabel,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonText,
  IonSpinner,
  IonGrid,
  IonRow,
  IonCol
} from '@ionic/react';
import { claudeAPIHandler } from '../services/claudeAPIFunctions';

interface TestResult {
  success: boolean;
  data?: any;
  error?: string;
  timestamp: Date;
}

const AnonymousAgentTest: React.FC = () => {
  const [availableAgentsResult, setAvailableAgentsResult] = useState<TestResult | null>(null);
  const [switchAgentResult, setSwitchAgentResult] = useState<TestResult | null>(null);
  const [recommendAgentResult, setRecommendAgentResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [switchReason, setSwitchReason] = useState<string>('Testing anonymous user access');
  const [recommendationTopic, setRecommendationTopic] = useState<string>('I need help logging in');

  const runTest = async (testName: string, testFunction: () => Promise<any>) => {
    setLoading(prev => ({ ...prev, [testName]: true }));
    try {
      const result = await testFunction();
      return {
        success: true,
        data: result,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date()
      };
    } finally {
      setLoading(prev => ({ ...prev, [testName]: false }));
    }
  };

  const testGetAvailableAgents = async () => {
    const result = await runTest('availableAgents', async () => {
      return await claudeAPIHandler.executeFunction('get_available_agents', {
        include_restricted: false
      });
    });
    setAvailableAgentsResult(result);
  };

  const testSwitchAgent = async () => {
    if (!selectedAgentId) {
      setSwitchAgentResult({
        success: false,
        error: 'Please select an agent first',
        timestamp: new Date()
      });
      return;
    }

    const result = await runTest('switchAgent', async () => {
      return await claudeAPIHandler.executeFunction('switch_agent', {
        session_id: 'anonymous-test-session',
        agent_id: selectedAgentId,
        reason: switchReason
      });
    });
    setSwitchAgentResult(result);
  };

  const testRecommendAgent = async () => {
    const result = await runTest('recommendAgent', async () => {
      return await claudeAPIHandler.executeFunction('recommend_agent', {
        topic: recommendationTopic,
        conversation_context: 'User is having trouble accessing the system'
      });
    });
    setRecommendAgentResult(result);
  };

  const formatResult = (result: TestResult | null) => {
    if (!result) return null;
    
    return (
      <pre style={{ 
        background: result.success ? '#d4edda' : '#f8d7da', 
        padding: '10px', 
        borderRadius: '4px',
        fontSize: '12px',
        overflow: 'auto',
        maxHeight: '300px'
      }}>
        <strong>Status:</strong> {result.success ? 'SUCCESS' : 'ERROR'}<br/>
        <strong>Time:</strong> {result.timestamp.toLocaleTimeString()}<br/>
        {result.success ? (
          <>
            <strong>Data:</strong><br/>
            {JSON.stringify(result.data, null, 2)}
          </>
        ) : (
          <>
            <strong>Error:</strong><br/>
            {result.error}
          </>
        )}
      </pre>
    );
  };

  return (
    <IonGrid>
      <IonRow>
        <IonCol size="12">
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Anonymous User Agent Access Test</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonText>
                <p>This test validates that anonymous users can access and switch agents without authentication, 
                particularly for support scenarios when users have login problems.</p>
              </IonText>
            </IonCardContent>
          </IonCard>
        </IonCol>
      </IonRow>

      <IonRow>
        <IonCol size="12" sizeMd="4">
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>1. Get Available Agents</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonButton 
                expand="block" 
                onClick={testGetAvailableAgents}
                disabled={loading.availableAgents}
              >
                {loading.availableAgents ? <IonSpinner /> : 'Test Get Available Agents'}
              </IonButton>
              {formatResult(availableAgentsResult)}
            </IonCardContent>
          </IonCard>
        </IonCol>

        <IonCol size="12" sizeMd="4">
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>2. Switch Agent</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonItem>
                <IonLabel position="stacked">Select Agent</IonLabel>
                <IonSelect
                  value={selectedAgentId}
                  onIonChange={(e: CustomEvent) => setSelectedAgentId(e.detail.value)}
                  placeholder="Choose an agent"
                >
                  {availableAgentsResult?.data?.agents?.map((agent: any) => (
                    <IonSelectOption key={agent.id} value={agent.id}>
                      {agent.name} {agent.is_free ? '(Free)' : ''} {agent.is_restricted ? '(Restricted)' : ''}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>
              
              <IonItem>
                <IonLabel position="stacked">Reason</IonLabel>
                <IonTextarea
                  value={switchReason}
                  onIonInput={(e) => setSwitchReason(e.detail.value!)}
                  placeholder="Why are you switching agents?"
                />
              </IonItem>
              
              <IonButton 
                expand="block" 
                onClick={testSwitchAgent}
                disabled={loading.switchAgent || !selectedAgentId}
              >
                {loading.switchAgent ? <IonSpinner /> : 'Test Switch Agent'}
              </IonButton>
              {formatResult(switchAgentResult)}
            </IonCardContent>
          </IonCard>
        </IonCol>

        <IonCol size="12" sizeMd="4">
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>3. Recommend Agent</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonItem>
                <IonLabel position="stacked">Topic</IonLabel>
                <IonTextarea
                  value={recommendationTopic}
                  onIonInput={(e) => setRecommendationTopic(e.detail.value!)}
                  placeholder="What do you need help with?"
                />
              </IonItem>
              
              <IonButton 
                expand="block" 
                onClick={testRecommendAgent}
                disabled={loading.recommendAgent}
              >
                {loading.recommendAgent ? <IonSpinner /> : 'Test Recommend Agent'}
              </IonButton>
              {formatResult(recommendAgentResult)}
            </IonCardContent>
          </IonCard>
        </IonCol>
      </IonRow>
    </IonGrid>
  );
};

export default AnonymousAgentTest;
