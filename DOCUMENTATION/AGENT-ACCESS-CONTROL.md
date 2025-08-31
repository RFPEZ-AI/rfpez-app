# Agent Access Control System

## Overview

The RFPEZ.AI multi-agent system includes comprehensive access control features that provide different levels of agent availability based on user authentication status, account setup, and business requirements. The system now supports three tiers of access:

1. **Public Access** - Default agent available to all users
2. **Free Access** - Free agents available to authenticated users without billing
3. **Premium Access** - Restricted agents requiring proper account setup and billing

> **Note**: For detailed information about the free access tier, see [AGENT-FREE-ACCESS.md](./AGENT-FREE-ACCESS.md)

## New Database Fields

### `is_default` (Boolean)
- Identifies which agent should be selected by default when users first access the system
- Only one agent should have `is_default = TRUE` at a time
- Currently set to the **Solutions** agent

### `is_restricted` (Boolean)
- Determines whether an agent requires proper account setup to access
- `FALSE` = Available to all users (unrestricted)
- `TRUE` = Requires proper account setup (restricted)

## Current Agent Configuration

| Agent Name | is_default | is_restricted | Description |
|------------|------------|---------------|-------------|
| **Solutions** | TRUE | FALSE | Default sales agent - available to all users |
| **Onboarding** | FALSE | FALSE | Onboarding specialist - available to all users |
| **Technical Support** | FALSE | TRUE | Technical support - requires account setup |
| **RFP Assistant** | FALSE | TRUE | RFP specialist - requires account setup |

## Implementation Details

### Database Schema Updates
- Added `is_default` and `is_restricted` columns to the `agents` table
- Created indexes for efficient querying
- Updated agent insertion logic to clean up and properly configure agents

### Service Layer Changes
- **`AgentService.getDefaultAgent()`**: Retrieves the agent marked as default
- **`AgentService.getAvailableAgents(hasProperAccountSetup)`**: Filters agents based on access level
- **`AgentService.getActiveAgents()`**: Returns all active agents (admin/internal use)

### UI Enhancements
- **Star icon (⭐)**: Indicates the default agent
- **Lock icon (🔒)**: Indicates restricted agents (when visible to admins)
- **Check icon (✓)**: Indicates the currently selected agent

### Access Control Logic
```typescript
// Users without proper account setup see only unrestricted agents
const availableAgents = hasProperAccountSetup 
  ? allActiveAgents 
  : allActiveAgents.filter(agent => !agent.is_restricted);
```

## Account Setup Status

Currently, the system defaults to `hasProperAccountSetup = false`, meaning:
- ✅ Users can access: **Solutions** and **Onboarding** agents
- ❌ Users cannot access: **Technical Support** and **RFP Assistant** agents

## Future Enhancements

### TODO: Implement Account Setup Detection
```typescript
// Example implementation for checking account setup
const hasProperAccountSetup = userProfile?.subscription_tier === 'premium' 
  || userProfile?.account_verified === true
  || userProfile?.payment_method_verified === true;
```

### Potential Criteria for "Proper Account Setup"
- Premium subscription status
- Payment method verification
- Account verification completion
- Specific role permissions
- Company domain verification
- Trial period completion

## Usage Guidelines

### For Basic Users (No Account Setup)
- Automatically start with **Solutions** agent (default)
- Can switch to **Onboarding** agent
- Restricted agents are filtered out and not visible

### For Premium Users (With Account Setup)
- Access to all agents including restricted ones
- Can see visual indicators for restricted agents
- Full multi-agent functionality

### For Administrators
- Use `getActiveAgents()` to see all agents regardless of restrictions
- Can modify agent properties in database
- Can set different default agents as needed

## Security Considerations

- Access control is enforced at the service layer
- UI components respect the access control flags
- Database policies can be extended to enforce row-level security
- Account setup verification should be implemented server-side

## Migration Notes

When updating existing databases:
1. Run the updated `agents-schema.sql` to add new columns
2. Existing agents will default to `is_default = FALSE` and `is_restricted = FALSE`
3. The Solutions agent will be marked as default
4. Technical Support and RFP Assistant will be marked as restricted
