// Copyright Mark Skiba, 2025. All rights reserved.

import { useState, useCallback } from 'react';

// Storage keys for persistence
const LAST_SESSION_KEY = 'rfpez_last_session';
const SELECTED_ARTIFACT_KEY = 'rfpez_selected_artifact';

export interface ArtifactWindowState {
  isOpen: boolean;
  isCollapsed: boolean;
  selectedArtifactId: string | null;
}

export interface ArtifactWindowActions {
  openWindow: () => void;
  closeWindow: () => void;
  toggleWindow: () => void;
  collapseWindow: () => void;
  expandWindow: () => void;
  toggleCollapse: () => void;
  selectArtifact: (artifactId: string | null) => void;
  saveLastSession: (sessionId: string | null) => void;
  getLastSession: () => string | null;
  saveSessionArtifact: (sessionId: string | null, artifactId: string | null) => void;
  restoreSessionArtifact: (sessionId: string) => string | null;
  autoOpenForArtifact: (artifactId: string | null) => void;
  resetForNewSession: () => void;
}

export type UseArtifactWindowStateReturn = ArtifactWindowState & ArtifactWindowActions;

export const useArtifactWindowState = (): UseArtifactWindowStateReturn => {
  const [state, setState] = useState<ArtifactWindowState>({
    isOpen: false, // Start closed by default
    isCollapsed: false,
    selectedArtifactId: null
  });

  // Window state management
  const openWindow = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: true }));
  }, []);

  const closeWindow = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const toggleWindow = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: !prev.isOpen }));
  }, []);

  const collapseWindow = useCallback(() => {
    setState(prev => ({ ...prev, isCollapsed: true }));
  }, []);

  const expandWindow = useCallback(() => {
    setState(prev => ({ ...prev, isCollapsed: false }));
  }, []);

  const toggleCollapse = useCallback(() => {
    setState(prev => ({ ...prev, isCollapsed: !prev.isCollapsed }));
  }, []);

  // Artifact selection
  const selectArtifact = useCallback((artifactId: string | null) => {
    setState(prev => ({ ...prev, selectedArtifactId: artifactId }));
    if (artifactId) {
      localStorage.setItem(SELECTED_ARTIFACT_KEY, artifactId);
    } else {
      localStorage.removeItem(SELECTED_ARTIFACT_KEY);
    }
  }, []);

  // Session management
  const saveLastSession = useCallback((sessionId: string | null) => {
    if (sessionId) {
      localStorage.setItem(LAST_SESSION_KEY, sessionId);
    } else {
      localStorage.removeItem(LAST_SESSION_KEY);
    }
  }, []);

  const getLastSession = useCallback((): string | null => {
    return localStorage.getItem(LAST_SESSION_KEY);
  }, []);

  const saveSessionArtifact = useCallback((sessionId: string | null, artifactId: string | null) => {
    if (sessionId && artifactId) {
      localStorage.setItem(`rfpez_session_artifact_${sessionId}`, artifactId);
    }
  }, []);

  const restoreSessionArtifact = useCallback((sessionId: string): string | null => {
    return localStorage.getItem(`rfpez_session_artifact_${sessionId}`);
  }, []);

  const autoOpenForArtifact = useCallback((artifactId: string | null) => {
    if (artifactId) {
      setState(prev => ({ 
        ...prev, 
        isOpen: true, 
        isCollapsed: false,
        selectedArtifactId: artifactId 
      }));
      localStorage.setItem(SELECTED_ARTIFACT_KEY, artifactId);
    }
  }, []);

  const resetForNewSession = useCallback(() => {
    setState({
      isOpen: false, // Start closed for new sessions
      isCollapsed: false,
      selectedArtifactId: null
    });
    localStorage.removeItem(SELECTED_ARTIFACT_KEY);
  }, []);

  return {
    ...state,
    openWindow,
    closeWindow,
    toggleWindow,
    collapseWindow,
    expandWindow,
    toggleCollapse,
    selectArtifact,
    saveLastSession,
    getLastSession,
    saveSessionArtifact,
    restoreSessionArtifact,
    autoOpenForArtifact,
    resetForNewSession
  };
};
