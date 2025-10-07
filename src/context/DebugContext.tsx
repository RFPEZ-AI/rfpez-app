// Copyright Mark Skiba, 2025 All rights reserved

import React, { createContext, useContext, useEffect } from 'react';
import { AbortControllerMonitor } from '../utils/abortControllerMonitor';

// Import debug utilities in development
import '../utils/clickableElementDecorator';
import '../utils/testIdManager';
import '../utils/rfpDesignerDebugger';
import '../utils/claudeMessageDiagnosis';
import '../test-claude-functions';

interface DebugContextType {
  debugAborts: () => void;
  viewAbortLogs: () => unknown[];
  clearAbortLogs: () => void;
}

const DebugContext = createContext<DebugContextType | undefined>(undefined);

export const useDebug = () => {
  const context = useContext(DebugContext);
  if (!context) {
    throw new Error('useDebug must be used within a DebugProvider');
  }
  return context;
};

interface DebugProviderProps {
  children: React.ReactNode;
}

export const DebugProvider: React.FC<DebugProviderProps> = ({ children }) => {
  useEffect(() => {
    // DISABLED: AbortController monitoring causes excessive memory pressure
    // console.log('🔧 Initializing AbortController monitoring for debugging');
    // AbortControllerMonitor.instance.startMonitoring();
    
    // Add global debug functions
    const debugAborts = () => {
      console.log('🔍 Manual abort debug check triggered');
      AbortControllerMonitor.instance.printReport();
    };
    
    const viewAbortLogs = () => {
      try {
        const logs = JSON.parse(localStorage.getItem('abortLogs') || '[]');
        console.group('📊 PERSISTENT ABORT LOGS');
        console.log('Total stored abort events:', logs.length);
        logs.forEach((log: Record<string, unknown>, index: number) => {
          console.group(`🚨 Abort #${index + 1} (${new Date(String(log.timestamp)).toLocaleString()})`);
          console.log('Request ID:', log.requestId);
          console.log('Duration before abort:', log.duration + 'ms');
          console.log('Reason:', log.reason);
          console.log('Message:', log.messageContent);
          console.log('Agent:', log.agentName);
          console.log('Controller matches:', log.controllerMatches);
          console.log('URL:', log.url);
          console.log('Stack trace:', log.stackTrace);
          console.groupEnd();
        });
        console.groupEnd();
        return logs;
      } catch (error) {
        console.error('❌ Failed to read abort logs:', error);
        return [];
      }
    };
    
    const clearAbortLogs = () => {
      localStorage.removeItem('abortLogs');
      console.log('🧹 Cleared persistent abort logs');
    };

    // Add to window for global access
    (window as typeof window & {
      debugAborts?: () => void;
      viewAbortLogs?: () => unknown[];
      clearAbortLogs?: () => void;
    }).debugAborts = debugAborts;
    
    (window as typeof window & {
      debugAborts?: () => void;
      viewAbortLogs?: () => unknown[];
      clearAbortLogs?: () => void;
    }).viewAbortLogs = viewAbortLogs;
    
    (window as typeof window & {
      debugAborts?: () => void;
      viewAbortLogs?: () => unknown[];
      clearAbortLogs?: () => void;
    }).clearAbortLogs = clearAbortLogs;
    
    return () => {
      AbortControllerMonitor.instance.stopMonitoring();
    };
  }, []);

  const contextValue: DebugContextType = {
    debugAborts: () => {
      console.log('🔍 Manual abort debug check triggered');
      AbortControllerMonitor.instance.printReport();
    },
    viewAbortLogs: () => {
      try {
        const logs = JSON.parse(localStorage.getItem('abortLogs') || '[]');
        console.group('📊 PERSISTENT ABORT LOGS');
        console.log('Total stored abort events:', logs.length);
        logs.forEach((log: Record<string, unknown>, index: number) => {
          console.group(`🚨 Abort #${index + 1} (${new Date(String(log.timestamp)).toLocaleString()})`);
          console.log('Request ID:', log.requestId);
          console.log('Duration before abort:', log.duration + 'ms');
          console.log('Reason:', log.reason);
          console.log('Message:', log.messageContent);
          console.log('Agent:', log.agentName);
          console.log('Controller matches:', log.controllerMatches);
          console.log('URL:', log.url);
          console.log('Stack trace:', log.stackTrace);
          console.groupEnd();
        });
        console.groupEnd();
        return logs;
      } catch (error) {
        console.error('❌ Failed to read abort logs:', error);
        return [];
      }
    },
    clearAbortLogs: () => {
      localStorage.removeItem('abortLogs');
      console.log('🧹 Cleared persistent abort logs');
    }
  };

  return (
    <DebugContext.Provider value={contextValue}>
      {children}
    </DebugContext.Provider>
  );
};