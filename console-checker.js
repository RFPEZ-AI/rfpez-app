// Copy and paste this entire script into your browser console
// Make sure you're on your RFPEZ app page when running this

(async function() {
  console.log('=== RFP Questionnaire Response Checker ===');
  
  try {
    // Try to access the Supabase client from the global scope
    let supabaseClient = null;
    
    // Different ways the Supabase client might be available
    if (window.supabase) {
      supabaseClient = window.supabase;
    } else if (window.__SUPABASE_CLIENT__) {
      supabaseClient = window.__SUPABASE_CLIENT__;
    } else {
      console.log('🔍 Searching for Supabase client in global scope...');
      
      // Look for any variable that might be the Supabase client
      const possibleClients = Object.keys(window).filter(key => 
        key.toLowerCase().includes('supabase') || 
        (window[key] && typeof window[key] === 'object' && window[key].from)
      );
      
      console.log('Possible Supabase clients found:', possibleClients);
      
      if (possibleClients.length > 0) {
        supabaseClient = window[possibleClients[0]];
      }
    }
    
    if (!supabaseClient || !supabaseClient.from) {
      console.error('❌ Supabase client not found in global scope.');
      console.log('🔧 Alternative: Check Network tab in DevTools for PATCH requests to /api/rfps/');
      console.log('🔧 Alternative: Check Application > Local Storage for any cached data');
      console.log('🔧 Alternative: Run this in the browser where your app is loaded');
      return;
    }
    
    console.log('✅ Supabase client found!');
    console.log('🔍 Fetching RFPs with questionnaire responses...');
    
    // Query RFPs ordered by most recent updates
    const { data: rfps, error } = await supabaseClient
      .from('rfps')
      .select('id, name, buyer_questionnaire_response, updated_at, created_at')
      .order('updated_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('❌ Error fetching RFPs:', error);
      return;
    }
    
    console.log('\n📊 Recent RFPs (last 10):');
    console.log('================================');
    
    if (!rfps || rfps.length === 0) {
      console.log('❌ No RFPs found in database');
      return;
    }
    
    rfps.forEach((rfp, index) => {
      const hasResponse = rfp.buyer_questionnaire_response !== null && rfp.buyer_questionnaire_response !== undefined;
      const status = hasResponse ? '✅ HAS RESPONSE' : '❌ NO RESPONSE';
      
      console.log(`\n${index + 1}. RFP ID: ${rfp.id}`);
      console.log(`   Name: ${rfp.name}`);
      console.log(`   Status: ${status}`);
      console.log(`   Created: ${new Date(rfp.created_at).toLocaleString()}`);
      console.log(`   Updated: ${new Date(rfp.updated_at).toLocaleString()}`);
      
      if (hasResponse) {
        console.log(`   Response Data:`, rfp.buyer_questionnaire_response);
        console.log(`   Response Keys:`, Object.keys(rfp.buyer_questionnaire_response || {}));
      }
    });
    
    // Summary statistics
    const totalRfps = rfps.length;
    const rfpsWithResponses = rfps.filter(rfp => rfp.buyer_questionnaire_response !== null && rfp.buyer_questionnaire_response !== undefined).length;
    const responsePercentage = totalRfps > 0 ? (rfpsWithResponses / totalRfps * 100).toFixed(1) : 0;
    
    console.log('\n📈 Summary:');
    console.log('===========');
    console.log(`Total RFPs (last 10): ${totalRfps}`);
    console.log(`RFPs with responses: ${rfpsWithResponses}`);
    console.log(`Response rate: ${responsePercentage}%`);
    
    // Find the most recent response
    const mostRecentWithResponse = rfps.find(rfp => rfp.buyer_questionnaire_response !== null && rfp.buyer_questionnaire_response !== undefined);
    if (mostRecentWithResponse) {
      console.log('\n🎯 Most Recent Questionnaire Response:');
      console.log('=====================================');
      console.log(`RFP: ${mostRecentWithResponse.name} (ID: ${mostRecentWithResponse.id})`);
      console.log(`Submitted: ${new Date(mostRecentWithResponse.updated_at).toLocaleString()}`);
      console.log('Data:', JSON.stringify(mostRecentWithResponse.buyer_questionnaire_response, null, 2));
    } else {
      console.log('\n❌ No questionnaire responses found in any RFP');
    }
    
    // Check if there's a specific catering RFP
    const cateringRfp = rfps.find(rfp => rfp.name.toLowerCase().includes('catering'));
    if (cateringRfp) {
      console.log('\n🍽️ Catering RFP Found:');
      console.log('======================');
      console.log(`Name: ${cateringRfp.name}`);
      console.log(`ID: ${cateringRfp.id}`);
      console.log(`Has Response: ${cateringRfp.buyer_questionnaire_response ? 'YES' : 'NO'}`);
      if (cateringRfp.buyer_questionnaire_response) {
        console.log('Response:', cateringRfp.buyer_questionnaire_response);
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    console.log('🔧 Make sure you are running this on the page where your RFPEZ app is loaded');
  }
})();

// Also make the function available globally for manual calls
window.checkQuestionnaireResponses = async function() {
  console.log('Running questionnaire response check...');
  // Re-run the above logic
};
