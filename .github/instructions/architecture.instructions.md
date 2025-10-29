---
applyTo: 'src/**/*.{ts,tsx}'
description: RFPEZ.AI architecture patterns, component structure, and coding conventions
---

# RFPEZ.AI Architecture & Code Conventions

## Architecture Patterns

### Service Layer Pattern
- **ClaudeService** (`src/services/claudeService.ts`): Claude API integration with function calling and MCP support primarily via `claude-api-v3` Edge Function
- **DatabaseService** (`src/services/database.ts`): Supabase operations with RLS policies
- **AgentService** (`src/services/agentService.ts`): Multi-agent system management
- Services use static methods and error handling with APIRetryHandler

### Component Structure
- **Pages**: `src/pages/` - Route-level components (Home, DebugPage, etc.)
- **Components**: `src/components/` - Reusable UI components with Ionic React
- **Hooks**: `src/hooks/` - Custom hooks for state management (useHomeState, useSessionState, useAgentManagement)
- **Types**: `src/types/` - TypeScript interfaces for database, home, RFP entities
- **Refactoring**: If the component becomes complex, common logic extracted to hooks and services for maintainability.

### Multi-Agent System
- Agents stored in `public.agents` table with instructions, prompts, and access control
- Agent switching via `session_agents` junction table tracking active agent per session
- All messages linked to agent_id for conversation attribution
- Three access tiers: public, free (authenticated), premium (billing required)
- Default agents: Solutions (sales), RFP Design (free), Support, RFP Assistant
- Agent switching via Claude function calls now properly updates UI in real-time

## Coding Conventions

### Error Handling
```typescript
// Use categorizeError for consistent error handling
import { categorizeError } from '../components/APIErrorHandler';

try {
  // operation
} catch (error) {
  const categorized = categorizeError(error);
  // Handle based on category
}
```

### Component Patterns
```typescript
// Standard component structure with copyright header
// Copyright Mark Skiba, 2025 All rights reserved

import React from 'react';
import { IonCard, IonContent } from '@ionic/react';

interface ComponentProps {
  // Props with JSDoc comments
}

const Component: React.FC<ComponentProps> = ({ props }) => {
  // Component logic
  return (
    // JSX with Ionic components
  );
};

export default Component;
```

### Message Flow Architecture
1. User input → `SessionDialog` component
2. `useMessageHandling` hook processes via `ClaudeService`
3. Claude API calls with function definitions for database operations
4. Function results create artifacts via `DatabaseService`
5. UI updates with artifact references and agent attribution

### Agent System Integration
- Agent switching updates both database and UI state
- Session context always included in Claude API calls
- Agent instructions combined with user messages for context
- Current agent displayed in `AgentIndicator` component

## File Organization
- Place temporary test files in `/temp` folder to avoid clutter
- Agent instructions in `Agent Instructions/` directory
- Database schemas in `database/` directory with migration files
- MCP integration files in `supabase/functions/`

## Pre-Commit Checklist
- Remove temporary test files from `/temp` & / folder
- Fix all linting errors before commit
- Ensure all unit tests are passing app and edge functions
- Update documentation if significant design changes are made
