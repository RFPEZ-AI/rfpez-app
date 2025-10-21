// Copyright Mark Skiba, 2025 All rights reserved

import { useState, useEffect } from 'react';
import DatabaseService from '../services/database';

export const useHomeState = (userId?: string, isAuthenticated?: boolean) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string>();
  const [currentSessionId, setCurrentSessionId] = useState<string>();
  // Tri-state: undefined = not checked yet, null = checked but no session, 'session-id' = session to restore
  const [needsSessionRestore, setNeedsSessionRestore] = useState<string | null | undefined>(undefined);

  // CRITICAL FIX: Restore current session from database on app load
  // This ensures the user stays in their current session after page refresh
  useEffect(() => {
    const restoreCurrentSession = async () => {
      if (isAuthenticated && userId) {
        console.log('🔄 Restoring current session from database for user:', userId);
        try {
          const sessionId = await DatabaseService.getUserCurrentSession();
          if (sessionId) {
            console.log('✅ Current session restored:', sessionId);
            setCurrentSessionId(sessionId);
            setSelectedSessionId(sessionId);
            // Signal that this session needs full restoration (messages, agent, artifacts)
            setNeedsSessionRestore(sessionId);
          } else {
            console.log('ℹ️ No current session found in database');
            // Set to null to indicate we checked but found nothing
            setNeedsSessionRestore(null);
          }
        } catch (error) {
          console.error('❌ Failed to restore current session:', error);
          // Set to null on error so we don't block loading default agent
          setNeedsSessionRestore(null);
        }
      }
    };

    restoreCurrentSession();
  }, [isAuthenticated, userId]);

  return {
    isLoading,
    setIsLoading,
    selectedSessionId,
    setSelectedSessionId,
    currentSessionId,
    setCurrentSessionId,
    needsSessionRestore,
    setNeedsSessionRestore
  };
};
