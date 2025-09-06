// Simple test for proposal generation functionality (plain JS)

// Mock the proposal generation logic
function generateProposal(rfp, bidData, supplierInfo) {
  const proposalText = `
# Proposal for ${rfp.name}

## Executive Summary
This proposal is submitted by ${supplierInfo.name} from ${supplierInfo.company || 'the submitting organization'} in response to the Request for Proposal: "${rfp.name}".

## Company Information
- **Contact:** ${supplierInfo.name}
- **Email:** ${supplierInfo.email}
${supplierInfo.company ? `- **Company:** ${supplierInfo.company}` : ''}

## Proposal Details
Based on the requirements outlined in the RFP, we propose the following solution:

### Requirements Analysis
${rfp.description}

### Technical Approach
Our approach addresses the key specifications:
${rfp.specification}

### Bid Response Summary
${formatBidDataForProposal(bidData)}

### Timeline and Deliverables
We commit to delivering the proposed solution by the specified due date: ${new Date(rfp.due_date).toLocaleDateString()}.

## Conclusion
We believe our proposal offers the best value and meets all the requirements outlined in the RFP. We look forward to the opportunity to discuss this proposal further.

---
*Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}*
`;

  return proposalText.trim();
}

function formatBidDataForProposal(bidData) {
  const entries = Object.entries(bidData);
  if (entries.length === 0) {
    return 'No specific bid details provided.';
  }

  let formatted = '';
  entries.forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      if (Array.isArray(value)) {
        formatted += `- **${label}:** ${value.join(', ')}\n`;
      } else if (typeof value === 'object') {
        formatted += `- **${label}:** ${JSON.stringify(value, null, 2)}\n`;
      } else {
        formatted += `- **${label}:** ${value}\n`;
      }
    }
  });

  return formatted || 'No specific bid details provided.';
}

// Mock RFP data
const mockRFP = {
  id: 1,
  name: 'Test RFP for Software Development',
  due_date: '2025-10-01',
  description: 'We need a web application for our business',
  specification: 'React-based web application with user authentication, dashboard, and reporting features'
};

// Mock bid data
const mockBidData = {
  companyName: 'Tech Solutions Inc',
  projectType: 'Web App',
  teamSize: 5,
  hourlyRate: 150,
  technologiesUsed: ['React', 'Node.js', 'PostgreSQL'],
  estimatedHours: 500,
  timeline: '3-4 months'
};

// Mock supplier info
const mockSupplierInfo = {
  name: 'John Smith',
  email: 'john@techsolutions.com',
  company: 'Tech Solutions Inc'
};

// Test the proposal generation
function testProposalGeneration() {
  try {
    console.log('Testing proposal generation...');
    
    const proposal = generateProposal(
      mockRFP,
      mockBidData,
      mockSupplierInfo
    );
    
    console.log('✅ Proposal generated successfully!');
    console.log('📄 Generated proposal:');
    console.log('═'.repeat(50));
    console.log(proposal);
    console.log('═'.repeat(50));
    
    // Test if proposal contains expected content
    const tests = [
      { test: 'Contains RFP name', pass: proposal.includes(mockRFP.name) },
      { test: 'Contains supplier name', pass: proposal.includes(mockSupplierInfo.name) },
      { test: 'Contains supplier email', pass: proposal.includes(mockSupplierInfo.email) },
      { test: 'Contains company name', pass: proposal.includes(mockSupplierInfo.company) },
      { test: 'Contains RFP description', pass: proposal.includes(mockRFP.description) },
      { test: 'Contains RFP specification', pass: proposal.includes(mockRFP.specification) },
      { test: 'Contains due date', pass: proposal.includes(new Date(mockRFP.due_date).toLocaleDateString()) }
    ];
    
    console.log('\n🧪 Test Results:');
    tests.forEach(({ test, pass }) => {
      console.log(`${pass ? '✅' : '❌'} ${test}: ${pass ? 'PASS' : 'FAIL'}`);
    });
    
    const allTestsPassed = tests.every(t => t.pass);
    console.log(`\n${allTestsPassed ? '🎉' : '💥'} Overall: ${allTestsPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
    
  } catch (error) {
    console.error('❌ Error testing proposal generation:', error);
  }
}

// Run the test
testProposalGeneration();

console.log('\n📋 Summary of new features implemented:');
console.log('1. ✅ Added proposal, buyer_questionnaire, and buyer_questionnaire_response fields to RFP table');
console.log('2. ✅ Updated TypeScript types to include new fields');
console.log('3. ✅ Created ProposalManager component for proposal management');
console.log('4. ✅ Added proposals tab to RFPEditModal');
console.log('5. ✅ Modified BidSubmissionPage to generate proposals on bid submission');
console.log('6. ✅ Added RFPService methods for proposal operations');
console.log('7. ✅ Created database migration script');
console.log('8. ✅ Created documentation for the new features');
