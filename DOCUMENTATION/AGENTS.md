# RFPEZ.AI Multi-Agent System

## Overview

RFPEZ.AI now features a sophisticated multi-agent system where each agent has specialized instructions and initial prompts stored in Supabase. This allows for personalized, context-aware interactions based on the user's specific needs.

## Architecture

### Database Schema

The multi-agent system extends the existing Supabase database with three new tables:

1. **`agents`** - Stores agent definitions with instructions and prompts
2. **`session_agents`** - Tracks which agent is used in each session
3. **`messages`** - Extended to include `agent_id` for tracking which agent handled each message

### Key Components

#### Backend Services

- **`AgentService`** (`src/services/agentService.ts`) - Handles all agent-related operations
- **`DatabaseService`** - Extended to support agent integration with messages

#### Frontend Components

- **`AgentSelector`** (`src/components/AgentSelector.tsx`) - Modal for selecting agents
- **`AgentIndicator`** (`src/components/AgentIndicator.tsx`) - Shows current agent in UI
- **`Home.tsx`** - Updated to integrate agent system

## Default Agents

The system comes with three pre-configured agents:

### 1. Solutions (Default)
- **Purpose**: Sales agent for EZRFP.APP
- **Instructions**: "You are a sales agent for EZRFP.APP. Answer questions about the product and help users understand how our platform can assist with their procurement and RFP needs."
- **Initial Prompt**: "Hi, I'm your EZ RFP AI agent. I'm here to see if I can help you. Are you looking to competitively source a product?"

### 2. Technical Support
- **Purpose**: Technical assistance for platform usage
- **Instructions**: "You are a technical support agent for EZRFP.APP. Help users with platform usage, troubleshooting, and technical questions."
- **Initial Prompt**: "Hello! I'm the technical support agent. I'm here to help you with any technical questions or issues you might have with the platform."

### 3. RFP Assistant
- **Purpose**: Specialized RFP creation and management
- **Instructions**: "You are an RFP specialist. Help users create, manage, and optimize their RFP processes."
- **Initial Prompt**: "Welcome! I'm your RFP Assistant. I specialize in helping you create effective RFPs and manage your procurement process."

### 4. RFP Design (Free)
- **Purpose**: Free RFP design assistance for authenticated users
- **Instructions**: "You are an RFP Design specialist that helps users create basic RFPs and understand the RFP process. Focus on fundamental RFP structure, basic requirements gathering, and simple procurement strategies."
- **Initial Prompt**: "Welcome! I'm your RFP Design assistant. I'm here to help you understand and create basic RFPs. Whether you're new to procurement or need guidance on RFP structure, I can help you get started."

## Agent Access Control

The system supports three tiers of access control:

1. **Public Access** - Default agent (Solutions) available to all users
2. **Free Access** - Free agents (RFP Design) available to authenticated users without billing
3. **Premium Access** - Restricted agents (Technical Support, RFP Assistant) requiring billing setup

For detailed access control information, see:
- [AGENT-ACCESS-CONTROL.md](./AGENT-ACCESS-CONTROL.md) - Original access control system
- [AGENT-FREE-ACCESS.md](./AGENT-FREE-ACCESS.md) - New free access tier documentation

## Features

### Agent Management
- **Agent Selection**: Users can switch between agents during a session
- **Agent History**: Track which agents were used in each session
- **Agent Persistence**: The selected agent persists throughout the session

### Session Integration
- **Auto-Assignment**: New sessions automatically get the default agent (Solutions)
- **Agent Switching**: Users can change agents mid-conversation
- **Message Attribution**: All messages are linked to the agent that handled them

### UI/UX Features
- **Compact Agent Indicator**: Shows current agent in the header
- **Agent Selector Modal**: Beautiful interface for choosing agents
- **Responsive Design**: Works on mobile and desktop
- **Visual Feedback**: Clear indication of current agent and switching states

## Installation & Setup

