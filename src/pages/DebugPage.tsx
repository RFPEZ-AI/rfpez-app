// Copyright Mark Skiba, 2025 All rights reserved

import React, { useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonSpinner
} from '@ionic/react';
import { colorPaletteOutline, flask } from 'ionicons/icons';
import ClaudeTestComponent from '../components/ClaudeTestComponent';
import AuthDebugger from '../components/AuthDebugger';
import RoleManagement from '../components/RoleManagement';
import MCPTestComponent from '../components/MCPTestComponent';
import { useSupabase } from '../context/SupabaseContext';
import { RoleService } from '../services/roleService';
import { testClaudeMCPAvailability, MCPTestResult } from '../utils/mcpTestUtils';
import { MCPMonitor, MCP_TEST_PROMPT, MCP_SIMPLE_TEST_PROMPT, MCP_CONVERSATION_TEST_PROMPT } from '../utils/claudeMCPTest';

const DebugPage: React.FC = () => {
  const { userProfile } = useSupabase();
  const [mcpTestResult, setMcpTestResult] = useState<MCPTestResult | null>(null);
  const [mcpTesting, setMcpTesting] = useState(false);
  const [mcpMonitor, setMcpMonitor] = useState<MCPMonitor | null>(null);

  const handleDirectMCPTest = async () => {
    setMcpTesting(true);
    try {
      const result = await testClaudeMCPAvailability();
      setMcpTestResult(result);
    } catch (error) {
      console.error('MCP test failed:', error);
      setMcpTestResult({
        mcpAvailable: false,
        fallbackUsed: true,
        responseTime: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'MCP test failed',
        testSteps: []
      });
    } finally {
      setMcpTesting(false);
    }
  };

  const copyTestPrompt = (prompt: string, name: string) => {
    navigator.clipboard.writeText(prompt);
    console.log(`📋 ${name} test prompt copied to clipboard`);
    alert(`${name} test prompt copied to clipboard!`);
  };

  const initializeMCPMonitor = () => {
    if (!mcpMonitor) {
      const monitor = new MCPMonitor();
      setMcpMonitor(monitor);
      console.log('🔍 MCP Monitor initialized');
    } else {
      console.log('🔍 MCP Monitor already running');
    }
  };

  const clearTestResults = () => {
    setMcpTestResult(null);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>Debug Tools</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {/* MCP Integration Testing */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>
              <IonIcon icon={flask} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              MCP Integration Testing
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <p>Test the MCP integration between Claude sessions and Supabase MCP server.</p>
            
            {/* Direct MCP Testing */}
            <div style={{ marginBottom: '16px' }}>
              <h4>Direct MCP Testing</h4>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                <IonButton 
                  onClick={handleDirectMCPTest}
                  disabled={mcpTesting}
                  color="primary"
                  size="small"
                >
                  {mcpTesting ? <IonSpinner name="crescent" /> : 'Run MCP Test'}
                </IonButton>
                <IonButton 
                  onClick={initializeMCPMonitor}
                  fill="outline"
                  color="secondary"
                  size="small"
                >
                  Initialize MCP Monitor
                </IonButton>
                {mcpTestResult && (
                  <IonButton 
                    onClick={clearTestResults}
                    fill="outline"
                    color="medium"
                    size="small"
                  >
                    Clear Results
                  </IonButton>
                )}
              </div>
            </div>

            {/* Claude MCP Test Prompts */}
            <div style={{ marginBottom: '16px' }}>
              <h4>Claude MCP Test Prompts</h4>
              <p style={{ fontSize: '14px', color: 'var(--ion-color-medium)' }}>
                Copy these prompts to test Claude&apos;s MCP integration in a conversation.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <IonButton 
                  onClick={() => copyTestPrompt(MCP_SIMPLE_TEST_PROMPT, 'Simple')}
                  fill="outline"
                  expand="block"
                  size="small"
                >
                  📋 Copy Simple Test Prompt
                </IonButton>
                <IonButton 
                  onClick={() => copyTestPrompt(MCP_CONVERSATION_TEST_PROMPT, 'Conversation')}
                  fill="outline"
                  expand="block"
                  size="small"
                >
                  📋 Copy Conversation Test Prompt
                </IonButton>
                <IonButton 
                  onClick={() => copyTestPrompt(MCP_TEST_PROMPT, 'Comprehensive')}
                  fill="outline"
                  expand="block"
                  size="small"
                >
                  📋 Copy Comprehensive Test Prompt
                </IonButton>
              </div>
            </div>

            {/* Console Helpers */}
            <div>
              <h4>Browser Console Testing</h4>
              <p style={{ fontSize: '14px', color: 'var(--ion-color-medium)' }}>
                Available console commands for MCP testing:
              </p>
              <div style={{ 
                fontFamily: 'monospace', 
                fontSize: '12px', 
                backgroundColor: 'var(--ion-color-light)', 
                padding: '8px', 
                borderRadius: '4px',
                lineHeight: '1.4'
              }}>
                <div>• <strong>window.testMCP()</strong> - Quick MCP test</div>
                <div>• <strong>window.testMCPFull()</strong> - Comprehensive test</div>
                <div>• <strong>window.mcpTestPrompt</strong> - Access test prompts</div>
                <div>• <strong>window.analyzeMCPLogs()</strong> - Analyze console logs</div>
                <div>• <strong>window.mcpMonitor</strong> - Access MCP monitor</div>
              </div>
            </div>
          </IonCardContent>
        </IonCard>

        {/* MCP Test Results Display */}
        {mcpTestResult && (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>MCP Test Results</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <div style={{ marginBottom: '12px' }}>
                <IonItem lines="none">
                  <IonLabel>
                    <h3>MCP Available: {mcpTestResult.mcpAvailable ? '✅ Yes' : '❌ No'}</h3>
                    <p>Fallback Used: {mcpTestResult.fallbackUsed ? '⚠️ Yes' : '✅ No'}</p>
                    <p>Response Time: {mcpTestResult.responseTime}ms</p>
                    {mcpTestResult.error && (
                      <p style={{ color: 'var(--ion-color-danger)' }}>
                        Error: {mcpTestResult.error}
                      </p>
                    )}
                    <p>{mcpTestResult.details}</p>
                  </IonLabel>
                </IonItem>
              </div>
              
              {mcpTestResult.testSteps.length > 0 && (
                <div>
                  <h4>Test Steps:</h4>
                  {mcpTestResult.testSteps.map((step, index) => (
                    <IonItem key={index} lines="none">
                      <IonLabel>
                        <h4>{step.success ? '✅' : '❌'} {step.step}</h4>
                        <p>Duration: {step.duration}ms</p>
                        {step.error && (
                          <p style={{ color: 'var(--ion-color-danger)' }}>
                            {step.error}
                          </p>
                        )}
                      </IonLabel>
                    </IonItem>
                  ))}
                </div>
              )}
            </IonCardContent>
          </IonCard>
        )}

        {/* MCP Client Testing (existing component) */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>MCP Client Testing</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <p>Direct MCP client testing and conversation management.</p>
            <MCPTestComponent />
          </IonCardContent>
        </IonCard>

        {/* Claude API Test Section */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Claude API Test</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <ClaudeTestComponent />
          </IonCardContent>
        </IonCard>

        {/* Auth Debug Section */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Authentication Debug Info</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <AuthDebugger />
          </IonCardContent>
        </IonCard>

        {/* Component Demos */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Component Demos</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonButton 
              expand="block" 
              fill="outline" 
              routerLink="/debug/avatars"
              style={{ marginBottom: '8px' }}
            >
              <IonIcon icon={colorPaletteOutline} slot="start" />
              Agent Avatar Demo
            </IonButton>
          </IonCardContent>
        </IonCard>

        {/* Role Management Section (Admin Only) */}
        {userProfile?.role && RoleService.isAdministrator(userProfile.role) && (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Role Management (Admin)</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <RoleManagement currentUserRole={userProfile.role} />
            </IonCardContent>
          </IonCard>
        )}
      </IonContent>
    </IonPage>
  );
};

export default DebugPage;
