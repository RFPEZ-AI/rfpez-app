# RFP Description and Specification Fields Update

## Summary

This update separates the concerns of RFP description and specification into two distinct fields:

- **Description**: Public-facing field that describes what the RFP is about (displayed to users)
- **Specification**: Internal field containing detailed requirements passed to Claude for form generation

## Changes Made

### 1. Database Schema Updates

#### File: `database/schema.sql`
- Updated RFP table to include both `description` and `specification` as required fields
- Added check constraints to ensure fields are not empty

#### File: `database/migration-make-description-mandatory.sql`
- Migration script to add the `specification` field
- Sets default values for existing records
- Makes both fields NOT NULL with validation constraints

### 2. TypeScript Type Updates

#### File: `src/types/rfp.ts`
- Updated `RFP` type to include both `description: string` and `specification: string` as required fields
- Added comments to clarify the purpose of each field

### 3. UI Component Updates

#### File: `src/components/RFPEditModal.tsx`
- Updated form interfaces (`RFPFormValues`, `RFPEditFormValues`) to include both required fields
- Added specification input field to the basic info tab
- Updated validation logic to require both fields
- Updated `convertToFormValues` function to provide defaults for both fields

#### File: `src/components/forms/FormBuilder.tsx`
- Added `initialSpecification` prop to pre-populate the form builder with RFP specification
- Updated custom form section to indicate when using RFP specification
- Modified placeholder text to guide users appropriately

#### File: `src/components/RFPPreviewModal.tsx`
- Added display of specification field in the preview
- Used pre-wrap styling for specification to preserve formatting

## Usage

### Creating a New RFP

1. **Description**: Enter a brief, public-facing description of what the RFP is for
2. **Specification**: Enter detailed requirements that will be used by Claude to generate the bid form

### Form Generation

When generating bid forms, the system now uses the **specification** field instead of description, ensuring that:
- The public description remains clean and user-friendly
- The detailed specifications provide Claude with comprehensive context for form generation

### Migration

To apply these changes to an existing database:

1. Run the migration script in your Supabase SQL Editor:
   ```sql
   -- Copy and run the contents of database/migration-make-description-mandatory.sql
   ```

2. Existing RFPs will automatically receive default values:
   - Description: "Description not provided" (if empty)
   - Specification: "Please provide detailed specifications for this RFP." (if empty)

## Benefits

1. **Clear Separation of Concerns**: Description for display, specification for AI processing
2. **Better User Experience**: Users can provide concise public descriptions while maintaining detailed specifications
3. **Improved Form Generation**: Claude receives comprehensive specifications without being cluttered by marketing language
4. **Data Integrity**: Both fields are now required, ensuring all RFPs have proper documentation

## Backward Compatibility

- Existing RFPs will continue to work with automatic default values
- The migration script safely handles existing data
- Form generation will work immediately with the new specification field
