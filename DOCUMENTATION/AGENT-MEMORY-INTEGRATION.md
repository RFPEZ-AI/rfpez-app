# Agent Memory Integration Guide for RFPEZ.AI

## Overview

This guide outlines how to integrate Supabase's pgvector-based memory system to provide long-term memory capabilities for RFPEZ agents. The system will enable agents to:

1. **Remember past conversations** across sessions
2. **Recall user preferences and context** from previous interactions
3. **Access relevant historical information** using semantic search
4. **Build knowledge over time** about users, RFPs, and workflows

## Architecture

### Current State
- ✅ **pgvector extension** - Enabled (as of October 9, 2025)
- ✅ **Messages table** - Stores conversation history with agent attribution
- ✅ **Sessions table** - Organizes conversations
- ✅ **Agents table** - Defines agent personalities and instructions
- ✅ **Claude API integration** - Function calling via Edge Functions

### New Components for Memory

```
┌─────────────────────────────────────────────────────────────┐
│                    Memory System Architecture                │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  User Input → Agent → Memory Retrieval → Claude API         │
│                  ↓                              ↓             │
│          Memory Storage ← New Conversation      │            │
│                  ↓                              ↓             │
│          Vector Search ← Semantic Indexing      │            │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Plan

### Phase 1: Database Schema Setup

#### 1.1 Create Agent Memory Tables

```sql
-- ============================================================================
-- AGENT MEMORY TABLES
-- ============================================================================

-- Agent memory entries - stores semantically searchable memory chunks
CREATE TABLE IF NOT EXISTS public.agent_memories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
  
  -- Memory content
  content TEXT NOT NULL,
  memory_type TEXT NOT NULL CHECK (memory_type IN (
    'conversation',    -- Conversation snippets
    'preference',      -- User preferences
    'fact',           -- Important facts about user or context
    'decision',       -- Important decisions made
    'context'         -- Contextual information about RFPs, bids, etc.
  )),
  
  -- Vector embedding for semantic search
  embedding vector(384), -- gte-small model produces 384 dimensions
  
  -- Metadata
  importance_score FLOAT DEFAULT 0.5 CHECK (importance_score >= 0 AND importance_score <= 1),
  access_count INTEGER DEFAULT 0, -- Track how often this memory is recalled
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  
  -- Temporal tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE, -- Optional expiry for temporary memories
  
  -- Additional context
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Full-text search support
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(content, ''))
  ) STORED
);

-- Memory relationships - link memories to specific entities
CREATE TABLE IF NOT EXISTS public.memory_references (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  memory_id UUID REFERENCES public.agent_memories(id) ON DELETE CASCADE NOT NULL,
  
  -- Reference type and ID (flexible reference system)
  reference_type TEXT NOT NULL CHECK (reference_type IN (
    'rfp',
    'bid',
    'artifact',
    'message',
    'user_profile'
  )),
  reference_id UUID NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(memory_id, reference_type, reference_id)
);

