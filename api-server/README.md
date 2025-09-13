# RFPEZ.AI API Server

A Node.js Express API server that provides endpoints for testing and interacting with the RFP Design Agent. This server simulates agent responses for LED bulb procurement workflows and supports comprehensive test automation.

## 📁 Folder Structure

```
api-server/
├── index.js              # Main API server file (enhanced version)
├── backup.js              # Backup/alternative server implementation
├── logs/                  # Server logs and runtime information
│   └── server.log         # Application logs
├── tests/                 # API testing utilities
│   ├── endpoint-test.sh   # Bash script for testing all endpoints
│   ├── health-test.js     # Health check test
│   └── response-test.js   # API response validation tests
└── README.md              # This documentation file
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Express.js
- CORS support

### Installation

The API server dependencies are included in the main project's `package.json`. No separate installation is required.

### Starting the Server

#### Option 1: Using npm scripts (Recommended)
```bash
# Start only the API server
npm run start:api

# Start both React app and API server concurrently
npm run start:dev
```

#### Option 2: Direct execution
```bash
# From project root
node api-server/index.js

# From api-server directory
cd api-server
node index.js
```

### Environment Configuration

The server uses the following environment variables:

- `PORT`: Server port (default: 3001)
- `NODE_ENV`: Environment mode (development/production)

## 📡 API Endpoints

### Health Check
- **GET** `/health`
- Returns server status and basic information
- Used for monitoring and health checks

```json
{
  "status": "OK",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "service": "RFPEZ.AI Agent API",
  "version": "1.0.0"
}
```

### Agent Capabilities
- **GET** `/api/agent/capabilities`
- Returns supported agent operations and capabilities
- Useful for discovering available functionality

```json
{
  "capabilities": [
    "RFP Creation and Management",
    "Interactive Form Generation",
    "Supplier Communication",
    "Bid Collection and Analysis",
    "Template Management",
    "Database Operations",
    "Artifact Management"
  ],
  "version": "1.0.0",
  "supportedOperations": {
    "database": ["select", "insert", "update", "delete"],
    "artifacts": ["create_form_artifact", "get_form_submission", "validate_form_data"],
    "context": ["session_management", "rfp_context", "multi_phase_workflow"]
  }
}
```

### Session Management
- **POST** `/api/agent/session`
- Create and manage user sessions
- Supports session context and state management

**Request Body:**
```json
{
  "action": "create",
  "sessionId": "optional-existing-session-id"
}
```

**Response:**
```json
{
  "sessionId": "uuid-v4-session-id",
  "message": "Session created successfully"
}
```

### Agent Prompt Processing
- **POST** `/api/agent/prompt`
- Main endpoint for agent interaction
- Analyzes prompts and returns structured responses

**Request Body:**
```json
{
  "prompt": "I need help creating an RFP for LED bulbs",
  "context": {
    "rfpId": null,
    "sessionId": "optional-session-id"
  },
  "sessionId": "optional-session-id"
}
```

**Response Structure:**
```json
{
  "text": "Agent response text",
  "actions": ["supabase_select", "supabase_insert"],
  "databaseOperations": [
    {
      "type": "select",
      "table": "rfps",
      "success": true,
      "data": []
    }
  ],
  "databaseCalls": [
    {
      "operation": "select",
      "table": "rfps",
      "success": true
    }
  ],
  "artifactCalls": [
    {
      "operation": "create_form_artifact",
      "type": "questionnaire",
      "success": true
    }
  ],
  "errors": [],
  "metadata": {
    "sessionId": "uuid",
    "timestamp": "2025-01-15T10:30:00.000Z",
    "processingTime": 150
  }
}
```

## 🧪 Testing

### Running Tests

#### Test All Endpoints
```bash
# From project root
bash api-server/tests/endpoint-test.sh

