// RFP Entity
type RFP = {
  id: number;
  name: string;
  due_date: string; // ISO date string
  description?: string;
  document: any; // JSONB
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
  document: any; // JSONB
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

export type { RFP, Bid, Supplier };