-- Memory access log - track when memories are retrieved
CREATE TABLE IF NOT EXISTS public.memory_access_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  memory_id UUID REFERENCES public.agent_memories(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
  agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
  
  accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  relevance_score FLOAT, -- How relevant was this memory to the query
  
  metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Vector similarity search index (HNSW for better performance)
CREATE INDEX IF NOT EXISTS idx_agent_memories_embedding ON public.agent_memories 
  USING hnsw (embedding vector_cosine_ops);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_agent_memories_search ON public.agent_memories 
  USING gin(search_vector);

-- Query optimization indexes
CREATE INDEX IF NOT EXISTS idx_agent_memories_user_agent ON public.agent_memories(user_id, agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_memories_session ON public.agent_memories(session_id);
CREATE INDEX IF NOT EXISTS idx_agent_memories_type ON public.agent_memories(memory_type);
CREATE INDEX IF NOT EXISTS idx_agent_memories_importance ON public.agent_memories(importance_score DESC);
CREATE INDEX IF NOT EXISTS idx_agent_memories_created ON public.agent_memories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_memories_expires ON public.agent_memories(expires_at) 
  WHERE expires_at IS NOT NULL;

-- Reference lookups
CREATE INDEX IF NOT EXISTS idx_memory_references_memory ON public.memory_references(memory_id);
CREATE INDEX IF NOT EXISTS idx_memory_references_ref ON public.memory_references(reference_type, reference_id);

-- Access log analytics
CREATE INDEX IF NOT EXISTS idx_memory_access_log_memory ON public.memory_access_log(memory_id);
CREATE INDEX IF NOT EXISTS idx_memory_access_log_session ON public.memory_access_log(session_id);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

ALTER TABLE public.agent_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_access_log ENABLE ROW LEVEL SECURITY;

-- Agent memories: users can only access their own memories
DROP POLICY IF EXISTS "Users can view their own agent memories" ON public.agent_memories;
CREATE POLICY "Users can view their own agent memories" 
  ON public.agent_memories FOR SELECT 
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own agent memories" ON public.agent_memories;
CREATE POLICY "Users can insert their own agent memories" 
  ON public.agent_memories FOR INSERT 
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own agent memories" ON public.agent_memories;
CREATE POLICY "Users can update their own agent memories" 
  ON public.agent_memories FOR UPDATE 
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own agent memories" ON public.agent_memories;
CREATE POLICY "Users can delete their own agent memories" 
  ON public.agent_memories FOR DELETE 
  USING (user_id = auth.uid());

-- Memory references: follow the same access pattern as memories
DROP POLICY IF EXISTS "Users can view memory references" ON public.memory_references;
CREATE POLICY "Users can view memory references" 
  ON public.memory_references FOR SELECT 
  USING (
    memory_id IN (
      SELECT id FROM public.agent_memories WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert memory references" ON public.memory_references;
CREATE POLICY "Users can insert memory references" 
  ON public.memory_references FOR INSERT 
  WITH CHECK (
    memory_id IN (
      SELECT id FROM public.agent_memories WHERE user_id = auth.uid()
    )
  );

-- Memory access log: users can view access logs for their memories
DROP POLICY IF EXISTS "Users can view memory access logs" ON public.memory_access_log;
CREATE POLICY "Users can view memory access logs" 
  ON public.memory_access_log FOR SELECT 
  USING (
    memory_id IN (
      SELECT id FROM public.agent_memories WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to search agent memories by semantic similarity
CREATE OR REPLACE FUNCTION search_agent_memories(
  p_user_id UUID,
  p_agent_id UUID,
  p_query_embedding vector(384),
  p_memory_types TEXT[] DEFAULT NULL,
  p_limit INTEGER DEFAULT 10,
  p_similarity_threshold FLOAT DEFAULT 0.7
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  memory_type TEXT,
  importance_score FLOAT,
  similarity FLOAT,
  created_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.content,
    m.memory_type,
    m.importance_score,
    1 - (m.embedding <=> p_query_embedding) as similarity,
    m.created_at,
    m.metadata
  FROM public.agent_memories m
  WHERE m.user_id = p_user_id
    AND m.agent_id = p_agent_id
    AND (m.expires_at IS NULL OR m.expires_at > NOW())
    AND (p_memory_types IS NULL OR m.memory_type = ANY(p_memory_types))
    AND 1 - (m.embedding <=> p_query_embedding) > p_similarity_threshold
  ORDER BY 
    (m.embedding <=> p_query_embedding) ASC,
    m.importance_score DESC
  LIMIT p_limit;
END;
$$;

-- Function to update memory access tracking
CREATE OR REPLACE FUNCTION update_memory_access(
  p_memory_id UUID,
  p_session_id UUID DEFAULT NULL,
  p_agent_id UUID DEFAULT NULL,
  p_relevance_score FLOAT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update the memory record
  UPDATE public.agent_memories
  SET 
    access_count = access_count + 1,
    last_accessed_at = NOW()
  WHERE id = p_memory_id;
  
  -- Log the access
  INSERT INTO public.memory_access_log (
    memory_id,
    session_id,
    agent_id,
    relevance_score
  )
  VALUES (
    p_memory_id,
    p_session_id,
    p_agent_id,
    p_relevance_score
  );
END;
$$;

-- Function to clean up expired memories
CREATE OR REPLACE FUNCTION cleanup_expired_memories()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.agent_memories
  WHERE expires_at IS NOT NULL 
    AND expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;
```

#### 1.2 Create Migration File

Create a new migration:

```bash
npx supabase migration new add_agent_memory_system
```

Then paste the above SQL into the generated migration file.

### Phase 2: Memory Service Layer

#### 2.1 Create MemoryService

Create `src/services/memoryService.ts`:

```typescript
// Copyright Mark Skiba, 2025 All rights reserved

import { supabase } from '../services/supabaseClient';
import { pipeline } from '@xenova/transformers';

// Memory types supported by the system
export type MemoryType = 'conversation' | 'preference' | 'fact' | 'decision' | 'context';

// Memory entry structure
export interface AgentMemory {
  id?: string;
  agent_id: string;
  user_id: string;
  session_id?: string;
  content: string;
  memory_type: MemoryType;
  embedding?: number[];
  importance_score?: number;
  expires_at?: string;
  metadata?: Record<string, any>;
}

// Search result structure
export interface MemorySearchResult extends AgentMemory {
  similarity: number;
  created_at: string;
}

export class MemoryService {
  private static embeddingGenerator: any = null;

  /**
   * Initialize the embedding generator (lazy loading)
   */
  private static async getEmbeddingGenerator() {
    if (!this.embeddingGenerator) {
      this.embeddingGenerator = await pipeline(
        'feature-extraction',
        'Supabase/gte-small'
      );
    }
    return this.embeddingGenerator;
  }

  /**
   * Generate an embedding for text content
   */
  private static async generateEmbedding(text: string): Promise<number[]> {
    const generator = await this.getEmbeddingGenerator();
    const output = await generator(text, {
      pooling: 'mean',
      normalize: true,
    });
    return Array.from(output.data);
  }

  /**
   * Store a new memory for an agent
   */
  static async storeMemory(memory: AgentMemory): Promise<string | null> {
    try {
      // Generate embedding for the memory content
      const embedding = await this.generateEmbedding(memory.content);

      const { data, error } = await supabase
        .from('agent_memories')
        .insert({
          agent_id: memory.agent_id,
          user_id: memory.user_id,
          session_id: memory.session_id,
          content: memory.content,
          memory_type: memory.memory_type,
          embedding,
          importance_score: memory.importance_score || 0.5,
          expires_at: memory.expires_at,
          metadata: memory.metadata || {},
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error storing memory:', error);
        return null;
      }

      return data?.id || null;
    } catch (error) {
      console.error('Error in storeMemory:', error);
      return null;
    }
  }

  /**
   * Search memories by semantic similarity
   */
  static async searchMemories(
    userId: string,
    agentId: string,
    query: string,
    options: {
      memoryTypes?: MemoryType[];
      limit?: number;
      similarityThreshold?: number;
    } = {}
  ): Promise<MemorySearchResult[]> {
    try {
      // Generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(query);

      // Call the search function
      const { data, error } = await supabase.rpc('search_agent_memories', {
        p_user_id: userId,
        p_agent_id: agentId,
        p_query_embedding: queryEmbedding,
        p_memory_types: options.memoryTypes || null,
        p_limit: options.limit || 10,
        p_similarity_threshold: options.similarityThreshold || 0.7,
      });

      if (error) {
        console.error('Error searching memories:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in searchMemories:', error);
      return [];
    }
  }

  /**
   * Get recent memories for context
   */
  static async getRecentMemories(
    userId: string,
    agentId: string,
    limit: number = 10
  ): Promise<AgentMemory[]> {
    try {
      const { data, error } = await supabase
        .from('agent_memories')
        .select('*')
        .eq('user_id', userId)
        .eq('agent_id', agentId)
        .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error getting recent memories:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getRecentMemories:', error);
      return [];
    }
  }

  /**
   * Update memory access tracking
   */
  static async trackMemoryAccess(
    memoryId: string,
    sessionId?: string,
    agentId?: string,
    relevanceScore?: number
  ): Promise<void> {
    try {
      await supabase.rpc('update_memory_access', {
        p_memory_id: memoryId,
        p_session_id: sessionId,
        p_agent_id: agentId,
        p_relevance_score: relevanceScore,
      });
    } catch (error) {
      console.error('Error tracking memory access:', error);
    }
  }

  /**
   * Extract and store important information from a message
   */
  static async extractAndStoreFromMessage(
    message: string,
    userId: string,
    agentId: string,
    sessionId: string
  ): Promise<void> {
    try {
      // This is a simplified version - you could use Claude API to extract
      // important facts, preferences, and decisions from the conversation
      
      // For now, we'll store conversation snippets
      await this.storeMemory({
        agent_id: agentId,
        user_id: userId,
        session_id: sessionId,
        content: message,
        memory_type: 'conversation',
        importance_score: 0.5,
      });
    } catch (error) {
      console.error('Error extracting and storing from message:', error);
    }
  }

  /**
   * Build memory context for Claude API
   */
  static async buildMemoryContext(
    userId: string,
    agentId: string,
    currentQuery: string
  ): Promise<string> {
    try {
      // Search for relevant memories
      const memories = await this.searchMemories(userId, agentId, currentQuery, {
        limit: 5,
        similarityThreshold: 0.75,
      });

      if (memories.length === 0) {
        return '';
      }

      // Format memories into context string
      const memoryContext = memories
        .map((mem) => {
          const typeLabel = mem.memory_type.toUpperCase();
          return `[${typeLabel}] ${mem.content}`;
        })
        .join('\n');

      // Track access for each memory
      memories.forEach((mem) => {
        if (mem.id) {
          this.trackMemoryAccess(mem.id, undefined, agentId, mem.similarity);
        }
      });

      return `\n\nRELEVANT MEMORIES:\n${memoryContext}\n\n`;
    } catch (error) {
      console.error('Error building memory context:', error);
      return '';
    }
  }
}
```

### Phase 3: Integration with Claude API

#### 3.1 Update ClaudeService to Use Memory

Modify `src/services/claudeService.ts` to include memory context:

```typescript
// Add this import at the top
import { MemoryService } from './memoryService';

// Modify the sendMessage method to include memory context
static async sendMessage(
  message: string,
  sessionId: string,
  agentId: string,
  conversationHistory: ConversationMessage[] = [],
  currentRfpId?: string,
  availableTools?: string[]
): Promise<ClaudeResponse> {
  try {
    // Get user ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Build memory context
    const memoryContext = await MemoryService.buildMemoryContext(
      user.id,
      agentId,
      message
    );

    // Add memory context to agent instructions (system message)
    const agentWithMemory = {
      ...agent,
      instructions: agent.instructions + memoryContext
    };

    // Continue with existing Claude API call...
    // ... rest of the existing code
  } catch (error) {
    // ... error handling
  }
}
```

#### 3.2 Update Edge Function

Modify `supabase/functions/claude-api-v3/index.ts` to support memory context in the request.

### Phase 4: Memory Extraction and Storage

#### 4.1 Automatic Memory Extraction

Add memory extraction to message handling in `useMessageHandling.ts`:

```typescript
// After successfully sending a message and receiving a response:
useEffect(() => {
  if (lastAssistantMessage && session && currentAgent) {
    // Extract and store memories from the conversation
    MemoryService.extractAndStoreFromMessage(
      lastAssistantMessage.content,
      session.user_id,
      currentAgent.id,
      session.id
    );
  }
}, [lastAssistantMessage, session, currentAgent]);
```

### Phase 5: Memory Management UI (Optional)

Create a memory management interface where users can:
- View their stored memories
- Delete specific memories
- Adjust importance scores
- See memory analytics

### Phase 6: Testing & Deployment

#### 6.1 Local Testing

```bash
# Apply migration locally
npx supabase db reset

# Test memory storage
# Test memory retrieval
# Test semantic search
```

#### 6.2 Deploy to Production

```bash
# Push migration to remote
npx supabase db push

# Deploy updated Edge Functions
npx supabase functions deploy claude-api-v3
```

## Usage Examples

### Example 1: Agent Remembering User Preferences

```typescript
// User says: "I prefer detailed technical explanations"
// System automatically stores as preference memory

// Later conversation:
// When user asks a technical question, agent retrieves this preference
// and provides detailed technical explanation
```

### Example 2: Contextual RFP Information

```typescript
// Agent stores important decisions about an RFP
await MemoryService.storeMemory({
  agent_id: currentAgent.id,
  user_id: userId,
  session_id: sessionId,
  content: 'User decided to focus on LED efficiency requirements for RFP-2024-LED-001',
  memory_type: 'decision',
  importance_score: 0.9,
  metadata: {
    rfp_id: 'rfp-uuid-here',
    decision_date: new Date().toISOString()
  }
});

// Later, when discussing the same RFP, this context is automatically retrieved
```

## Performance Considerations

1. **Embedding Generation**: Using gte-small (384 dimensions) provides good balance of quality and performance
2. **Index Type**: HNSW index provides fast similarity search for production use
3. **Memory Pruning**: Implement periodic cleanup of low-importance, unused memories
4. **Caching**: Consider caching frequently accessed memories

## Security Considerations

1. **RLS Policies**: All memory tables have proper Row Level Security
2. **User Isolation**: Memories are strictly isolated per user
3. **Sensitive Data**: Consider encrypting highly sensitive memory content
4. **GDPR Compliance**: Provide memory export and deletion capabilities

## Future Enhancements

1. **Memory Consolidation**: Merge similar memories to reduce redundancy
2. **Importance Decay**: Gradually reduce importance of old, unaccessed memories
3. **Cross-Agent Memory**: Allow certain memories to be shared across agents
4. **Memory Visualization**: Show users a timeline or graph of their memories
5. **Smart Summarization**: Use Claude to periodically summarize and consolidate memories

## Resources

- [Supabase pgvector Documentation](https://supabase.com/docs/guides/database/extensions/pgvector)
- [Semantic Search Guide](https://supabase.com/docs/guides/ai/semantic-search)
- [Transformer.js for Embeddings](https://huggingface.co/docs/transformers.js)
- [Vector Indexes Performance](https://supabase.com/docs/guides/ai/vector-indexes)
