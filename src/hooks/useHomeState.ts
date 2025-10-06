// Copyright Mark Skiba, 2025 All rights reserved

import { useState, useEffect } from 'react';
import DatabaseService from '../services/database';

export const useHomeState = (userId?: string, isAuthenticated?: boolean) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string>();
  const [currentSessionId, setCurrentSessionId] = useState<string>();
  const [needsSessionRestore, setNeedsSessionRestore] = useState<string | null>(null);

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
          }
        } catch (error) {
          console.error('❌ Failed to restore current session:', error);
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
