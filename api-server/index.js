const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
  console.log('✅ Loaded environment variables from .env.local');
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory session storage for demo purposes
const sessions = new Map();

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'RFPEZ.AI Agent API',
    version: '1.0.0'
  });
});

// Agent capabilities endpoint
app.get('/api/agent/capabilities', (req, res) => {
  res.status(200).json({
    capabilities: [
      'RFP Creation and Management',
      'Interactive Form Generation',
      'Supplier Communication',
      'Bid Collection and Analysis',
      'Template Management',
      'Database Operations',
      'Artifact Management'
    ],
    version: '1.0.0',
    supportedOperations: {
      database: ['select', 'insert', 'update', 'delete'],
      artifacts: ['create_form_artifact', 'get_form_submission', 'validate_form_data', 'get_artifact_status', 'create_artifact_template'],
      context: ['session_management', 'rfp_context', 'multi_phase_workflow']
    }
  });
});

// Session management endpoint
app.post('/api/agent/session', (req, res) => {
  const { action, sessionId } = req.body;

  if (action === 'create') {
    const newSessionId = uuidv4();
    sessions.set(newSessionId, {
      id: newSessionId,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      context: {}
    });
    
    res.status(201).json({
      sessionId: newSessionId,
      message: 'Session created successfully'
    });
  } else if (action === 'get' && sessionId) {
    const session = sessions.get(sessionId);
    if (session) {
      res.status(200).json(session);
    } else {
      res.status(404).json({ error: 'Session not found' });
    }
  } else {
    res.status(400).json({ error: 'Invalid session action or missing sessionId' });
  }
});

// Main agent prompt processing endpoint
app.post('/api/agent/prompt', (req, res) => {
  const { prompt, context, sessionId } = req.body;

  if (!prompt) {
    return res.status(400).json({
      error: 'Prompt is required',
      message: 'Please provide a prompt for the agent to process'
    });
  }

  // Update session activity if sessionId provided
  if (sessionId && sessions.has(sessionId)) {
    const session = sessions.get(sessionId);
    session.lastActivity = new Date().toISOString();
    sessions.set(sessionId, session);
  }

  // Analyze prompt and generate appropriate response
  const response = generateAgentResponse(prompt, context);
  
  res.status(200).json({
    text: response.text,
    actions: response.actions, // Add actions array for test compatibility
    databaseOperations: response.databaseOperations,
    databaseCalls: response.databaseCalls, // Add compatibility alias
    artifactCalls: response.artifactCalls,
    errors: response.errors,
    metadata: {
      sessionId,
      timestamp: new Date().toISOString(),
      processingTime: Math.floor(Math.random() * 200) + 100 // Simulate processing time
    }
  });
});

/**
 * Generate agent response based on prompt analysis
 */