### 1. Database Setup

Run the agent schema SQL in your Supabase SQL Editor:

```sql
-- Execute the contents of rfpez-app/database/agents-schema.sql
```

This will create the necessary tables and insert the default agents.

### 2. TypeScript Types

The system includes comprehensive TypeScript types in `src/types/database.ts`:
- `Agent` - Agent definition interface
- `SessionAgent` - Session-agent relationship interface
- `SessionActiveAgent` - Active agent information interface

### 3. Frontend Integration

The Home component automatically integrates the agent system:
- Loads the active agent when a session is selected
- Shows agent indicator in the header
- Provides agent selection modal
- Includes agent ID when saving messages

## Usage

### For Users

1. **Starting a Session**: New sessions automatically use the Solutions agent
2. **Switching Agents**: Click the agent indicator in the header to open the agent selector
3. **Agent Responses**: Each agent provides specialized responses based on their instructions

### For Developers

#### Adding New Agents

```typescript
// Using AgentService
const newAgent = await AgentService.createAgent({
  name: "Custom Agent",
  description: "Custom agent description",
  instructions: "You are a custom agent...",
  initial_prompt: "Hello! I'm your custom agent...",
  is_active: true,
  sort_order: 10
});
```

#### Switching Agents Programmatically

```typescript
// Switch agent for a session
const success = await AgentService.setSessionAgent(
  sessionId,
  agentId,
  auth0UserId
);
```

#### Getting Session Agent

```typescript
// Get current active agent for a session
const agent = await AgentService.getSessionActiveAgent(sessionId);
```

## API Reference

### AgentService Methods

- `getActiveAgents()` - Get all active agents
- `getAgentById(agentId)` - Get specific agent
- `getSessionActiveAgent(sessionId)` - Get current session agent
- `setSessionAgent(sessionId, agentId, auth0UserId)` - Set session agent
- `initializeSessionWithDefaultAgent(sessionId, auth0UserId)` - Set default agent
- `createAgent(agent)` - Create new agent (admin)
- `updateAgent(agentId, updates)` - Update agent (admin)
- `deleteAgent(agentId)` - Soft delete agent (admin)

### Database Functions

- `get_session_active_agent(session_uuid)` - Get active agent for session
- `switch_session_agent(session_uuid, new_agent_uuid, user_uuid)` - Switch session agent

## Security

### Row Level Security (RLS)

- **Agents**: Publicly readable for active agents, admin-only write access
- **Session Agents**: Users can only access their own session agents
- **Messages**: Extended to include agent_id while maintaining existing security

### Authentication

- All agent operations require proper authentication
- User verification through Auth0 integration
- Session ownership validation for agent switching

## Future Enhancements

1. **Agent Analytics**: Track usage statistics per agent
2. **Dynamic Instructions**: Allow agents to have context-aware instructions
3. **Agent Customization**: Allow users to create custom agents
4. **Agent Collaboration**: Enable multiple agents to work on the same session
5. **AI Model Integration**: Different agents could use different AI models
6. **Agent Learning**: Agents could learn from interactions to improve responses

## Troubleshooting

### Common Issues

1. **Agent Not Loading**: Check if user is authenticated and session exists
2. **Agent Switching Fails**: Verify user has permission to modify the session
3. **No Agents Available**: Ensure agents exist in database and are marked as active

### Debug Logging

The system includes comprehensive console logging. Check browser console for:
- Agent loading operations
- Session agent assignments
- Message saving with agent attribution

## Contributing

When extending the agent system:

1. **Database Changes**: Update the schema in `agents-schema.sql`
2. **Type Definitions**: Add new types to `src/types/database.ts`
3. **Service Methods**: Extend `AgentService` for new functionality
4. **UI Components**: Follow the existing design patterns
5. **Testing**: Test agent switching and message attribution

## License

This multi-agent system is part of the RFPEZ.AI project and follows the same licensing terms.
