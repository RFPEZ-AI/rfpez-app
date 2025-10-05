// Copyright Mark Skiba, 2025 All rights reserved

import React from 'react';
import { SingletonArtifactWindowProps } from '../types/home';
import ArtifactContainer from './ArtifactContainer';

/**
 * ArtifactWindow - Legacy wrapper component for backward compatibility
 * 
 * This component now delegates to ArtifactContainer, which contains the actual
 * implementation. This maintains existing imports while allowing the refactored
 * component structure to work properly.
 */
const ArtifactWindow: React.FC<SingletonArtifactWindowProps> = (props) => {
  return <ArtifactContainer {...props} />;
};

export default ArtifactWindow;