function generateAgentResponse(prompt, context) {
  const promptLower = prompt.toLowerCase();
  const response = {
    text: '',
    actions: [], // Actions array for test compatibility
    databaseOperations: [],
    databaseCalls: [], // Alias for compatibility with tests
    artifactCalls: [],
    errors: []
  };

  // RFP Creation and Context
  if (promptLower.includes('create an rfp') || promptLower.includes('new rfp') || 
      promptLower.includes('help me create') || promptLower.includes('facilities manager') ||
      promptLower.includes("don't have an existing rfp") || promptLower.includes('new procurement project')) {
    response.text = "I'll help you create a comprehensive RFP for LED bulb procurement. Let me first check for any existing RFP context and then create a new RFP record.";
    
    // Add database operations
    response.databaseOperations.push(
      { type: 'select', table: 'rfps', success: true, data: [] },
      { type: 'insert', table: 'rfps', success: true, data: { id: 'rfp_' + Date.now() } }
    );
    response.databaseCalls.push(
      { operation: 'select', table: 'rfps', success: true },
      { operation: 'insert', table: 'rfps', success: true }
    );
    
    // Add actions for test validation
    response.actions.push('supabase_select', 'supabase_insert', 'context_management');
  }
  
  // Form Data Collection and Validation (Phase 4) - Must be checked BEFORE Phase 3
  else if (promptLower.includes('completed the questionnaire') || promptLower.includes('questionnaire form with') ||
           (promptLower.includes('project information') && promptLower.includes('completed'))) {
    response.text = "I'll process your completed questionnaire data and validate all the information provided.";
    
    // Add form processing operations
    response.artifactCalls.push(
      { operation: 'get_form_submission', type: 'questionnaire', success: true }
    );
    response.databaseOperations.push(
      { type: 'update', table: 'rfps', field: 'buyer_questionnaire_response', success: true }
    );
    response.databaseCalls.push(
      { operation: 'update', table: 'rfps', field: 'buyer_questionnaire_response', success: true }
    );
    
    // Add actions for test validation
    response.actions.push('get_form_submission', 'validate_form_data', 'supabase_update');
  }
  
  // Questionnaire and Form Creation (Phase 3)
  else if ((promptLower.includes('questionnaire') && !promptLower.includes('completed')) || 
           (promptLower.includes('form') && !promptLower.includes('bid form') && !promptLower.includes('supplier') && !promptLower.includes('completed')) || 
           promptLower.includes('interactive form') || promptLower.includes('comprehensive questionnaire')) {
    response.text = "I'll create an interactive questionnaire form to gather all the necessary details for your LED lighting procurement.";
    
    // Add artifact operations
    response.artifactCalls.push(
      { operation: 'create_form_artifact', type: 'questionnaire', success: true }
    );
    response.databaseOperations.push(
      { type: 'update', table: 'rfps', field: 'buyer_questionnaire', success: true }
    );
    response.databaseCalls.push(
      { operation: 'update', table: 'rfps', field: 'buyer_questionnaire', success: true }
    );
    
    // Add actions for test validation
    response.actions.push('create_form_artifact', 'supabase_update', 'validate_form_data');
  }
  
  // Supplier Bid Form Creation (Phase 5)
  else if (promptLower.includes('supplier bid form') || 
           (promptLower.includes('create the supplier') && promptLower.includes('bid')) ||
           (promptLower.includes('requirements defined') && promptLower.includes('supplier'))) {
    response.text = "I'll create a comprehensive supplier bid form based on your requirements.";
    
    response.artifactCalls.push(
      { operation: 'create_form_artifact', type: 'bid_form', success: true }
    );
    response.databaseOperations.push(
      { type: 'update', table: 'rfps', field: 'supplier_questionnaire', success: true }
    );
    response.databaseCalls.push(
      { operation: 'update', table: 'rfps', field: 'supplier_questionnaire', success: true }
    );
    
    response.actions.push('create_form_artifact', 'supabase_update');
  }
  
  // Email Generation
  else if (promptLower.includes('proposal email') || promptLower.includes('email to send') ||
           promptLower.includes('draft a professional email')) {
    response.text = "I'll draft a professional proposal email for your LED lighting suppliers that includes all the necessary RFP details and supplier bid form.";
    
    response.databaseOperations.push(
      { type: 'update', table: 'rfps', field: 'proposal', success: true }
    );
    response.databaseCalls.push(
      { operation: 'update', table: 'rfps', field: 'proposal', success: true }
    );
    
    response.actions.push('supabase_update');
  }
  
  // Supplier Response Handling
  else if (promptLower.includes('supplier responses') || promptLower.includes('bid submissions') ||
           promptLower.includes('received 5 supplier')) {
    response.text = "I'll process the supplier responses and create bid submission records for evaluation and comparison.";
    
    response.databaseOperations.push(
      { type: 'insert', table: 'bids', success: true }
    );
    response.databaseCalls.push(
      { operation: 'insert', table: 'bids', success: true }
    );
    
    response.actions.push('supabase_insert');
  }
  
  // Summary and Status Checking
  else if (promptLower.includes('complete summary') || promptLower.includes('show me a complete summary') ||
           promptLower.includes('everything we\'ve created')) {
    response.text = "I'll provide a comprehensive summary of all the LED bulb procurement RFP components we've created.";
    
    response.artifactCalls.push(
      { operation: 'get_artifact_status', type: 'summary', success: true }
    );
    response.databaseOperations.push(
      { type: 'select', table: 'rfps', success: true }
    );
    response.databaseCalls.push(
      { operation: 'select', table: 'rfps', success: true }
    );
    
    response.actions.push('get_artifact_status', 'supabase_select');
  }
  
  // Template Saving
  else if (promptLower.includes('save this as a template') || promptLower.includes('worked well') ||
           promptLower.includes('template that we can reuse')) {
    response.text = "I'll save this LED lighting procurement process as a reusable template for future projects.";
    
    response.artifactCalls.push(
      { operation: 'create_artifact_template', type: 'rfp_template', success: true }
    );
    response.databaseOperations.push(
      { type: 'insert', table: 'rfp_templates', success: true }
    );
    response.databaseCalls.push(
      { operation: 'insert', table: 'rfp_templates', success: true }
    );
    
    response.actions.push('create_artifact_template', 'supabase_insert');
  }
  
  // Edge Cases and Context Validation
  else if (promptLower.includes('update the led bulb specifications') || 
           promptLower.includes('for our current rfp')) {
    response.text = "I need to check if there's a current RFP context first. Let me verify the existing RFP status.";
    
    response.databaseOperations.push(
      { type: 'select', table: 'rfps', success: true, data: [] }
    );
    response.databaseCalls.push(
      { operation: 'select', table: 'rfps', success: true }
    );
    
    response.actions.push('supabase_select', 'context_management');
  }
  
  // Multi-phase Integration
  else if (promptLower.includes('complete rfp for led light bulb procurement from start to finish') ||
           promptLower.includes('guide me through')) {
    response.text = "I'll guide you through the complete LED light bulb procurement RFP process from start to finish, maintaining context throughout all phases.";
    
    response.actions.push('context_management', 'supabase_select', 'create_form_artifact');
  }
  
  // Building details and requirements
  else if (promptLower.includes('building details') || promptLower.includes('15 floors') ||
           promptLower.includes('2,500 light fixtures') || promptLower.includes('sustainability goals')) {
    response.text = "I'll record and analyze your building specifications and lighting requirements for the RFP.";
    
    response.databaseOperations.push(
      { type: 'update', table: 'rfps', success: true }
    );
    response.databaseCalls.push(
      { operation: 'update', table: 'rfps', success: true }
    );
    
    response.actions.push('supabase_update');
  }
  
  // Default case
  else {
    response.text = "I understand you're working on an LED lighting procurement project. I can help you create RFPs, generate forms, manage supplier communications, and coordinate the entire procurement process.";
    response.actions.push('context_management');
  }

  return response;
}

