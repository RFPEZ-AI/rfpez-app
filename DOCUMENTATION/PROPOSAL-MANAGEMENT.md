# RFP Proposal Management Features

## Overview

This document describes the proposal management features added to the RFPEZ.AI application. These features allow for automatic proposal generation based on bid submissions and questionnaire responses.

## Database Changes

### New RFP Fields

Three new fields have been added to the `rfp` table:

1. **`proposal`** (TEXT): Stores the generated proposal text in Markdown format
2. **`buyer_questionnaire`** (JSONB): Stores the questionnaire structure for buyer requirements gathering
3. **`buyer_questionnaire_response`** (JSONB): Stores the collected responses used to generate proposals

### Migration

To apply these changes to your database, run the migration script:

```sql
-- Run the contents of database/add-proposal-fields-migration.sql
```

## Features

### Automatic Proposal Generation

When a bid is submitted through the `BidSubmissionPage`:

1. The bid data is stored in the `bid.response` field
2. A proposal is automatically generated using the bid data and RFP information
3. The proposal is stored in the `rfp.proposal` field
4. The questionnaire response data is stored in the `rfp.buyer_questionnaire_response` field

### Proposal Management UI

The `ProposalManager` component provides:

- **Generate Proposal**: Creates a new proposal based on questionnaire responses
- **Edit Proposal**: Allows manual editing of the generated proposal text
- **Copy to Clipboard**: Easily copy proposal text for external use
- **Download**: Export proposal as a Markdown file
- **View Questionnaire Data**: Inspect the source data used for proposal generation

### Integration Points

#### RFP Edit Modal

The `RFPEditModal` now includes a "Proposals" tab that:

- Shows the proposal management interface
- Is only available for existing RFPs (requires an RFP ID)
- Allows viewing and editing generated proposals

#### Bid Submission Flow

The `BidSubmissionPage` automatically:

- Generates proposals when bids are submitted
- Stores proposal data in the RFP record
- Continues to function normally even if proposal generation fails

## API Methods

### RFPService

New methods added to `RFPService`:

- `updateRfpProposal(rfpId, proposal)`: Updates the proposal text
- `updateRfpBuyerQuestionnaire(rfpId, questionnaire)`: Updates questionnaire structure
- `updateRfpBuyerQuestionnaireResponse(rfpId, response)`: Updates response data
- `generateProposal(rfp, bidData, supplierInfo)`: Generates proposal text

## Usage Examples

### Generating a Proposal

```typescript
// Automatic generation during bid submission
const proposal = await RFPService.generateProposal(rfp, formData, supplierInfo);
await RFPService.updateRfpProposal(rfp.id, proposal);
```

### Using the Proposal Manager

```tsx
<ProposalManager
  rfp={rfp}
  onProposalUpdate={(proposal) => {
    console.log('Proposal updated:', proposal);
  }}
  readonly={false}
/>
```

## Data Flow

1. **Bid Submission**: User submits bid via form
2. **Data Storage**: Bid data stored in `bid.response`
3. **Proposal Generation**: System generates proposal using RFP + bid data
4. **Storage**: Proposal stored in `rfp.proposal`
5. **Management**: Users can view/edit proposals via RFP edit interface

## Future Enhancements

- **Claude API Integration**: Replace mock proposal generation with real AI
- **Template System**: Allow custom proposal templates
- **Bulk Operations**: Generate proposals for multiple bids
- **Export Formats**: Support for PDF, DOCX exports
- **Approval Workflow**: Add proposal review and approval process

## Testing

Test the proposal features by:

1. Creating an RFP with a bid form
2. Submitting a bid through the generated form
3. Viewing the generated proposal in the RFP edit modal
4. Using the proposal management tools to edit and export

## Notes

- Proposal generation is non-blocking - bid submission succeeds even if proposal generation fails
- All proposal data is stored as JSONB for flexibility
- The system maintains backward compatibility with existing RFPs
- Proposals are generated in Markdown format for easy editing and export
