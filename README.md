# RFPEZ.AI - Multi-Agent RFP Management Platform

A modern React-based application for intelligent RFP (Request for Proposal) management with AI-powered multi-agent assistance and Claude API integration with MCP connections.

## 🚀 Features

- **Multi-Agent System**: Different AI agents for specialized RFP tasks
- **Claude API Integration**: Powered by Anthropic's Claude for intelligent responses
- **MCP Protocol Support**: Model Context Protocol for advanced AI interactions
- **Real-time Collaboration**: Supabase-powered backend with real-time updates
- **PWA Ready**: Progressive Web App with offline capabilities
- **Modern UI**: Built with Ionic React components

## 🏗️ Architecture

### Frontend
- **React 18** with TypeScript
- **Ionic React** for mobile-first UI components
- **PWA** capabilities with service workers
- **Azure Static Web Apps** deployment

### Backend Services
- **Supabase** for database, authentication, and real-time features
- **Supabase Edge Functions** for serverless API endpoints
- **Row Level Security** for data protection

### AI Integration
- **Claude API** for AI-powered responses
- **MCP Protocol** for advanced model interactions
- **Function Calling** for database operations

## 🤖 Multi-Agent System

The application features a sophisticated multi-agent system where each AI agent has specialized instructions and capabilities:

### Available Agents

1. **Solutions Agent** (Default)
   - **Purpose**: Sales agent for EZRFP.APP
   - **Specialization**: Product guidance and procurement assistance
   - **Initial Prompt**: Helps users understand platform capabilities

2. **Technical Support Agent**
   - **Purpose**: Technical assistance and troubleshooting
   - **Specialization**: Platform usage and technical questions
   - **Features**: Debug assistance and technical guidance

3. **RFP Assistant Agent**
   - **Purpose**: Specialized RFP creation and management
   - **Specialization**: RFP optimization and procurement processes
   - **Features**: RFP best practices and process guidance

### Agent Features
- **Dynamic Agent Selection**: Users can switch between agents mid-conversation
- **Session-based Tracking**: Each conversation session tracks the active agent
- **Personalized Responses**: Agents respond according to their specialized instructions
- **Agent Indicators**: UI shows which agent is currently active

### Implementation
- **Database**: Agent definitions stored in Supabase with instructions and prompts
- **Service Layer**: `AgentService` manages agent operations and selection
- **UI Components**: `AgentSelector` and `AgentIndicator` for user interaction

## 🔐 Role-Based Access Control

The application implements a hierarchical user role system with three access levels:

### User Roles

1. **User** (Level 1)
   - Basic application access
   - Can create and manage personal RFPs
   - Standard conversation features

2. **Developer** (Level 2)
   - All User permissions plus:
   - Access to testing components (`/mcp-test`, `/claude-test`)
   - Debug utilities and development tools
   - Advanced configuration options

3. **Administrator** (Level 3)
   - All Developer permissions plus:
   - User role management
   - System configuration access
   - Administrative functions and oversight

### Access Control Features
- **Menu-based Access**: Navigation items shown/hidden based on user role
- **Component-level Security**: Role checks at component level
- **Database Security**: Row-level security policies based on user roles
- **Role Management**: Administrators can assign and modify user roles

### Implementation
- **Database**: `user_profiles` table with role column and constraints
- **Service Layer**: `RoleService` for role validation and hierarchy checks
- **Migration**: Safe role system migration with backward compatibility

## 🔧 Supabase Edge Functions

The application uses two specialized edge functions for different AI integration approaches:

### 1. `mcp-server` - MCP Protocol Server
**File**: `supabase/functions/mcp-server/index.ts`  
**Purpose**: Model Context Protocol implementation for Claude Desktop and web app MCP testing

**Features:**
- JSON-RPC 2.0 protocol compliance
- MCP 2024-11-05 specification
- Tool calling for database operations
- Resource reading for structured data access

**Used By:**
- Claude Desktop app (via `mcp-client.js`)
- React app MCP testing components (`MCPTestComponent`, `MCPTestPage`)
- Browser-based MCP debugging utilities

**Available Tools:**
- `get_conversation_history` - Retrieve session messages
- `get_recent_sessions` - Get user's recent sessions  
- `store_message` - Save new messages
- `create_session` - Create conversation sessions
- `search_messages` - Search across conversations

### 2. `claude-api` - Claude API Function Handler
**File**: `supabase/functions/claude-api/index.ts`  
**Purpose**: HTTP REST API for Claude API function calling integration

**Features:**
- HTTP-based function execution
- Direct database operations
- Simple JSON request/response format
- CORS-enabled for web app integration

**Used By:**
- React app Claude API integration (`ClaudeService`, `claudeAPIFunctions`)
- Main application AI functionality
- Agent-specific response generation

**Available Functions:**
- `get_conversation_history` - Retrieve session messages
- `get_recent_sessions` - Get user's recent sessions
- `store_message` - Save new messages  
- `create_session` - Create conversation sessions
- `search_messages` - Search across conversations

### Function Comparison

| Aspect | mcp-server | claude-api |
|--------|------------|------------|
| **Protocol** | MCP JSON-RPC 2.0 | HTTP REST |
| **Request Format** | `{"jsonrpc":"2.0","method":"tools/call"}` | `{"function_name":"get_recent_sessions"}` |
| **Response Format** | MCP-compliant JSON-RPC | Simple JSON `{"success":true,"data":{}}` |
| **Use Case** | Claude Desktop + MCP testing | Web app Claude API integration |
| **Authentication** | Bearer token | Bearer token |
| **CORS** | Enabled | Enabled |

