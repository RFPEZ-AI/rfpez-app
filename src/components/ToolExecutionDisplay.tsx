// Copyright Mark Skiba, 2025 All rights reserved
// Tool Execution Display Component - Shows real-time Claude tool invocations

import React, { useState, useEffect } from 'react';
import {
  IonChip,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonSpinner,
  IonText,
  IonButton
} from '@ionic/react';
import {
  constructOutline,
  checkmarkCircleOutline,
  alertCircleOutline,
  chevronDownOutline,
  chevronUpOutline
} from 'ionicons/icons';
import { ToolInvocationEvent } from '../types/streamingProtocol';

interface ToolExecutionDisplayProps {
  toolInvocations: ToolInvocationEvent[];
  isActive: boolean;
  className?: string;
}

const ToolExecutionDisplay: React.FC<ToolExecutionDisplayProps> = ({
  toolInvocations,
  isActive,
  className = ''
}) => {
  const [expanded, setExpanded] = useState<boolean>(false);

  useEffect(() => {
    // Track active tools
    const active = new Set<string>();
    toolInvocations.forEach(tool => {
      if (tool.type === 'tool_start' || tool.type === 'tool_progress') {
        active.add(tool.toolName);
      }
    });
    // Active tools tracking removed - was unused
  }, [toolInvocations]);

  const getToolIcon = (type: string) => {
    switch (type) {
      case 'tool_start':
        return <IonSpinner name="dots" color="primary" style={{ width: '14px', height: '14px' }} />;
      case 'tool_progress':
        return <IonIcon icon={constructOutline} color="warning" style={{ fontSize: '14px' }} />;
      case 'tool_complete':
        return <IonIcon icon={checkmarkCircleOutline} color="success" style={{ fontSize: '14px' }} />;
      case 'tool_error':
        return <IonIcon icon={alertCircleOutline} color="danger" style={{ fontSize: '14px' }} />;
      default:
        return <IonIcon icon={constructOutline} color="medium" style={{ fontSize: '14px' }} />;
    }
  };

  const getToolDisplayName = (toolName: string) => {
    // Convert tool names to user-friendly display names
    const displayNames: { [key: string]: string } = {
      'create_and_set_rfp': 'Create RFP',
      'supabase_select': 'Database Query',
      'supabase_insert': 'Save Data',
      'supabase_update': 'Update Record',
      'get_conversation_history': 'Load Conversation',
      'store_message': 'Save Message',
      'create_session_agent': 'Switch Agent',
      'get_current_agent': 'Get Agent Info',
      'create_artifact': 'Create Artifact',
      'update_artifact': 'Update Artifact',
      'get_artifacts': 'Load Artifacts'
    };
    
    return displayNames[toolName] || toolName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getToolColor = (type: string) => {
    switch (type) {
      case 'tool_start':
        return 'primary';
      case 'tool_progress':
        return 'warning';
      case 'tool_complete':
        return 'success';
      case 'tool_error':
        return 'danger';
      default:
        return 'medium';
    }
  };

  const getExecutionTime = (tool: ToolInvocationEvent) => {
    if (tool.duration) {
      return `${tool.duration}ms`;
    }
    return null;
  };

  if (!isActive && toolInvocations.length === 0) {
    return null;
  }

  // Group tools by name and get latest status for each
  const toolSummary = toolInvocations.reduce((acc: Record<string, ToolInvocationEvent>, tool) => {
    if (!acc[tool.toolName] || new Date(tool.timestamp) > new Date(acc[tool.toolName].timestamp)) {
      acc[tool.toolName] = tool;
    }
    return acc;
  }, {});

  const toolNames = Object.keys(toolSummary);
  const completedCount = toolNames.filter(name => toolSummary[name].type === 'tool_complete').length;
  const activeCount = toolNames.filter(name => toolSummary[name].type === 'tool_start').length;

  return (
    <div className={`tool-execution-compact ${className}`} style={{ margin: '8px 0' }}>
      {/* Compact one-line display */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px',
        padding: '4px 8px',
        backgroundColor: 'var(--ion-color-light)',
        borderRadius: '8px',
        fontSize: '14px'
      }}>
        {/* Status icon */}
        {activeCount > 0 ? (
          <IonSpinner name="dots" style={{ width: '16px', height: '16px' }} />
        ) : (
          <IonIcon icon={checkmarkCircleOutline} color="success" style={{ fontSize: '16px' }} />
        )}
        
        {/* Tool names and status */}
        <IonText style={{ flex: 1 }}>
          {toolNames.length === 0 && 'Tools: Waiting...'}
          {toolNames.length > 0 && (
            <>
              Tools: {toolNames.map(name => getToolDisplayName(name)).join(', ')}
              {activeCount > 0 && <span style={{ color: 'var(--ion-color-primary)' }}> (running)</span>}
              {activeCount === 0 && completedCount > 0 && <span style={{ color: 'var(--ion-color-success)' }}> (completed)</span>}
            </>
          )}
        </IonText>
        
        {/* Expand/collapse button */}
        {toolInvocations.length > 0 && (
          <IonButton 
            fill="clear" 
            size="small"
            onClick={() => setExpanded(!expanded)}
            style={{ margin: 0, height: '24px' }}
          >
            <IonIcon icon={expanded ? chevronUpOutline : chevronDownOutline} />
          </IonButton>
        )}
      </div>
      
      {/* Expandable details */}
      {expanded && toolInvocations.length > 0 && (
        <div style={{ 
          marginTop: '8px', 
          padding: '8px',
          backgroundColor: 'var(--ion-color-light-shade)',
          borderRadius: '8px',
          fontSize: '12px'
        }}>
          <IonList style={{ padding: 0 }}>
            {toolInvocations.map((tool, index) => (
              <IonItem key={`${tool.toolName}-${index}-${tool.timestamp}`} lines="none" style={{ fontSize: '12px' }}>
                <div slot="start">
                  {getToolIcon(tool.type)}
                </div>
                
                <IonLabel>
                  <h3 style={{ fontSize: '12px', margin: '2px 0' }}>
                    {getToolDisplayName(tool.toolName)}
                  </h3>
                  
                  <p style={{ fontSize: '11px', margin: '1px 0', color: 'var(--ion-color-medium)' }}>
                    {tool.type === 'tool_start' && 'Starting...'}
                    {tool.type === 'tool_complete' && `Completed ${getExecutionTime(tool) ? `in ${getExecutionTime(tool)}` : ''}`}
                    {tool.type === 'tool_error' && `Error: ${tool.error || 'Unknown error'}`}
                  </p>
                </IonLabel>
                
                <IonChip slot="end" color={getToolColor(tool.type)} style={{ fontSize: '10px', height: '20px' }}>
                  {tool.type.replace('tool_', '')}
                </IonChip>
              </IonItem>
            ))}
          </IonList>
        </div>
      )}
    </div>
  );
};

export default ToolExecutionDisplay;