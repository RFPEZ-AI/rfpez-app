// Copyright Mark Skiba, 2025 All rights reserved

import { useState, useEffect, useCallback } from 'react';
import { useIsMobile } from '../utils/useMediaQuery';

const ARTIFACT_WINDOW_STATE_KEY = 'artifactWindowState';
const LAST_SESSION_KEY = 'lastSessionId';

interface ArtifactWindowState {
  isOpen: boolean;
  isCollapsed: boolean;
  selectedArtifactId: string | null;
}

export const useArtifactWindowState = () => {
  const isMobile = useIsMobile();
  
  // Default state: closed on mobile, open on desktop
  const getDefaultState = (): ArtifactWindowState => ({
    isOpen: !isMobile,
    isCollapsed: true, // Start collapsed by default
    selectedArtifactId: null
  });

  const [state, setState] = useState<ArtifactWindowState>(getDefaultState);

  // Load saved state from localStorage on mount
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(ARTIFACT_WINDOW_STATE_KEY);
      if (savedState) {
        const parsedState = JSON.parse(savedState) as ArtifactWindowState;
        setState({
          ...parsedState,
          // Reset selected artifact on page load - will be set by session logic
          selectedArtifactId: null,
          // Respect mobile/desktop preferences for open state
          isOpen: isMobile ? parsedState.isOpen : (!isMobile || parsedState.isOpen)
        });
      } else {
        setState(getDefaultState());
      }
    } catch (error) {
      console.warn('Failed to load artifact window state from localStorage:', error);
      setState(getDefaultState());
    }
  }, [isMobile]);

  // Save state to localStorage when it changes (except selectedArtifactId)
  useEffect(() => {
    try {
      const stateToSave = {
        isOpen: state.isOpen,
        isCollapsed: state.isCollapsed,
        // Don't persist selectedArtifactId
        selectedArtifactId: null
      };
      localStorage.setItem(ARTIFACT_WINDOW_STATE_KEY, JSON.stringify(stateToSave));
    } catch (error) {
      console.warn('Failed to save artifact window state to localStorage:', error);
    }
  }, [state.isOpen, state.isCollapsed]);

  // Functions to manage state
  const openWindow = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: true }));
  }, []);

  const closeWindow = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const toggleWindow = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: !prev.isOpen }));
  }, []);

  const expandWindow = useCallback(() => {
    setState(prev => ({ ...prev, isCollapsed: false }));
  }, []);

  const collapseWindow = useCallback(() => {
    setState(prev => ({ ...prev, isCollapsed: true }));
  }, []);

  const toggleCollapse = useCallback(() => {
    setState(prev => ({ ...prev, isCollapsed: !prev.isCollapsed }));
  }, []);

  const selectArtifact = useCallback((artifactId: string | null) => {
    setState(prev => ({ ...prev, selectedArtifactId: artifactId }));
  }, []);

  // Auto-open window when artifact is added (called from outside)
  const autoOpenForArtifact = useCallback((artifactId: string) => {
    setState(prev => ({
      ...prev,
      isOpen: true,
      isCollapsed: false, // Expand when auto-opening
      selectedArtifactId: artifactId
    }));
  }, []);

  // Reset to blank state for new sessions
  const resetForNewSession = useCallback(() => {
    setState(prev => ({
      ...prev,
      isCollapsed: true, // Start collapsed for new sessions
      isOpen: false, // Start closed for new sessions
      selectedArtifactId: null
    }));
  }, []);

  // Save last session ID for persistence
  const saveLastSession = useCallback((sessionId: string | null) => {
    try {
      if (sessionId) {
        localStorage.setItem(LAST_SESSION_KEY, sessionId);
      } else {
        localStorage.removeItem(LAST_SESSION_KEY);
      }
    } catch (error) {
      console.warn('Failed to save last session ID:', error);
    }
  }, []);

  // Get last session ID
  const getLastSession = useCallback((): string | null => {
    try {
      return localStorage.getItem(LAST_SESSION_KEY);
    } catch (error) {
      console.warn('Failed to get last session ID:', error);
      return null;
    }
  }, []);

  return {
    // State
    isOpen: state.isOpen,
    isCollapsed: state.isCollapsed,
    selectedArtifactId: state.selectedArtifactId,
    
    // Actions
    openWindow,
    closeWindow,
    toggleWindow,
    expandWindow,
    collapseWindow,
    toggleCollapse,
    selectArtifact,
    autoOpenForArtifact,
    resetForNewSession,
    
    // Session persistence
    saveLastSession,
    getLastSession
  };
};