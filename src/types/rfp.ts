// Copyright Mark Skiba, 2025 All rights reserved

// Form Spec Types for RJSF
interface FormSpec {
  version: string; // e.g., "rfpez-form@1"
  schema: Record<string, any>; // JSON Schema (draft-07)
  uiSchema: Record<string, any>; // RJSF uiSchema
  defaults?: Record<string, any>; // Optional default values
}

// RFP Entity
type RFP = {
  id: number;
  name: string;
  due_date: string; // ISO date string
  description: string; // Public description - what the RFP is about
  specification: string; // Detailed requirements for Claude to generate forms
  request?: string | null; // Generated request for proposal (RFP) content to send to suppliers
  buyer_questionnaire?: Record<string, any> | null; // Questionnaire structure for buyer requirements gathering
  buyer_questionnaire_response?: Record<string, any> | null; // Collected buyer questionnaire responses
  bid_form_questionaire?: FormSpec | null; // JSON Schema + RJSF form specification for bid submission
  is_template: boolean;
  is_public: boolean;
  suppliers: number[]; // array of supplier IDs
  agent_ids: number[]; // array of agent IDs
  created_at: string;
  updated_at: string;
};

// Bid Entity
type Bid = {
  id: number;
  rfp_id: number;
  agent_id: number;
  supplier_id?: number;
  artifact_submission_id?: string; // UUID reference to artifact submission (new schema)
  response?: Record<string, unknown>; // JSONB - contains supplier_info, response, submitted_at, form_version (legacy - use artifact_submission_id instead)
  created_at: string;
  updated_at: string;
};


type Supplier = {
  id: number;
  name: string;
  description?: string;
  email?: string;
  phone?: string;
  rfpez_account_id?: number;
};

export type { RFP, Bid, Supplier, FormSpec };