# Or directly
cd api-server/tests
bash endpoint-test.sh
```

#### Health Check Test
```bash
node api-server/tests/health-test.js
```

#### Response Validation Test
```bash
node api-server/tests/response-test.js
```

### Test Automation Integration

The API server is integrated with the test automation framework located in `test-automation/`. The `agent-integration.js` file handles communication between the test suite and this API server.

Key integration points:
- Automated prompt testing for LED bulb procurement workflows
- Response validation and action verification
- Multi-phase RFP workflow testing
- Database operation simulation

## 🏗️ Architecture

### Response Generation

The server uses intelligent prompt analysis to generate appropriate responses:

1. **Pattern Matching**: Analyzes incoming prompts for keywords and context
2. **Phase Detection**: Identifies which RFP workflow phase the user is in
3. **Action Generation**: Creates appropriate database and artifact operations
4. **Response Structure**: Returns consistent, structured responses for testing

### Supported Workflows

#### LED Bulb Procurement (Primary)
- RFP creation and context management
- Interactive questionnaire generation
- Form data collection and validation
- Supplier bid form creation
- Email generation and supplier communication
- Bid submission handling
- Summary and template creation

#### General RFP Management
- Session state management
- Context preservation across interactions
- Database operation simulation
- Artifact lifecycle management

### Database Operation Simulation

The server simulates Supabase MCP operations without requiring actual database connections:

- **supabase_select**: Query simulation with mock data
- **supabase_insert**: Record creation simulation
- **supabase_update**: Field update simulation
- **supabase_delete**: Deletion simulation (rarely used)

### Artifact Function Simulation

Simulates artifact management operations:

- **create_form_artifact**: Interactive form creation
- **get_form_submission**: Form data retrieval
- **validate_form_data**: Data validation
- **get_artifact_status**: Status monitoring
- **create_artifact_template**: Template creation

## 🔧 Configuration

### Port Configuration

The server defaults to port 3001 but can be configured:

```bash
# Set custom port
PORT=3002 node api-server/index.js
```

### Error Handling

The server includes comprehensive error handling:

- Port conflict detection and guidance
- Graceful shutdown on SIGINT/SIGTERM
- Request validation and sanitization
- JSON parsing error handling
- 404 routing for unknown endpoints

### Logging

Logs are stored in `api-server/logs/server.log` and include:

- Server startup and shutdown events
- Error conditions and resolutions
- Performance metrics
- Request processing information

## 🚢 Deployment

### Development Mode
```bash
npm run start:dev
```

### Production Mode
```bash
NODE_ENV=production npm run start:api
```

### Docker Support (Future)
Docker configuration can be added for containerized deployment.

## 🤝 Integration Points

### Test Automation
- **File**: `test-automation/agent-integration.js`
- **Purpose**: Interfaces with this API server for automated testing
- **Usage**: Validates LED bulb procurement workflows

### React Application
- **Integration**: Can be used with the main React app for testing
- **CORS**: Enabled for cross-origin requests
- **Endpoints**: Available for frontend integration testing

## 📚 API Response Patterns

### RFP Creation Response
```json
{
  "text": "I'll help you create a comprehensive RFP...",
  "actions": ["supabase_select", "supabase_insert", "context_management"],
  "databaseOperations": [
    {"type": "select", "table": "rfps", "success": true},
    {"type": "insert", "table": "rfps", "success": true}
  ]
}
```

### Form Creation Response
```json
{
  "text": "I'll create an interactive questionnaire form...",
  "actions": ["create_form_artifact", "supabase_update", "validate_form_data"],
  "artifactCalls": [
    {"operation": "create_form_artifact", "type": "questionnaire", "success": true}
  ]
}
```

### Data Processing Response
```json
{
  "text": "I'll process your completed questionnaire data...",
  "actions": ["get_form_submission", "validate_form_data", "supabase_update"],
  "artifactCalls": [
    {"operation": "get_form_submission", "type": "questionnaire", "success": true}
  ]
}
```

## 📈 Performance

- **Response Time**: 100-300ms (simulated processing)
- **Concurrent Requests**: Handles multiple simultaneous requests
- **Memory Usage**: Minimal footprint with in-memory session storage
- **Scalability**: Suitable for development and testing environments

## 🔍 Troubleshooting

### Common Issues

#### Port Already in Use
```
❌ Port 3001 is already in use!
```
**Solution**: Check for running processes and kill them:
```bash
# Windows
netstat -ano | findstr :3001

# Linux/Mac  
lsof -ti:3001 | xargs kill
```

#### Server Not Responding
**Check**: 
1. Server is running (`npm run start:api`)
2. Port is accessible
3. No firewall blocking connections

#### Test Failures
**Verify**:
1. API server is running
2. Correct endpoints are being called
3. Request format matches expected structure

## 🔄 Updates and Maintenance

### Version History
- **v1.0.0**: Initial API server with LED bulb procurement support
- Enhanced response format with actions array
- Comprehensive test automation integration
- Organized folder structure

### Future Enhancements
- Database connection support
- Authentication and authorization
- Rate limiting and security features
- Extended workflow support
- WebSocket support for real-time updates

## 📞 Support

For issues, questions, or contributions:
1. Check the troubleshooting section above
2. Review the test automation logs
3. Examine the server logs in `api-server/logs/`
4. Test individual endpoints using the provided test scripts