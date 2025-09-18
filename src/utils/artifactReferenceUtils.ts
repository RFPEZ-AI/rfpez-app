import { ArtifactReference } from '../types/home';

interface TestArtifact {
  type?: string;
  content?: string;
  content_type?: string;
  name?: string;
  tags?: string[];
  [key: string]: unknown;
}

// Test utility to simulate artifact reference creation from proposal artifacts
export const createArtifactReference = (artifact: TestArtifact): ArtifactReference => {
  // This simulates the logic that would create an artifact reference from the artifact data
  // Based on your JSON structure: { "type": "text", "content": "...", "content_type": "markdown" }
  
  let artifactType: 'document' | 'text' | 'image' | 'pdf' | 'form' | 'other' = 'document';
  
  if (artifact.type) {
    // Map the artifact type to the reference type
    switch (artifact.type) {
      case 'text':
        artifactType = 'text';
        break;
      case 'document':
        artifactType = 'document';
        break;
      case 'form':
        artifactType = 'form';
        break;
      case 'image':
        artifactType = 'image';
        break;
      case 'pdf':
        artifactType = 'pdf';
        break;
      default:
        artifactType = 'other';
    }
  }
  
  // Check if it's a proposal with text content - should be text/document, never form
  if (artifact.content && artifact.content_type === 'markdown' && 
      (artifact.tags?.includes('proposal') || artifact.content.includes('proposal'))) {
    // Ensure proposals are treated as documents or text, not forms
    if (artifactType === 'form') {
      artifactType = artifact.type === 'text' ? 'text' : 'document';
    }
  }
  
  return {
    artifactId: `test-${Date.now()}`,
    artifactName: artifact.name || 'Test Artifact',
    artifactType,
    isCreated: true
  };
};

// Test the logic with your actual proposal data
export const testProposalArtifactMapping = () => {
  const proposalArtifact = {
    "tags": [
      "proposal",
      "rfp", 
      "4"
    ],
    "type": "text",
    "rfp_id": "4",
    "content": "# Proposal for catering\n\n## Executive Summary\nThis proposal is submitted by the submitting organization in response to the Request for Proposal: \"catering\".\n\n## Company Information\n- **Contact:** Not provided\n- **Email:** Not provided\n\n\n## Proposal Details\nBased on the requirements outlined in the RFP, we propose the following solution:\n\n### Requirements Analysis\nCatering for party of 25\n\n### Technical Approach\nOur approach addresses the key specifications:\ncompany name\nmenu\nprice\n\n### Questionnaire Response Summary\nNo questionnaire response data available.\n\n### Timeline and Deliverables\nWe commit to delivering the proposed solution by the specified due date: 12/31/2025.\n\n\n### Pricing\nCompetitive pricing details will be provided based on the specific requirements and scope of work outlined in this proposal.\n\n\n## Conclusion\nWe believe our proposal offers the best value and meets all the requirements outlined in the RFP. We look forward to the opportunity to discuss this proposal further.\n\n---\n*Generated on 9/13/2025 at 1:49:55 PM*",
    "content_type": "markdown",
    "name": "Catering Services Proposal for 25-Person Event"
  };
  
  const artifactRef = createArtifactReference(proposalArtifact);
  
  console.log('Proposal artifact mapping test:');
  console.log('Input artifact type:', proposalArtifact.type);
  console.log('Output artifactType:', artifactRef.artifactType);
  console.log('Should be "text", not "form"');
  
  return artifactRef;
};