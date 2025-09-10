// Script to check RFP questionnaire responses using Supabase client
// Run this in the browser console or as a Node.js script

const checkQuestionnaireResponses = async () => {
  console.log('=== RFP Questionnaire Response Checker ===');
  
  try {
    // Import Supabase client (if running in browser console on your site)
    const { supabase } = window;
    
    if (!supabase) {
      console.error('❌ Supabase client not available. Make sure you are running this on your app.');
      return;
    }
    
    console.log('🔍 Fetching RFPs with questionnaire responses...');
    
    // Query RFPs ordered by most recent updates
    const { data: rfps, error } = await supabase
      .from('rfps')
      .select('id, name, buyer_questionnaire_response, updated_at')
      .order('updated_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('❌ Error fetching RFPs:', error);
      return;
    }
    
    console.log('\n📊 Recent RFPs (last 10):');
    console.log('================================');
    
    rfps.forEach((rfp, index) => {
      const hasResponse = rfp.buyer_questionnaire_response !== null;
      const status = hasResponse ? '✅ HAS RESPONSE' : '❌ NO RESPONSE';
      
      console.log(`\n${index + 1}. RFP ID: ${rfp.id}`);
      console.log(`   Name: ${rfp.name}`);
      console.log(`   Status: ${status}`);
      console.log(`   Updated: ${new Date(rfp.updated_at).toLocaleString()}`);
      
      if (hasResponse) {
        console.log(`   Response Data:`, rfp.buyer_questionnaire_response);
      }
    });
    
    // Summary statistics
    const totalRfps = rfps.length;
    const rfpsWithResponses = rfps.filter(rfp => rfp.buyer_questionnaire_response !== null).length;
    const responsePercentage = totalRfps > 0 ? (rfpsWithResponses / totalRfps * 100).toFixed(1) : 0;
    
    console.log('\n📈 Summary:');
    console.log('===========');
    console.log(`Total RFPs (last 10): ${totalRfps}`);
    console.log(`RFPs with responses: ${rfpsWithResponses}`);
    console.log(`Response rate: ${responsePercentage}%`);
    
    // Find the most recent response
    const mostRecentWithResponse = rfps.find(rfp => rfp.buyer_questionnaire_response !== null);
    if (mostRecentWithResponse) {
      console.log('\n🎯 Most Recent Questionnaire Response:');
      console.log('=====================================');
      console.log(`RFP: ${mostRecentWithResponse.name} (ID: ${mostRecentWithResponse.id})`);
      console.log(`Submitted: ${new Date(mostRecentWithResponse.updated_at).toLocaleString()}`);
      console.log('Data:', JSON.stringify(mostRecentWithResponse.buyer_questionnaire_response, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
};

// Instructions for use
console.log(`
🔧 How to use this checker:

METHOD 1: Browser Console (Recommended)
1. Open your RFPEZ app in the browser
2. Open browser developer tools (F12)
3. Go to the Console tab
4. Copy and paste this entire script
5. Run: checkQuestionnaireResponses()

METHOD 2: Check specific RFP by ID
const checkSpecificRFP = async (rfpId) => {
  const { data, error } = await supabase
    .from('rfps')
    .select('*')
    .eq('id', rfpId)
    .single();
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('RFP Data:', data);
  console.log('Questionnaire Response:', data.buyer_questionnaire_response);
};

METHOD 3: Database Direct Query (if you have database access)
SELECT id, name, buyer_questionnaire_response, updated_at 
FROM rfps 
WHERE buyer_questionnaire_response IS NOT NULL 
ORDER BY updated_at DESC;
`);

// Export the function for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { checkQuestionnaireResponses };
}
