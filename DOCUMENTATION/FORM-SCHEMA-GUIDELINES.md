# Form Schema Guidelines

## Problem: Nested Schema vs Flat Data Mismatch

When creating buyer questionnaire forms, there was a mismatch between:
- **Schema Structure**: Nested objects (e.g., `budget_and_pricing.pricing_preference`)
- **Data Storage**: Flat fields (e.g., `pricing_preference` at root level)

This causes form rendering issues where nested schema fields don't match flat database storage.

## Solution: Use Flat Schema Structure

### ✅ Correct Schema Format (Flat)

```json
{
  "type": "object",
  "title": "Construction Sand Requirements Questionnaire",
  "properties": {
    "company_name": {
      "type": "string",
      "title": "Company Name"
    },
    "contact_person": {
      "type": "string",
      "title": "Contact Person"
    },
    "pricing_preference": {
      "type": "string",
      "title": "Pricing Preference",
      "enum": ["Per ton", "Per cubic yard", "Per truckload", "Total project price"]
    },
    "budget_range": {
      "type": "string",
      "title": "Budget Range",
      "enum": ["Under $5,000", "$5,000 - $15,000", "$15,000 - $50,000"]
    }
  },
  "required": ["company_name", "contact_person"]
}
```

### ❌ Problematic Schema Format (Nested)

```json
{
  "type": "object",
  "title": "Construction Sand Requirements Questionnaire",
  "properties": {
    "project_information": {
      "type": "object",
      "title": "Project Information",
      "properties": {
        "company_name": {
          "type": "string",
          "title": "Company Name"
        }
      }
    },
    "budget_and_pricing": {
      "type": "object",
      "title": "Budget and Pricing",
      "properties": {
        "pricing_preference": {
          "type": "string",
          "title": "Pricing Preference"
        }
      }
    }
  }
}
```

## UI Schema for Organization

If you need visual grouping, use **uiSchema** instead of nested properties:

```json
{
  "schema": {
    "type": "object",
    "properties": {
      "company_name": { "type": "string", "title": "Company Name" },
      "pricing_preference": { "type": "string", "title": "Pricing Preference" }
    }
  },
  "uiSchema": {
    "ui:order": ["company_name", "*", "pricing_preference"],
    "ui:ObjectFieldTemplate": "section-template"
  }
}
```

## Agent Instructions Update

**RFP Design Agent** should follow these rules when creating buyer questionnaires:

1. **All form fields at root level** - No nested objects in properties
2. **Use flat field names** - `company_name`, not `project_information.company_name`
3. **Use uiSchema for grouping** - Visual organization without data nesting
4. **Match database structure** - Flat JSONB in `default_values` column

### Example Agent Instruction Addition:

```markdown
When creating buyer questionnaires:
- Generate flat JSON Schema with all fields at the root `properties` level
- Do NOT use nested object properties (no `project_information.company_name`)
- Use snake_case field names (e.g., `company_name`, `contact_person`)
- Group related fields visually using uiSchema, not nested schemas
- Ensure schema structure matches the flat JSONB storage in database
```

## Migration Strategy for Existing Forms

For forms already created with nested schemas:

1. **CustomFormRenderer** now handles both nested and flat structures
2. Nested schema objects are rendered as sections with sub-fields
3. Flat data fields are rendered as standalone inputs
4. Both approaches work, but new forms should use flat structure

## Database Storage

Forms store data in `artifacts` table:
- `schema`: JSONB - Should be flat structure
- `ui_schema`: JSONB - For visual organization
- `default_values`: JSONB - Always flat, matches schema properties
- All fields at root level for easy querying and updates

## Testing

When creating a new form:
1. ✅ Verify schema has no nested `type: "object"` properties
2. ✅ Check all fields are at root `properties` level
3. ✅ Test form renders with populated data
4. ✅ Verify Save Draft persists all fields
5. ✅ Confirm Submit sends flat data structure
