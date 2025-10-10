# RFPEZ.AI - Multi-Agent RFP Management Platform

A modern React-based application for intelligent RFP (Request for Proposal) management with AI-powered multi-agent assistance and Claude API integration with MCP connections.

## 🚀 Features

- **🧠 Agent Memory System**: Semantic memory with vector embeddings for context-aware conversations
- **🤖 Multi-Agent System**: Specialized AI agents with seamless handoffs and memory sharing
- **⚡ Dynamic Agent Activation**: Personalized welcome messages based on conversation history
- **🔮 Claude API Integration**: Powered by Anthropic's Claude Sonnet 4.5 with function calling
- **🔗 MCP Protocol Support**: Model Context Protocol for advanced AI interactions
- **⚡ Real-time Collaboration**: Supabase-powered backend with real-time updates
- **📱 PWA Ready**: Progressive Web App with offline capabilities
- **🎨 Modern UI**: Built with Ionic React components

## 🎉 Recent Updates (October 2025)

### 🧠 Agent Memory System (NEW!)
- ✅ **Semantic Memory Storage**: Agents can now create and search memories using pgvector embeddings
- ✅ **Cross-Agent Memory Access**: Memories created by one agent are searchable by others
- ✅ **Context-Aware Agent Handoffs**: Agents search memory on activation to provide personalized welcomes
- ✅ **Server-Side Embeddings**: All embedding generation handled by edge functions for performance
- ✅ **Memory Search Function**: `search_memories` tool with similarity threshold and filtering
- ✅ **Memory Creation Workflow**: Solutions agent creates memories before switching to specialist agents

### 🔄 Seamless Agent Switching
- ✅ **Dynamic Initial Prompts**: Agent welcome messages now processed through Claude for personalization
- ✅ **Memory-Aware Welcomes**: RFP Design agent searches memory and references user's requirements
- ✅ **System Prompt Integration**: Agent `initial_prompt` properly passed via Claude API system parameter
- ✅ **Automatic Continuation**: Agent switches trigger immediate responses from new agent with full context
- ✅ **Loading Feedback**: UI displays "🤖 Activating [Agent]..." during agent initialization

### 🏗️ Technical Architecture Improvements
- 🔧 **pgvector Extension**: PostgreSQL vector embeddings for semantic search (v0.8.0)
- 🔧 **Memory Tables**: `agent_memories`, `memory_references`, `memory_access_log` for comprehensive tracking
- 🔧 **Edge Function Enhancement**: `claude-api-v3` handles memory operations and agent continuation
- 🔧 **Client-Side Optimization**: Removed client-side embedding generation for cleaner architecture
- 🔧 **Enhanced Error Handling**: Better authentication and session management error messages

### 📊 Database Schema Updates
- �️ **Memory System**: Vector embeddings (384 dimensions), importance scoring, metadata
- 🗄️ **Memory References**: Link memories to RFPs, bids, artifacts, messages, and user profiles
- 🗄️ **Access Logging**: Track memory retrievals with relevance scores and usage patterns
- �️ **Agent Instructions**: Updated Solutions and RFP Design agents with memory workflows

For detailed information, see:
- `DOCUMENTATION/MEMORY-SYSTEM.md` - Complete memory system architecture
- `DOCUMENTATION/AGENTS.md` - Updated multi-agent system documentation
- `database/memory-system-schema.sql` - Memory database schema and functions

## � Previous Updates (August 2025)

### Agent Switching Foundation
- ✅ **Fixed Claude Function Agent Switching**: Resolved issues where Claude function calls for agent switching weren't working
- ✅ **Session Context Integration**: Claude now receives explicit session context for reliable function calls
- ✅ **UI Synchronization**: Agent switches via Claude functions now properly update the UI in real-time
- ✅ **Enhanced Debugging**: Comprehensive logging for troubleshooting agent switch operations

### Technical Improvements
- 🔧 **Session ID Parameter Fix**: Fixed missing session context in Claude API calls
- 🔧 **Database Consistency**: Added retry logic and verification for agent switch operations
- 🔧 **Error Handling**: Improved error handling and recovery for failed agent switches

## �🏗️ Architecture

### Frontend
- **React 18** with TypeScript
- **Ionic React** for mobile-first UI components
- **PWA** capabilities with service workers
- **Azure Static Web Apps** deployment

### Backend Services
- **Supabase** for database, authentication, and real-time features
- **PostgreSQL with pgvector** for semantic memory storage (vector embeddings)
- **Supabase Edge Functions** for serverless API endpoints (Deno runtime)
- **Row Level Security** for data protection and multi-tenancy

### AI Integration
- **Claude Sonnet 4.5** for AI-powered responses and function calling
- **MCP Protocol** for advanced model interactions and tool integration
- **Function Calling**: `create_memory`, `search_memories`, `switch_agent`, `create_form_artifact`
- **Embedding Generation**: Server-side text-embedding-3-small (384 dimensions)

## 🤖 Multi-Agent System with Memory

The application features a sophisticated multi-agent system where each AI agent has specialized instructions, memory capabilities, and seamless handoff workflows:

### Available Agents

1. **Solutions Agent** (Default)
   - **Purpose**: Sales agent for EZRFP.APP
   - **Specialization**: Product guidance and procurement assistance
   - **Memory Workflow**: Creates memories before switching to specialist agents
   - **Initial Prompt**: Personalized greeting based on user authentication state

