// Copyright Mark Skiba, 2025 All rights reserved

import { useState, useEffect } from 'react';
import DatabaseService from '../services/database';

export const useHomeState = (userId?: string, isAuthenticated?: boolean) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string>();
  const [currentSessionId, setCurrentSessionId] = useState<string>();
  // Tri-state: undefined = not checked yet, null = checked but no session, 'session-id' = session to restore
  const [needsSessionRestore, setNeedsSessionRestore] = useState<string | null | undefined>(undefined);

  // CRITICAL FIX: Restore current session on app load
  // Priority: localStorage first (faster, more reliable), then database
  // This ensures the user stays in their current session after page refresh
  useEffect(() => {
    const restoreCurrentSession = async () => {
      if (isAuthenticated && userId) {
        console.log('🔄 Restoring current session for user:', userId);
        
        // PRIORITY 1: Check localStorage first (fast and reliable)
        const localSessionId = localStorage.getItem('rfpez_last_session');
        if (localSessionId) {
          console.log('✅ Current session restored from localStorage:', localSessionId);
          setCurrentSessionId(localSessionId);
          setSelectedSessionId(localSessionId);
          // Signal that this session needs full restoration (messages, agent, artifacts)
          setNeedsSessionRestore(localSessionId);
          return; // Done - no need to check database
        }
        
        // PRIORITY 2: Fallback to database if localStorage is empty
        console.log('ℹ️ No session in localStorage, checking database...');
        try {
          const sessionId = await DatabaseService.getUserCurrentSession();
          if (sessionId) {
            console.log('✅ Current session restored from database:', sessionId);
            setCurrentSessionId(sessionId);
            setSelectedSessionId(sessionId);
            // Signal that this session needs full restoration (messages, agent, artifacts)
            setNeedsSessionRestore(sessionId);
            // Update localStorage with database session for next time
            localStorage.setItem('rfpez_last_session', sessionId);
          } else {
            console.log('ℹ️ No current session found in database or localStorage');
            // Set to null to indicate we checked but found nothing
            setNeedsSessionRestore(null);
          }
        } catch (error) {
          console.error('❌ Failed to restore current session from database:', error);
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
