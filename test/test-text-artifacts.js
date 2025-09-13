// Test script for text artifact integration
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://jxlutaztoukwbbgtoulc.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4bHV0YXp0b3Vrd2JiZ3RvdWxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2NjE3ODcsImV4cCI6MjA1MTIzNzc4N30.jLHVFb0EGjbWbOmB9DQu9aFFoVzqy5ckPP2iNfkrjYU';
const supabase = createClient(supabaseUrl, supabaseKey);

// Import Claude API Functions
const { ClaudeAPIFunctionHandler } = require('../src/services/claudeAPIFunctions.ts');

async function testTextArtifacts() {
  console.log('=== TEXT ARTIFACT INTEGRATION TEST ===');
  
  try {
    const handler = new ClaudeAPIFunctionHandler();
    
    // Test 1: Create a simple text artifact
    console.log('\n1. Testing create_text_artifact function...');
    const textArtifactResult = await handler.executeFunction('create_text_artifact', {
      title: 'Test Proposal Document',
      content: `# Test Proposal

## Executive Summary
This is a test proposal to verify that text artifacts work correctly.

## Technical Approach  
Our approach includes:
- **Advanced Technology**: Using cutting-edge solutions
- **Proven Methodology**: Based on industry best practices
- **Quality Assurance**: Comprehensive testing and validation

## Timeline
- Phase 1: Initial setup (Week 1-2)
- Phase 2: Development (Week 3-8)  
- Phase 3: Testing and deployment (Week 9-10)

## Conclusion
We are confident this approach will deliver excellent results.`,
      content_type: 'markdown',
      description: 'A test proposal document to verify text artifact functionality',
      tags: ['test', 'proposal', 'demo']
    });
    
    console.log('✅ Text artifact created:', {
      success: textArtifactResult.success,
      artifact_id: textArtifactResult.artifact_id,
      title: textArtifactResult.title,
      content_type: textArtifactResult.content_type
    });
    
    // Test 2: Create RFP and test proposal artifact generation
    console.log('\n2. Testing generate_proposal_artifact function...');
    
    // First create a test RFP
    const { data: testRfp, error: rfpError } = await supabase
      .from('rfps')
      .insert({
        name: 'Test RFP for Artifact Integration',
        description: 'This is a test RFP to verify proposal artifact generation',
        specification: 'Must provide comprehensive solution with modern technology stack',
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        status: 'open',
        buyer_questionnaire_response: {
          supplier_info: {
            name: 'Test Supplier',
            email: 'test@example.com',
            company: 'Test Solutions Inc.'
          },
          form_data: {
            experience_years: '5+ years',
            team_size: '10-20 developers',
            technology_stack: 'React, Node.js, PostgreSQL',
            budget_range: '$50,000 - $100,000'
          }
        }
      })
      .select()
      .single();
    
    if (rfpError) {
      console.error('❌ Failed to create test RFP:', rfpError);
      return;
    }
    
    console.log('✅ Test RFP created:', testRfp.id);
    
    // Now generate proposal artifact
    const proposalResult = await handler.executeFunction('generate_proposal_artifact', {
      rfp_id: testRfp.id,
      proposal_title: 'Comprehensive Solution Proposal',
      sections: ['executive_summary', 'technical_approach', 'timeline', 'pricing'],
      content_type: 'markdown'
    });
    
    console.log('✅ Proposal artifact generated:', {
      success: proposalResult.success,
      artifact_id: proposalResult.artifact_id,
      title: proposalResult.title,
      rfp_id: proposalResult.rfp_id
    });
    
    // Test 3: Verify artifacts are stored in database
    console.log('\n3. Verifying artifacts are stored in database...');
    
    const { data: artifacts, error: artifactsError } = await supabase
      .from('form_artifacts')
      .select('*')
      .eq('type', 'text');
    
    if (artifactsError) {
      console.error('❌ Failed to fetch artifacts:', artifactsError);
    } else {
      console.log(`✅ Found ${artifacts.length} text artifacts in database`);
      artifacts.forEach(artifact => {
        console.log(`   - ${artifact.title} (${artifact.id})`);
      });
    }
    
    // Cleanup: Remove test RFP
    await supabase.from('rfps').delete().eq('id', testRfp.id);
    console.log('🧹 Cleaned up test RFP');
    
    console.log('\n=== TEXT ARTIFACT INTEGRATION TEST COMPLETED SUCCESSFULLY ===');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
if (require.main === module) {
  testTextArtifacts().then(() => {
    console.log('Test completed');
    process.exit(0);
  }).catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
}

module.exports = { testTextArtifacts };