## � RFP Management System

The application provides comprehensive RFP (Request for Proposal) management with enhanced data structure and validation:

### RFP Data Structure

**Description vs Specification Fields:**
- **Description**: Public-facing field that describes what the RFP is about (displayed to users)
- **Specification**: Internal field containing detailed requirements passed to Claude for form generation

### Key Features
- **Dual-field System**: Separation of public description and technical specifications
- **Form Validation**: Required field validation with database constraints
- **Claude Integration**: Specifications used for AI-powered form generation
- **Database Security**: Row-level security policies for authenticated users

### RFP Operations
- **Create RFPs**: Authenticated users can create new RFPs with description and specification
- **Update RFPs**: Full update capabilities with validation
- **View RFPs**: Secure viewing with appropriate access controls
- **Search & Filter**: Advanced RFP discovery capabilities

### Database Schema
- **Required Fields**: Both description and specification are mandatory
- **Validation**: Database-level constraints ensure data integrity
- **Security**: RLS policies control access based on authentication status
- **Migration Support**: Safe migration scripts for existing data

## �🛠️ Development Setup

### Prerequisites
- Node.js 18+
- Supabase CLI
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/markesphere/rfpez-app.git
   cd rfpez-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   
   Create `.env.local` file:
   ```env
   REACT_APP_SUPABASE_URL=your_supabase_url
   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
   REACT_APP_CLAUDE_API_KEY=your_claude_api_key
   ```

4. **Deploy Edge Functions**
   ```bash
   # Login to Supabase
   supabase login
   
   # Deploy both edge functions
   supabase functions deploy mcp-server
   supabase functions deploy claude-api
   ```

5. **Start Development Server**
   ```bash
   npm start
   ```

### Testing Edge Functions

**Test MCP Server:**
```bash
npm run mcp:test
```

**Test Claude API:**
```bash
npm run claude-api:test
```

**Access MCP Test Interface:**
Navigate to `/mcp-test` in your running application.

## 📊 Available Scripts

- `npm start` - Start development server
- `npm test` - Run test suite
- `npm run build` - Build for production
- `npm run mcp:test` - Test MCP functionality
- `npm run claude-api:test` - Test Claude API functionality
- `npm run claude-api:deploy` - Deploy Claude API function

## 🔐 Authentication & Security

- **Supabase Auth** with GitHub OAuth
- **Row Level Security** for data protection
- **API Key Management** via environment variables
- **CORS Configuration** for secure cross-origin requests

## 🚀 Deployment

### Azure Static Web Apps

The application is configured for deployment to Azure Static Web Apps with:

- **Build Configuration**: `build/` output directory
- **API Routes**: Supabase edge functions
- **Environment Variables**: Managed via Azure portal
- **Custom Routing**: PWA-friendly routing configuration

### Environment Variables (Production)

Set these in your deployment platform:
```env
REACT_APP_SUPABASE_URL=your_production_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_production_supabase_anon_key  
REACT_APP_CLAUDE_API_KEY=your_production_claude_api_key
```

## 📱 Progressive Web App

The application includes PWA features:
- **Service Worker** for caching
- **Offline Support** for core functionality
- **Install Prompts** for mobile devices
- **Update Notifications** for new versions

## 🧪 Testing & Debugging

### MCP Testing
- **Web Interface**: `/mcp-test` page for interactive testing
- **Debug Utilities**: Browser console MCP debugging tools
- **Claude Desktop**: Test via MCP client integration
- **Protocol Validation**: Full MCP 2024-11-05 specification compliance testing

### API Testing
- **Claude API**: Built-in test component for development
- **Function Testing**: Direct edge function testing scripts
- **Error Handling**: Comprehensive error logging and user feedback
- **Integration Tests**: End-to-end testing of AI function calling

### Agent System Testing
- **Agent Selection**: Test agent switching and session tracking
- **Role-based Testing**: Validate access controls for different user roles
- **Conversation Flow**: Test agent-specific responses and behavior

### Database Testing
- **Migration Scripts**: Safe database schema evolution testing
- **RLS Policies**: Row-level security validation
- **Role Management**: User role assignment and hierarchy testing

### Testing Commands
```bash
# Run all tests
npm test

# Test MCP functionality
npm run mcp:test

# Test Claude API integration
npm run claude-api:test

# Deploy and test edge functions
npm run claude-api:deploy
```

### Development Testing Routes
- `/mcp-test` - MCP protocol testing interface
- `/claude-test` - Claude API testing component
- Browser console debugging tools for real-time testing

## 📚 Documentation

### Integrated Documentation
This README contains comprehensive information about:
- **🤖 Multi-Agent System** - Specialized AI agents (see above)
- **🔐 Role-Based Access Control** - User permission hierarchy (see above)
- **📋 RFP Management System** - Enhanced RFP data structure (see above)
- **🧪 Testing & Debugging** - Comprehensive testing suite (see above)

### Additional Documentation Files
- **MCP Integration**: See `DOCUMENTATION/MCP-README.md` for detailed MCP setup
- **Claude API**: See `DOCUMENTATION/CLAUDE-INTEGRATION.md` for API integration guide
- **Deployment**: See `DOCUMENTATION/DEPLOYMENT.md` for production deployment
- **Database Schema**: See `database/README.md` for schema information
- **Step-by-step Guides**: See `DOCUMENTATION/` folder for detailed implementation guides

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary. All rights reserved. (c) Mark Skiba

## 🆘 Support

For support and questions:
- Check the documentation files in the repository
- Review the debug utilities and test pages
- Examine the browser console for detailed error information
