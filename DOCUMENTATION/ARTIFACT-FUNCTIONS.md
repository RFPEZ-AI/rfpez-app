# Artifact Functions Documentation

## Overview

The Artifact Functions provide a comprehensive set of tools for creating, managing, and displaying interactive forms and other artifacts in the artifacts window. These functions enable Claude to present structured content that users can interact with directly.

## Available Functions

### 1. create_form_artifact

Creates and displays a new form in the artifacts window.

**Parameters:**
- `title` (required): Display title for the form
- `description` (optional): Description of the form's purpose
- `form_schema` (required): JSON Schema defining form structure and validation
- `ui_schema` (optional): UI Schema for customizing appearance and behavior
- `form_data` (optional): Initial/default data to populate the form
- `submit_action` (optional): Configuration for form submission

**Example:**
```javascript
const result = await claudeAPIHandler.executeFunction('create_form_artifact', {
  title: 'Contact Form',
  description: 'Please fill out your contact information',
  form_schema: {
    type: 'object',
    properties: {
      name: { type: 'string', title: 'Full Name' },
      email: { type: 'string', format: 'email', title: 'Email' }
    },
    required: ['name', 'email']
  },
  ui_schema: {
    email: { 'ui:placeholder': 'your@email.com' }
  },
  submit_action: {
    type: 'function_call',
    function_name: 'process_contact',
    success_message: 'Thank you for your submission!'
  }
});
```

### 2. update_form_artifact

Updates an existing form artifact with new data or schema.

**Parameters:**
- `artifact_id` (required): ID of the artifact to update
- `updates` (required): Object containing fields to update

**Example:**
```javascript
await claudeAPIHandler.executeFunction('update_form_artifact', {
  artifact_id: 'form_123456',
  updates: {
    title: 'Updated Contact Form',
    form_data: { name: 'John Doe', email: 'john@example.com' }
  }
});
```

### 3. get_form_submission

Retrieves form submission data from a specific artifact.

**Parameters:**
- `artifact_id` (required): ID of the form artifact
- `session_id` (optional): Session ID to associate with the submission

**Example:**
```javascript
const submission = await claudeAPIHandler.executeFunction('get_form_submission', {
  artifact_id: 'form_123456',
  session_id: 'session_789'
});
```

### 4. validate_form_data

Validates form data against a JSON schema.

**Parameters:**
- `form_schema` (required): JSON Schema to validate against
- `form_data` (required): Form data to validate

**Example:**
```javascript
const validation = await claudeAPIHandler.executeFunction('validate_form_data', {
  form_schema: {
    type: 'object',
    properties: {
      email: { type: 'string', format: 'email' }
    },
    required: ['email']
  },
  form_data: { email: 'invalid-email' }
});
// Returns: { valid: false, errors: [...], warnings: [...] }
```

### 5. create_artifact_template

Creates a reusable template for forms or other artifacts.

**Parameters:**
- `template_name` (required): Name of the template
- `template_type` (required): Type of template (form, document, chart, table)
- `template_schema` (required): Schema definition for the template
- `template_ui` (optional): UI configuration for the template
- `description` (optional): Description of the template
- `tags` (optional): Array of tags for categorization

**Example:**
```javascript
const template = await claudeAPIHandler.executeFunction('create_artifact_template', {
  template_name: 'Basic Contact Form',
  template_type: 'form',
  template_schema: { /* form schema */ },
  description: 'A standard contact form template',
  tags: ['contact', 'basic', 'reusable']
});
```

### 6. list_artifact_templates

Lists available artifact templates with optional filtering.

**Parameters:**
- `template_type` (optional): Filter by template type (default: 'all')
- `tags` (optional): Filter by tags array

**Example:**
```javascript
const templates = await claudeAPIHandler.executeFunction('list_artifact_templates', {
  template_type: 'form',
  tags: ['contact']
});
```

### 7. get_artifact_status

Gets the current status and metadata of an artifact.

**Parameters:**
- `artifact_id` (required): ID of the artifact to check

**Example:**
```javascript
const status = await claudeAPIHandler.executeFunction('get_artifact_status', {
  artifact_id: 'form_123456'
});
```

## Form Schema Structure

The `form_schema` parameter uses JSON Schema format:

```javascript
{
  type: 'object',
  title: 'Form Title',
  description: 'Form description',
  properties: {
    fieldName: {
      type: 'string|number|boolean|array|object',
      title: 'Field Display Name',
      description: 'Field description',
      // Additional constraints like format, minimum, maximum, enum, etc.
    }
  },
  required: ['fieldName1', 'fieldName2']
}
```

## UI Schema Structure

The `ui_schema` parameter customizes form appearance:

```javascript
{
  fieldName: {
    'ui:widget': 'textarea|select|radio|checkbox|password|hidden',
    'ui:placeholder': 'Placeholder text',
    'ui:help': 'Help text',
    'ui:options': {
      rows: 4,          // For textarea
      addable: true,    // For arrays
      removable: true   // For arrays
    }
  }
}
```

## Submit Actions

The `submit_action` parameter defines what happens when the form is submitted:

```javascript
{
  type: 'function_call|save_session|export_data',
  function_name: 'function_to_call',  // For function_call type
  success_message: 'Success message to show user'
}
```

## Common Use Cases

### 1. Contact Forms
- Lead generation
- Support requests
- Feedback collection

### 2. RFP Forms
- Requirements gathering
- Vendor information collection
- Project specifications

### 3. Survey Forms
- User research
- Satisfaction surveys
- Data collection

### 4. Configuration Forms
- Settings panels
- Preference forms
- Setup wizards

## Database Tables

The artifact functions use these database tables:

- `artifacts`: Stores artifact definitions and data
- `artifact_submissions`: Stores form submission data
- `artifact_templates`: Stores reusable templates

## Error Handling

All functions include proper error handling and return structured responses:

```javascript
{
  success: true|false,
  message: 'Human-readable message',
  // Additional response data
}
```

## Bid View Artifacts

### Design Pattern: One Bid View Per RFP

The bid view artifact follows a **singleton pattern** per RFP, ensuring that only one bid view exists for each RFP at any given time.

**Key Characteristics:**
- **Deterministic ID**: Bid view artifacts use a consistent ID format: `bid-view-{rfpId}` (no timestamp)
- **Reusable**: When a bid view is requested for an RFP that already has one, the existing artifact is reused
- **Dynamic Content**: Bid views load fresh data from the database each time they're displayed
- **Auto-Update**: The bid list automatically refreshes with new submissions

**Implementation Details:**
```typescript
// Deterministic ID generation
const bidViewId = `bid-view-${rfpId}`;

// Check for existing bid view before creating
const existingBidView = artifacts.find(a => a.id === bidViewId);

if (existingBidView) {
  // Reuse existing artifact (update name if needed)
  // Content is dynamically loaded by BidView component
} else {
  // Create new bid view artifact only if none exists
}
```

**Why This Design:**
1. **Prevents Clutter**: Avoids multiple duplicate bid views for the same RFP
2. **Consistent State**: Single source of truth for bid viewing per RFP
3. **Better UX**: Users always see the same bid view, avoiding confusion
4. **Dynamic Data**: Fresh bid data is loaded on every view, ensuring accuracy

## Future Extensions

The artifact system is designed to be extensible. Future artifact types may include:

- Document artifacts (for displaying formatted documents)
- Chart artifacts (for data visualization)
- Table artifacts (for tabular data display)
- Interactive dashboards
- Media galleries

Each new artifact type will follow the same pattern of create, update, validate, and manage operations.
