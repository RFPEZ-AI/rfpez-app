// Copyright Mark Skiba, 2025 All rights reserved

/**
 * Memory types supported by the agent memory system
 */
export type MemoryType = 'conversation' | 'preference' | 'fact' | 'decision' | 'context';

/**
 * Reference types that can be linked to memories
 */
export type MemoryReferenceType = 'rfp' | 'bid' | 'artifact' | 'message' | 'user_profile';

/**
 * Agent memory entry structure
 */
export interface AgentMemory {
  id?: string;
  agent_id: string;
  user_id: string;
  session_id?: string;
  content: string;
  memory_type: MemoryType;
  embedding?: number[];
  importance_score?: number;
  access_count?: number;
  last_accessed_at?: string;
  created_at?: string;
  expires_at?: string;
  metadata?: Record<string, any>;
}

/**
 * Memory search result with similarity score
 */
export interface MemorySearchResult extends AgentMemory {
  similarity: number;
}

/**
 * Memory reference linking memories to entities
 */
export interface MemoryReference {
  id?: string;
  memory_id: string;
  reference_type: MemoryReferenceType;
  reference_id: string;
  created_at?: string;
}

/**
 * Memory access log entry
 */
export interface MemoryAccessLog {
  id?: string;
  memory_id: string;
  session_id?: string;
  agent_id?: string;
  accessed_at?: string;
  relevance_score?: number;
  metadata?: Record<string, any>;
}

/**
 * Memory statistics for analytics
 */
export interface MemoryStatistics {
  total_memories: number;
  memory_type: MemoryType;
  count: number;
  avg_importance: number;
}

/**
 * Options for memory search
 */
export interface MemorySearchOptions {
  memoryTypes?: MemoryType[];
  limit?: number;
  similarityThreshold?: number;
  includeExpired?: boolean;
}

/**
 * Options for storing memories
 */
export interface StoreMemoryOptions {
  importance_score?: number;
  expires_at?: string;
  metadata?: Record<string, any>;
  references?: Array<{
    reference_type: MemoryReferenceType;
    reference_id: string;
  }>;
}
