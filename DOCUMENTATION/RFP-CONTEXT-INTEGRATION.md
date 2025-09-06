# RFP Context Integration for Agents

## Overview

This implementation adds the ability for users to set a "current RFP" context that gets passed to AI agents, enabling context-aware assistance for RFP management tasks.

## Features Implemented

### 1. RFP Context State Management (Home.tsx)

Added state variables and handlers:
- `currentRfpId`: Stores the ID of the currently selected RFP
- `currentRfp`: Stores the full RFP object for the current context
- `handleSetCurrentRfp()`: Sets a specific RFP as the current context
- `handleClearCurrentRfp()`: Clears the current RFP context

### 2. Enhanced RFP Menu (GenericMenu.tsx)

Enhanced the generic menu component to support RFP context selection:
- Added `onSetCurrent` callback for setting current items
- Added `currentItemId` prop to highlight the currently selected item
- Added visual indicators (radio buttons) to show current selection
- Added "Clear Current RFP" option when an RFP is selected
- Users can now click a radio button next to any RFP to set it as current

### 3. Claude Service Integration (claudeService.ts)

Updated the Claude service to include RFP context in agent conversations:
- Added `currentRfp` parameter to `generateResponse()` method
- Enhanced system prompt to include current RFP details:
  - RFP ID for database operations
  - RFP Name for reference
  - RFP Description for context
  - RFP Specification for technical details
- Added debug logging to track RFP context in API calls

### 4. RFP Design Agent Enhancement

Updated the RFP Design agent instructions to leverage current RFP context:
- **Context Awareness**: Agent knows which RFP it's working with
- **Database Operations**: Uses current RFP ID for all proposal-related updates
- **Content Building**: References existing RFP details instead of starting from scratch
- **User Guidance**: Instructs users to set RFP context when needed
- **Phase-based Workflow**: Enhanced to work with existing RFP data

### 5. Visual Indicators

Added UI elements to show current RFP context:
- **Menu Indicators**: Radio buttons in RFP menu show current selection
- **Header Chip**: Small pill below agent indicator displays current RFP name
- **Color Coding**: Current RFP highlighted in primary color

## Usage Workflow

### Setting RFP Context
1. User clicks the "RFP" button in the main menu
2. Clicks the radio button next to any RFP to set it as current
3. The selected RFP becomes the current context for all agent interactions
4. A visual indicator appears in the header showing the current RFP name

### Agent Interaction with Context
1. When agents receive requests, they see the current RFP context in their system prompt
2. RFP Design agent can immediately work with the existing RFP details
3. All database operations use the current RFP ID automatically
4. Agent responses are tailored to the specific RFP context

### Clearing Context
1. User can click "Clear Current RFP" from the RFP menu
2. Context is cleared and agents return to general assistance mode

## Database Integration

The system uses existing RFP database fields with the current RFP ID:
- `buyer_questionnaire`: Stores questionnaire structure
- `buyer_questionnaire_response`: Stores user responses
- `proposal`: Stores final RFP design content

## Benefits

### For Users
- **Contextual Assistance**: Agents understand which RFP is being worked on
- **Seamless Workflow**: No need to repeatedly specify RFP details
- **Visual Clarity**: Clear indication of current working context
- **Efficient Operations**: Direct database updates to the correct RFP

### For Agents
- **Context Awareness**: Full access to RFP details in every interaction
- **Database Operations**: Automatic use of correct RFP ID
- **Content Continuity**: Build upon existing RFP content
- **Enhanced Responses**: Tailored assistance based on specific RFP

## Technical Details

### Context Propagation Flow
1. User sets current RFP → `handleSetCurrentRfp()`
2. RFP context stored in component state
3. Chat message triggers → Claude service called with RFP context
4. System prompt enhanced with RFP details
5. Agent receives context and responds accordingly

### Error Handling
- Graceful handling when no RFP context is set
- Agent guidance to set context when needed
- Safe fallbacks for database operations

### Future Enhancements
- Persist current RFP context across sessions
- Context-aware function calling for RFP operations
- Multiple RFP context support for comparison tasks
- Auto-context detection based on conversation content

## Files Modified

- `src/pages/Home.tsx`: State management and UI integration
- `src/services/claudeService.ts`: Context propagation to agents
- `src/components/GenericMenu.tsx`: Current item selection functionality
- `DOCUMENTATION/Agent Instructions/RFP Design Agent.md`: Enhanced instructions
- `database/agents-schema.sql`: Updated agent database instructions

## Testing Recommendations

1. **Context Setting**: Verify RFP context is set correctly via menu
2. **Agent Responses**: Test that RFP Design agent references current RFP
3. **Database Operations**: Confirm updates use correct RFP ID
4. **UI Indicators**: Check visual feedback for current context
5. **Context Clearing**: Ensure context can be cleared properly

This implementation provides a foundation for context-aware RFP management that can be extended to other agents and workflows as needed.
