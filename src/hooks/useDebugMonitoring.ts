// Copyright Mark Skiba, 2025 All rights reserved

import { useEffect } from 'react';
import { AbortControllerMonitor } from '../utils/abortControllerMonitor';

/**
 * Hook to manage debug monitoring and development utilities
 * Handles AbortController monitoring and global debug functions
 */
export const useDebugMonitoring = () => {
  useEffect(() => {
    // DISABLED: AbortController monitoring causes excessive memory pressure
    // AbortControllerMonitor.instance.startMonitoring();
    
    // Add global debug functions
    (window as typeof window & {
      debugAborts?: () => void;
      viewAbortLogs?: () => unknown[];
      clearAbortLogs?: () => void;
    }).debugAborts = () => {
      console.log('🔍 Manual abort debug check triggered');
      AbortControllerMonitor.instance.printReport();
    };
    
    (window as typeof window & {
      debugAborts?: () => void;
      viewAbortLogs?: () => unknown[];
      clearAbortLogs?: () => void;
    }).viewAbortLogs = () => {
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
    
    (window as typeof window & {
      debugAborts?: () => void;
      viewAbortLogs?: () => unknown[];
      clearAbortLogs?: () => void;
    }).clearAbortLogs = () => {
      localStorage.removeItem('abortLogs');
      console.log('🧹 Cleared persistent abort logs');
    };
    
    return () => {
      AbortControllerMonitor.instance.stopMonitoring();
    };
  }, []);
};