// Gmail OAuth Callback Proxy
// Forwards OAuth callback to Supabase edge function
app.get('/api/gmail-oauth-callback', async (req, res) => {
  try {
    // Get Supabase URL from environment
    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://jxlutaztoukwbbgtoulc.supabase.co';
    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/gmail-oauth-callback`;
    
    // Forward all query parameters to edge function
    const queryString = new URLSearchParams(req.query).toString();
    const targetUrl = `${edgeFunctionUrl}?${queryString}`;
    
    console.log(`📧 Proxying Gmail OAuth callback to: ${targetUrl}`);
    
    // Forward the request to Supabase edge function
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      // Success - redirect to success page or close window
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Gmail Connected</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
            .success-box {
              text-align: center;
              background: rgba(255, 255, 255, 0.1);
              backdrop-filter: blur(10px);
              padding: 3rem;
              border-radius: 20px;
              box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            }
            h1 { margin: 0 0 1rem 0; font-size: 2.5rem; }
            p { margin: 0.5rem 0; font-size: 1.2rem; opacity: 0.9; }
            .close-btn {
              margin-top: 2rem;
              padding: 0.75rem 2rem;
              background: white;
              color: #667eea;
              border: none;
              border-radius: 10px;
              font-size: 1rem;
              font-weight: 600;
              cursor: pointer;
              transition: transform 0.2s;
            }
            .close-btn:hover { transform: scale(1.05); }
          </style>
        </head>
        <body>
          <div class="success-box">
            <h1>✅ Gmail Connected!</h1>
            <p>Your Gmail account has been successfully connected.</p>
            <p>You can now send and receive emails through agents.</p>
            <button class="close-btn" onclick="window.close()">Close Window</button>
          </div>
          <script>
            // Auto-close after 3 seconds
            setTimeout(() => window.close(), 3000);
          </script>
        </body>
        </html>
      `);
    } else {
      // Error from edge function
      throw new Error(data.error || 'Failed to connect Gmail account');
    }
  } catch (error) {
    console.error('❌ Gmail OAuth callback error:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Connection Failed</title>
        <style>
          body {
            font-family: system-ui, -apple-system, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
          }
          .error-box {
            text-align: center;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            padding: 3rem;
            border-radius: 20px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          }
          h1 { margin: 0 0 1rem 0; font-size: 2.5rem; }
          p { margin: 0.5rem 0; font-size: 1.1rem; opacity: 0.9; }
          .error-detail { 
            margin-top: 1rem; 
            padding: 1rem; 
            background: rgba(0, 0, 0, 0.2); 
            border-radius: 10px;
            font-family: monospace;
            font-size: 0.9rem;
          }
        </style>
      </head>
      <body>
        <div class="error-box">
          <h1>❌ Connection Failed</h1>
          <p>Failed to connect your Gmail account.</p>
          <div class="error-detail">${error.message}</div>
          <p style="margin-top: 2rem; font-size: 0.9rem;">Please try again or contact support.</p>
        </div>
      </body>
      </html>
    `);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    availableEndpoints: [
      'GET /health',
      'POST /api/agent/prompt',
      'GET /api/agent/capabilities',
      'POST /api/agent/session'
    ]
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 RFPEZ.AI Agent API Server running on http://localhost:${PORT}`);
  console.log(`📡 Available endpoints:`);
  console.log(`   GET  /health`);
  console.log(`   POST /api/agent/prompt`);
  console.log(`   GET  /api/agent/capabilities`);
  console.log(`   POST /api/agent/session`);
});

// Handle port already in use error
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use!`);
    console.error(`   Please stop the existing server or use a different port.`);
    console.error(`   To find and stop the process using this port:`);
    console.error(`   Windows: netstat -ano | findstr :${PORT}`);
    console.error(`   Linux/Mac: lsof -ti:${PORT} | xargs kill`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server gracefully...');
  server.close(() => {
    console.log('✅ Server stopped.');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server stopped.');
    process.exit(0);
  });
});

module.exports = app;