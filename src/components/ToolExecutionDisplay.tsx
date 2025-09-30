// Copyright Mark Skiba, 2025 All rights reserved
// Tool Execution Display Component - Shows real-time Claude tool invocations

import React, { useState, useEffect } from 'react';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonChip,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonProgressBar,
  IonSpinner,
  IonText,
  IonBadge
} from '@ionic/react';
import {
  constructOutline,
  checkmarkCircleOutline,
  alertCircleOutline,
  timeOutline,
  flashOutline
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
  const [visibleTools, setVisibleTools] = useState<ToolInvocationEvent[]>([]);
  const [activeTools, setActiveTools] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Update visible tools when new invocations arrive
    setVisibleTools(toolInvocations);
    
    // Track active tools
    const active = new Set<string>();
    toolInvocations.forEach(tool => {
      if (tool.type === 'tool_start' || tool.type === 'tool_progress') {
        active.add(tool.toolName);
      }
    });
    setActiveTools(active);
  }, [toolInvocations]);

  const getToolIcon = (type: string) => {
    switch (type) {
      case 'tool_start':
        return <IonSpinner name="dots" color="primary" />;
      case 'tool_progress':
        return <IonIcon icon={timeOutline} color="warning" />;
      case 'tool_complete':
        return <IonIcon icon={checkmarkCircleOutline} color="success" />;
      case 'tool_error':
        return <IonIcon icon={alertCircleOutline} color="danger" />;
      default:
        return <IonIcon icon={constructOutline} color="medium" />;
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

  return (
    <IonCard className={`tool-execution-display ${className}`}>
      <IonCardHeader>
        <IonCardTitle>
          <IonIcon icon={flashOutline} color="primary" className="mr-2" />
          Tool Execution
          {activeTools.size > 0 && (
            <IonBadge color="primary" className="ml-2">
              {activeTools.size} active
            </IonBadge>
          )}
        </IonCardTitle>
      </IonCardHeader>
      
      <IonCardContent>
        {toolInvocations.length === 0 && isActive && (
          <IonItem>
            <IonSpinner name="dots" slot="start" />
            <IonLabel>
              <h3>Waiting for Claude to select tools...</h3>
              <p>Claude will automatically choose the appropriate tools based on your request</p>
            </IonLabel>
          </IonItem>
        )}

        {toolInvocations.length > 0 && (
          <IonList>
            {visibleTools.map((tool, index) => (
              <IonItem key={`${tool.toolName}-${index}-${tool.timestamp}`}>
                <div slot="start">
                  {getToolIcon(tool.type)}
                </div>
                
                <IonLabel>
                  <h3>
                    {getToolDisplayName(tool.toolName)}
                    {tool.type === 'tool_start' && (
                      <IonProgressBar className="ml-2" />
                    )}
                  </h3>
                  
                  <p className="tool-status">
                    {tool.type === 'tool_start' && 'Starting execution...'}
                    {tool.type === 'tool_progress' && 'In progress...'}
                    {tool.type === 'tool_complete' && `Completed ${getExecutionTime(tool) ? `in ${getExecutionTime(tool)}` : ''}`}
                    {tool.type === 'tool_error' && `Error: ${tool.error || 'Unknown error'}`}
                  </p>
                  
                  {tool.parameters && Object.keys(tool.parameters).length > 0 && (
                    <div className="tool-parameters">
                      {Object.entries(tool.parameters).slice(0, 2).map(([key, value]) => (
                        <IonChip key={key} color="light">
                          <IonText className="text-xs">
                            {key}: {typeof value === 'string' ? value.substring(0, 20) + (value.length > 20 ? '...' : '') : JSON.stringify(value).substring(0, 20)}
                          </IonText>
                        </IonChip>
                      ))}
                    </div>
                  )}
                </IonLabel>
                
                <IonChip slot="end" color={getToolColor(tool.type)}>
                  {tool.type.replace('tool_', '')}
                </IonChip>
              </IonItem>
            ))}
          </IonList>
        )}
        
        {!isActive && toolInvocations.length > 0 && (
          <IonItem>
            <IonIcon icon={checkmarkCircleOutline} slot="start" color="success" />
            <IonLabel>
              <h3>All tools completed</h3>
              <p>{toolInvocations.length} tool{toolInvocations.length !== 1 ? 's' : ''} executed successfully</p>
            </IonLabel>
          </IonItem>
        )}
      </IonCardContent>
    </IonCard>
  );
};

export default ToolExecutionDisplay;