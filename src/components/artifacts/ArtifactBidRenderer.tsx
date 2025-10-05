// Copyright Mark Skiba, 2025 All rights reserved

import React from 'react';
import BidView from '../BidView';

interface ArtifactBidRendererProps {
  currentRfpId: number | null;
  rfpName: string;
}

const ArtifactBidRenderer: React.FC<ArtifactBidRendererProps> = ({ 
  currentRfpId, 
  rfpName 
}) => {
  return (
    <BidView 
      currentRfpId={currentRfpId}
      rfpName={rfpName}
    />
  );
};

export default ArtifactBidRenderer;