# Agent Free Access System

## Overview

The RFPEZ.AI multi-agent system now includes a free access tier that allows authenticated users to access certain agents without requiring billing setup. This expands the existing access control system to provide a three-tier access model:

1. **Public Access** - Default agent available to all users (authenticated and non-authenticated)
2. **Free Access** - Free agents available to authenticated users without billing requirements  
3. **Premium Access** - Restricted agents available only to authenticated users with proper billing setup

## New Database Field

### `is_free` (Boolean)
- Determines whether an agent is available to authenticated users without billing requirements
- `FALSE` = Regular agent (follows existing access rules)
- `TRUE` = Free agent (available to all authenticated users regardless of billing status)

## Updated Agent Configuration

| Agent Name | is_default | is_restricted | is_free | Access Level |
|------------|------------|---------------|---------|--------------|
| **Solutions** | TRUE | FALSE | FALSE | Public (default) |
| **RFP Design** | FALSE | FALSE | TRUE | Free (authenticated) |
| **Onboarding** | FALSE | FALSE | FALSE | Public (all authenticated) |
| **Technical Support** | FALSE | TRUE | FALSE | Premium (billing required) |
| **RFP Assistant** | FALSE | TRUE | FALSE | Premium (billing required) |

## Implementation Details

### Database Schema Updates
- Added `is_free` column to the `agents` table with default value `FALSE`
- Created index `idx_agents_free` for efficient querying
- Updated `idx_agents_access` index to include `is_free` field
- Added "RFP Design" agent as the first free agent

### TypeScript Interface Updates
- Updated `Agent` interface in `src/types/database.ts` to include `is_free: boolean`

### Service Layer Changes
- **`AgentService.getAvailableAgents(hasProperAccountSetup, isAuthenticated)`**: Updated filtering logic to include free agents for authenticated users
- **`AgentService.getFreeAgents()`**: New method to retrieve only free agents
- **`AgentService.getAgentsByUserRole(userRole)`**: Updated to include free agents for all authenticated user roles

### Updated Access Control Logic
```typescript
// New three-tier access control
if (!isAuthenticated) {
  // Non-authenticated users: only default agent
  availableAgents = availableAgents.filter(agent => agent.is_default);
} else {
  // Authenticated users: default + free + non-restricted + (restricted if billing setup)
  availableAgents = availableAgents.filter(agent => {
    if (agent.is_default) return true;          // Always include default
    if (agent.is_free) return true;             // Always include free for authenticated
    if (!agent.is_restricted && !agent.is_free) return true; // Include regular non-restricted
    if (agent.is_restricted && hasProperAccountSetup) return true; // Include premium if billing setup
    return false;
  });
}
```

### UI Enhancements
- **Gift icon (🎁)**: Indicates free agents available to authenticated users
- **Star icon (⭐)**: Indicates the default agent (unchanged)
- **Lock icon (🔒)**: Indicates premium agents requiring billing setup (unchanged)
- **Check icon (✓)**: Indicates the currently selected agent (unchanged)

### Updated User Experience Messages
- For authenticated users without billing: *"Free agents (🎁) are available to all authenticated users. Premium agents (🔒) require billing setup."*
- For authenticated users with billing: *"Free agents (🎁) are available to all authenticated users. Premium agents (🔒) are also available with your billing setup."*
- For non-authenticated users: *"Sign in to access our AI agents. Free agents are available to authenticated users, while premium agents require billing setup."*

## RFP Design Agent

The initial free agent implementation includes the **RFP Design** agent:

- **Purpose**: Provides basic RFP design and creation assistance to authenticated users
- **Target Audience**: Users learning about RFPs or needing guidance on basic RFP structure
- **Capabilities**: Fundamental RFP structure, basic requirements gathering, simple procurement strategies
- **Limitations**: Focused on educational and basic use cases (not advanced enterprise features)

## Testing

### Unit Tests
- `AgentService.test.ts`: Comprehensive tests for new free agent functionality
- `AgentSelector.test.tsx`: Component tests for free agent UI and access control

### Test Coverage
- Free agent filtering logic
- Access control for different user types
- UI indicators and messages
- Agent selection workflows
- Error handling scenarios

## Usage Guidelines

### For Basic Users (Authenticated, No Billing)
- Automatically start with **Solutions** agent (default)
- Can access **RFP Design** agent (free)
- Can access **Onboarding** agent (public)
- Cannot access premium agents (**Technical Support**, **RFP Assistant**)

### For Premium Users (Authenticated, With Billing)
- Access to all agents including free and premium ones
- Can see visual indicators for all agent types
- Full multi-agent functionality

### For Non-Authenticated Users
- Can only access **Solutions** agent (default)
- All other agents appear disabled with appropriate messaging

## Security Considerations

- Free agent access requires authentication (prevents abuse)
- Access control is enforced at the service layer
- UI components respect the three-tier access control flags
- Database indexes support efficient filtering
- Row-level security policies can be extended if needed

## Migration Notes

When updating existing databases:
1. Run the updated `agents-schema.sql` to add the `is_free` column and index
2. Existing agents will default to `is_free = FALSE` (no change in behavior)
3. The "RFP Design" agent will be created with `is_free = TRUE`
4. All existing access control continues to work as before

## Future Enhancements

### Potential Free Agent Candidates
- **Basic Document Generator**: Simple document creation without advanced features
- **Procurement Basics**: Educational agent for procurement fundamentals
- **Vendor Research**: Basic vendor research capabilities

### Usage Analytics
- Track free agent usage to understand user engagement
- Monitor conversion from free to premium agent usage
- Analyze which free agents drive user authentication

### Customization Options
- Allow administrators to configure which agents are free
- Support time-limited free access trials
- Enable feature-limited free versions of premium agents

## API Changes

### New Methods
```typescript
// Get only free agents
AgentService.getFreeAgents(): Promise<Agent[]>
```

### Updated Methods
```typescript
// Updated to handle free agent filtering
AgentService.getAvailableAgents(hasProperAccountSetup, isAuthenticated): Promise<Agent[]>

// Updated to include free agents for authenticated users
AgentService.getAgentsByUserRole(userRole): Promise<Agent[]>
```

### Component Props
```typescript
// AgentSelector component props remain the same
interface AgentSelectorProps {
  hasProperAccountSetup?: boolean; // Controls premium agent access
  isAuthenticated?: boolean;       // Controls free agent access
  // ... other props unchanged
}
```
