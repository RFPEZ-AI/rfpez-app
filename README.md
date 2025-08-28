# RFPEZ.AI - Multi-Agent RFP Management Platform

A modern React-based application for intelligent RFP (Request for Proposal) management with AI-powered multi-agent assistance and Claude API integration.

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

## 🛠️ Development Setup

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

### API Testing
- **Claude API**: Built-in test component for development
- **Function Testing**: Direct edge function testing scripts
- **Error Handling**: Comprehensive error logging and user feedback

## 📚 Documentation

- **MCP Integration**: See `DOCUMENTATION/MCP-README.md` for detailed MCP setup
- **Claude API**: See `DOCUMENTATION/CLAUDE-INTEGRATION.md` for API integration guide
- **Deployment**: See `DOCUMENTATION/DEPLOYMENT.md` for production deployment
- **Database Schema**: See `database/README.md` for schema information

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary. All rights reserved.

## 🆘 Support

For support and questions:
- Check the documentation files in the repository
- Review the debug utilities and test pages
- Examine the browser console for detailed error information
