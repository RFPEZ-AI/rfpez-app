// Copyright Mark Skiba, 2025 All rights reserved

import { supabase } from '../supabaseClient';
import type {
  AgentMemory,
  MemorySearchResult,
  MemorySearchOptions,
  StoreMemoryOptions,
  MemoryStatistics,
  // MemoryType, // Unused - commented out to fix lint warning
} from '../types/memory';

/**
 * Service for managing agent memory system
 * 
 * NOTE: All embedding generation and semantic search is handled server-side
 * by the edge function. Client-side embedding has been removed to simplify
 * the architecture and avoid unnecessary dependencies.
 */
export class MemoryService {
  /**
   * Generate an embedding for text content
   * ALWAYS returns null - embeddings are generated server-side only
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private static async generateEmbedding(_text: string): Promise<number[] | null> {
    // Client-side embedding removed - all embeddings generated server-side
    return null;
  }

  /**
   * Store a new memory for an agent
   * NOTE: Memory storage is handled server-side via edge function tools
   * This method is kept for backward compatibility but should not be used
   */
  /* eslint-disable @typescript-eslint/no-unused-vars */
  static async storeMemory(
    _memory: AgentMemory,
    _options?: StoreMemoryOptions
  ): Promise<string | null> {
    console.warn('⚠️ MEMORY STORE: Client-side memory storage deprecated. Use edge function tools instead.');
    // All memory storage should go through edge function tools (create_memory)
    return null;
  }
  /* eslint-enable @typescript-eslint/no-unused-vars */

  /**
   * Search memories by semantic similarity
   * NOTE: Memory search is handled server-side via edge function tools
   * This method is kept for backward compatibility but always returns empty
   */
  /* eslint-disable @typescript-eslint/no-unused-vars */
  static async searchMemories(
    _userId: string,
    _agentId: string,
    _query: string,
    _options: MemorySearchOptions = {}
  ): Promise<MemorySearchResult[]> {
    console.log('⚠️ Client-side memory search deprecated. Edge function handles all memory search.');
    // All memory search should go through edge function tools (search_memories)
    return [];
  }
  /* eslint-enable @typescript-eslint/no-unused-vars */

  /**
   * Get recent memories for context
   */
  static async getRecentMemories(
    userId: string,
    agentId: string,
    limit = 10
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

      return (data || []) as AgentMemory[];
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
        p_session_id: sessionId || null,
        p_agent_id: agentId || null,
        p_relevance_score: relevanceScore || null,
      });
    } catch (error) {
      console.error('Error tracking memory access:', error);
    }
  }

  /**
   * Extract and store important information from a conversation
   */
  static async extractAndStoreFromConversation(
    messages: Array<{ content: string; role: string }>,
    userId: string,
    agentId: string,
    sessionId: string
  ): Promise<void> {
    try {
      // For now, store the last few user messages as conversation memories
      // In the future, this could use Claude to extract facts, preferences, etc.
      const userMessages = messages
        .filter(m => m.role === 'user')
        .slice(-3); // Store last 3 user messages

      for (const msg of userMessages) {
        if (msg.content.length > 20) { // Only store substantial messages
          await this.storeMemory(
            {
              agent_id: agentId,
              user_id: userId,
              session_id: sessionId,
              content: msg.content,
              memory_type: 'conversation',
            },
            {
              importance_score: 0.5,
            }
          );
        }
      }
    } catch (error) {
      console.error('Error extracting and storing from conversation:', error);
    }
  }

  /**
   * Build memory context string for Claude API
   */
  static async buildMemoryContext(
    userId: string,
    agentId: string,
    currentQuery: string,
    options?: MemorySearchOptions
  ): Promise<string> {
    try {
      console.log('🔍 MEMORY SEARCH: Searching for relevant memories...', {
        query: currentQuery.substring(0, 50) + '...',
        limit: options?.limit || 5
      });

      // Search for relevant memories
      const memories = await this.searchMemories(
        userId,
        agentId,
        currentQuery,
        {
          limit: options?.limit || 5,
          similarityThreshold: options?.similarityThreshold || 0.75,
          memoryTypes: options?.memoryTypes,
        }
      );

      if (memories.length === 0) {
        console.log('💭 MEMORY SEARCH: No relevant memories found');
        return '';
      }

      console.log(`✅ MEMORY SEARCH: Found ${memories.length} relevant memories`);

      // Format memories into context string
      const memoryContext = memories
        .map((mem) => {
          const typeLabel = mem.memory_type.toUpperCase();
          const similarityPercent = Math.round(mem.similarity * 100);
          return `[${typeLabel}] (${similarityPercent}% relevant) ${mem.content}`;
        })
        .join('\n');

      // Track access for each memory (don't await to not slow down response)
      memories.forEach((mem) => {
        if (mem.id) {
          this.trackMemoryAccess(mem.id, undefined, agentId, mem.similarity);
        }
      });

      return `\n\n## RELEVANT MEMORIES FROM PAST CONVERSATIONS:\n${memoryContext}\n`;
    } catch (error) {
      console.error('Error building memory context:', error);
      return '';
    }
  }

  /**
   * Store a user preference
   */
  static async storePreference(
    userId: string,
    agentId: string,
    preference: string,
    sessionId?: string,
    metadata?: Record<string, any>
  ): Promise<string | null> {
    return this.storeMemory(
      {
        agent_id: agentId,
        user_id: userId,
        session_id: sessionId,
        content: preference,
        memory_type: 'preference',
      },
      {
        importance_score: 0.8, // Preferences are important
        metadata,
      }
    );
  }

  /**
   * Store an important fact
   */
  static async storeFact(
    userId: string,
    agentId: string,
    fact: string,
    sessionId?: string,
    metadata?: Record<string, any>
  ): Promise<string | null> {
    return this.storeMemory(
      {
        agent_id: agentId,
        user_id: userId,
        session_id: sessionId,
        content: fact,
        memory_type: 'fact',
      },
      {
        importance_score: 0.7,
        metadata,
      }
    );
  }

  /**
   * Store a decision
   */
  static async storeDecision(
    userId: string,
    agentId: string,
    decision: string,
    sessionId?: string,
    metadata?: Record<string, any>
  ): Promise<string | null> {
    return this.storeMemory(
      {
        agent_id: agentId,
        user_id: userId,
        session_id: sessionId,
        content: decision,
        memory_type: 'decision',
      },
      {
        importance_score: 0.9, // Decisions are very important
        metadata,
      }
    );
  }

  /**
   * Get memory statistics for a user
   */
  static async getMemoryStatistics(
    userId: string,
    agentId?: string
  ): Promise<MemoryStatistics[]> {
    try {
      const { data, error } = await supabase.rpc('get_memory_statistics', {
        p_user_id: userId,
        p_agent_id: agentId || null,
      });

      if (error) {
        console.error('Error getting memory statistics:', error);
        return [];
      }

      return (data || []) as MemoryStatistics[];
    } catch (error) {
      console.error('Error in getMemoryStatistics:', error);
      return [];
    }
  }

  /**
   * Delete a specific memory
   */
  static async deleteMemory(memoryId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('agent_memories')
        .delete()
        .eq('id', memoryId);

      if (error) {
        console.error('Error deleting memory:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteMemory:', error);
      return false;
    }
  }

  /**
   * Clean up expired memories
   */
  static async cleanupExpiredMemories(): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('cleanup_expired_memories');

      if (error) {
        console.error('Error cleaning up expired memories:', error);
        return 0;
      }

      return data || 0;
    } catch (error) {
      console.error('Error in cleanupExpiredMemories:', error);
      return 0;
    }
  }
}