2. **RFP Design Agent**
   - **Purpose**: RFP creation and requirements gathering
   - **Specialization**: Form generation and questionnaire design
   - **Memory Integration**: Searches memory on activation to reference user's requirements
   - **Initial Prompt**: Context-aware welcome mentioning specific procurement needs

3. **Technical Support Agent**
   - **Purpose**: Technical assistance and troubleshooting
   - **Specialization**: Platform usage and technical questions
   - **Features**: Debug assistance and technical guidance

4. **RFP Assistant Agent**
   - **Purpose**: Specialized RFP management
   - **Specialization**: RFP optimization and procurement processes
   - **Features**: RFP best practices and process guidance

### 🧠 Memory System Features
- **Semantic Search**: pgvector-powered similarity search with 384-dimensional embeddings
- **Cross-Agent Memory**: Memories created by Solutions are accessible to RFP Design and others
- **Contextual Activation**: Agents search memory when activated to provide relevant greetings
- **Memory Metadata**: Importance scoring, memory types, and reference linking
- **Automatic Cleanup**: Memory access logging for analytics and optimization

### Agent Handoff Workflow
1. **User Request**: User states procurement need (e.g., "I need 100 tons of concrete")
2. **Memory Creation**: Solutions agent creates memory with requirement details
3. **Agent Switch**: Solutions calls `switch_agent` to RFP Design
4. **Memory Search**: RFP Design searches for recent memories on activation
5. **Context-Aware Welcome**: "I see you need 100 tons of concrete. Let me help you create an RFP..."

### Implementation
- **Database**: Agent definitions with `initial_prompt` field for dynamic welcomes
- **Memory Tables**: `agent_memories`, `memory_references`, `memory_access_log`
- **Edge Functions**: `create_memory`, `search_memories` tools for Claude function calling
- **Service Layer**: `MemoryService` (server-side only), `AgentService` for agent operations
- **UI Components**: `AgentSelector`, `AgentIndicator`, loading states during activation

## 🧠 Agent Memory System

The memory system enables agents to create, store, and retrieve contextual information using semantic search with vector embeddings.

### Memory Architecture

**Database Schema:**
```sql
-- Vector storage with pgvector extension
agent_memories (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  agent_id UUID REFERENCES agents,
  content TEXT,
  embedding VECTOR(384),  -- text-embedding-3-small
  memory_type TEXT,       -- 'fact', 'preference', 'context', 'requirement'
  importance_score FLOAT, -- 0.0 to 1.0
  metadata JSONB,
  created_at TIMESTAMPTZ
)

-- Link memories to entities
memory_references (
  memory_id UUID REFERENCES agent_memories,
  rfp_id INT REFERENCES rfps,
  bid_id INT REFERENCES bids,
  artifact_id UUID REFERENCES artifacts,
  message_id UUID REFERENCES messages,
  user_profile_id UUID REFERENCES user_profiles
)

-- Track memory access patterns
memory_access_log (
  memory_id UUID REFERENCES agent_memories,
  accessed_by_agent_id UUID REFERENCES agents,
  relevance_score FLOAT,
  accessed_at TIMESTAMPTZ
)
```

### Memory Operations

**Create Memory** (via Claude function call):
```typescript
{
  name: "create_memory",
  input: {
    content: "User needs 100 tons of concrete for November delivery",
    memory_type: "requirement",
    importance_score: 0.9,
    reference_type: "message",
    reference_id: "msg_uuid"
  }
}
```

**Search Memories** (via Claude function call):
```typescript
{
  name: "search_memories",
  input: {
    query: "concrete procurement requirements",
    memory_types: ["requirement", "context"],
    limit: 5,
    similarity_threshold: 0.75
  }
}
// Returns: Array of memories with similarity scores
```

### Memory Workflow

1. **Solutions Agent** receives user requirement
2. **Create Memory** stores requirement with embedding
3. **Switch Agent** to RFP Design specialist
4. **Search Memories** executed by RFP Design on activation
5. **Context Injection** into agent's initial prompt
6. **Personalized Welcome** referencing specific requirements

### Technical Details
- **Embedding Model**: OpenAI text-embedding-3-small (384 dimensions)
- **Similarity Search**: Cosine similarity via pgvector `<=>` operator
- **Server-Side Only**: All embedding generation in edge functions
- **Multi-Tenancy**: Row-level security based on user_id
- **Performance**: Indexed vector search with HNSW algorithm

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

### Unit Testing
- **Test Framework**: Jest + React Testing Library
- **Coverage Reports**: Built-in coverage analysis
- **Component Testing**: Comprehensive test suite for React components
- **CI/CD Integration**: Automated testing in deployment pipelines
- **Test Documentation**: See [DOCUMENTATION/UNIT-TESTING.md](DOCUMENTATION/UNIT-TESTING.md) for detailed testing guidelines

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
- **Deployment & Versioning**: See `DOCUMENTATION/DEPLOYMENT-AND-VERSIONING.md` for comprehensive deployment guide
- **Quick Deployment Reference**: See `DOCUMENTATION/DEPLOYMENT-QUICK-REFERENCE.md` for common commands
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
