// Copyright Mark Skiba, 2025 All rights reserved

import { supabase } from '../supabaseClient';
import { pipeline } from '@xenova/transformers';
import type {
  AgentMemory,
  MemorySearchResult,
  MemorySearchOptions,
  StoreMemoryOptions,
  MemoryStatistics,
  MemoryType,
} from '../types/memory';

/**
 * Service for managing agent memory system
 * Provides semantic search, storage, and retrieval of agent memories
 */
export class MemoryService {
  private static embeddingGenerator: any = null;
  private static isInitializing = false;

  /**
   * Initialize the embedding generator (lazy loading)
   */
  private static async getEmbeddingGenerator() {
    if (this.embeddingGenerator) {
      return this.embeddingGenerator;
    }

    // Prevent multiple simultaneous initializations
    if (this.isInitializing) {
      // Wait for initialization to complete
      while (this.isInitializing) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return this.embeddingGenerator;
    }

    try {
      this.isInitializing = true;
      console.log('Initializing embedding generator...');
      this.embeddingGenerator = await pipeline(
        'feature-extraction',
        'Supabase/gte-small'
      );
      console.log('Embedding generator initialized successfully');
      return this.embeddingGenerator;
    } catch (error) {
      console.error('Error initializing embedding generator:', error);
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Generate an embedding for text content
   * Returns null if embedding generation fails (graceful fallback)
   */
  private static async generateEmbedding(text: string): Promise<number[] | null> {
    try {
      const generator = await this.getEmbeddingGenerator();
      const output = await generator(text, {
        pooling: 'mean',
        normalize: true,
      });
      return Array.from(output.data);
    } catch (error) {
      console.warn('⚠️ Client-side embedding generation failed, will use server-side fallback:', error);
      // Return null to indicate we should use server-side embeddings
      return null;
    }
  }

  /**
   * Store a new memory for an agent
   */
  static async storeMemory(
    memory: AgentMemory,
    options?: StoreMemoryOptions
  ): Promise<string | null> {
    try {
      console.log('🧠 MEMORY STORE: Creating new memory...', {
        type: memory.memory_type,
        content: memory.content.substring(0, 100) + '...',
        importance: options?.importance_score ?? memory.importance_score ?? 0.5
      });

      // Generate embedding for the memory content
      const embedding = await this.generateEmbedding(memory.content);

      // If embedding generation failed, log warning but continue
      if (!embedding) {
        console.warn('⚠️ MEMORY STORE: Client-side embedding failed, server will handle it');
        // Return null to indicate we should use server-side memory creation
        return null;
      }

      const memoryData = {
        agent_id: memory.agent_id,
        user_id: memory.user_id,
        session_id: memory.session_id || null,
        content: memory.content,
        memory_type: memory.memory_type,
        embedding,
        importance_score: options?.importance_score ?? memory.importance_score ?? 0.5,
        expires_at: options?.expires_at ?? memory.expires_at ?? null,
        metadata: options?.metadata ?? memory.metadata ?? {},
      };

      const { data, error } = await supabase
        .from('agent_memories')
        .insert(memoryData)
        .select('id')
        .single();

      if (error) {
        console.error('Error storing memory:', error);
        return null;
      }

      const memoryId = data?.id;

      // Store references if provided
      if (memoryId && options?.references && options.references.length > 0) {
        const references = options.references.map(ref => ({
          memory_id: memoryId,
          reference_type: ref.reference_type,
          reference_id: ref.reference_id,
        }));

        const { error: refError } = await supabase
          .from('memory_references')
          .insert(references);

        if (refError) {
          console.error('Error storing memory references:', refError);
        } else {
          console.log(`🔗 MEMORY STORE: Added ${options.references.length} references`);
        }
      }

      if (memoryId) {
        console.log(`✅ MEMORY STORE: Successfully stored memory ${memoryId}`);
      }

      return memoryId || null;
    } catch (error) {
      console.error('❌ MEMORY STORE ERROR:', error);
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
    options: MemorySearchOptions = {}
  ): Promise<MemorySearchResult[]> {
    try {
      // Generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(query);

      // If client-side embedding failed, skip semantic search and return empty
      // The edge function will handle memory search server-side
      if (!queryEmbedding) {
        console.log('⚠️ Skipping client-side memory search, edge function will handle it');
        return [];
      }

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

      return (data || []) as MemorySearchResult[];
    } catch (error) {
      console.warn('⚠️ Client-side memory search failed, edge function will handle it:', error);
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
