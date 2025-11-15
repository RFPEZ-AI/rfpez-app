// Copyright Mark Skiba, 2025 All rights reserved

/**
 * Knowledge Retrieval Service
 * Handles semantic search and retrieval of uploaded files from account_memories
 */

import { supabase } from '../supabaseClient';

export interface KnowledgeEntry {
  id: string;
  content: string;
  fileName?: string;
  fileType?: string;
  mimeType?: string;
  importanceScore: number;
  similarity?: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface KnowledgeSearchOptions {
  limit?: number;
  minSimilarity?: number;
  fileTypesFilter?: string[];
  accountId: string;
}

export class KnowledgeRetrievalService {
  /**
   * Generate embedding for query text using edge function
   */
  private static async generateEmbedding(text: string): Promise<number[] | null> {
    try {
      const { data, error } = await supabase.functions.invoke('generate-embedding', {
        body: { text }
      });

      if (error) {
        console.error('Error generating embedding:', error);
        return null;
      }

      if (!data?.embedding) {
        console.error('No embedding in response:', data);
        return null;
      }

      return data.embedding;
    } catch (error) {
      console.error('Exception generating embedding:', error);
      return null;
    }
  }

  /**
   * Search knowledge base using semantic similarity
   * Uses pgvector cosine similarity search
   */
  static async searchKnowledge(
    query: string,
    options: KnowledgeSearchOptions
  ): Promise<KnowledgeEntry[]> {
    const { 
      limit = 5, 
      minSimilarity = 0.7,
      // fileTypesFilter, // Reserved for future filtering enhancement
      accountId 
    } = options;

    try {
      // Generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(query);
      
      if (!queryEmbedding) {
        console.warn('Could not generate embedding for query, falling back to text search');
        return this.fallbackTextSearch(query, options);
      }

      // Use Supabase RPC function for vector similarity search
      // This assumes we have a function match_account_memories in the database
      const { data, error } = await supabase.rpc('match_account_memories', {
        query_embedding: queryEmbedding,
        match_threshold: minSimilarity,
        match_count: limit,
        filter_account_id: accountId,
        filter_memory_type: 'knowledge'
      });

      if (error) {
        console.error('Error in semantic search:', error);
        return this.fallbackTextSearch(query, options);
      }

      if (!data || data.length === 0) {
        console.log('No results from semantic search, trying text search');
        return this.fallbackTextSearch(query, options);
      }

      // Map results to KnowledgeEntry format
      return data.map((item: {
        id: string;
        content: string;
        file_name: string | null;
        file_type: string | null;
        mime_type: string | null;
        importance_score: number;
        similarity: number;
        metadata: Record<string, unknown> | null;
        created_at: string;
      }) => ({
        id: item.id,
        content: item.content,
        fileName: item.file_name || undefined,
        fileType: item.file_type || undefined,
        mimeType: item.mime_type || undefined,
        importanceScore: item.importance_score,
        similarity: item.similarity,
        metadata: item.metadata || undefined,
        createdAt: item.created_at
      }));
    } catch (error) {
      console.error('Exception in searchKnowledge:', error);
      return this.fallbackTextSearch(query, options);
    }
  }

  /**
   * Fallback text search using PostgreSQL full-text search
   * Used when embeddings are not available
   */
  private static async fallbackTextSearch(
    query: string,
    options: KnowledgeSearchOptions
  ): Promise<KnowledgeEntry[]> {
    const { limit = 5, fileTypesFilter, accountId } = options;

    try {
      let queryBuilder = supabase
        .from('account_memories')
        .select('id, content, file_name, file_type, mime_type, importance_score, metadata, created_at')
        .eq('account_id', accountId)
        .eq('memory_type', 'knowledge')
        .textSearch('search_vector', query)
        .order('importance_score', { ascending: false })
        .limit(limit);

      // Apply file type filter if provided
      if (fileTypesFilter && fileTypesFilter.length > 0) {
        queryBuilder = queryBuilder.in('file_type', fileTypesFilter);
      }

      const { data, error } = await queryBuilder;

      if (error) {
        console.error('Error in fallback text search:', error);
        return [];
      }

      return (data || []).map((item: {
        id: string;
        content: string;
        file_name: string | null;
        file_type: string | null;
        mime_type: string | null;
        importance_score: number;
        metadata: Record<string, unknown> | null;
        created_at: string;
      }) => ({
        id: item.id,
        content: item.content,
        fileName: item.file_name || undefined,
        fileType: item.file_type || undefined,
        mimeType: item.mime_type || undefined,
        importanceScore: item.importance_score,
        metadata: item.metadata || undefined,
        createdAt: item.created_at
      }));
    } catch (error) {
      console.error('Exception in fallbackTextSearch:', error);
      return [];
    }
  }

  /**
   * Get all uploaded files for an account
   */
  static async getUploadedFiles(
    accountId: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<KnowledgeEntry[]> {
    const { limit = 50, offset = 0 } = options;

    try {
      const { data, error } = await supabase
        .from('account_memories')
        .select('id, content, file_name, file_type, mime_type, file_size_bytes, importance_score, metadata, created_at')
        .eq('account_id', accountId)
        .eq('memory_type', 'knowledge')
        .not('file_name', 'is', null)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error getting uploaded files:', error);
        return [];
      }

      return (data || []).map((item: {
        id: string;
        content: string;
        file_name: string | null;
        file_type: string | null;
        mime_type: string | null;
        importance_score: number;
        metadata: Record<string, unknown> | null;
        created_at: string;
      }) => ({
        id: item.id,
        content: item.content,
        fileName: item.file_name || undefined,
        fileType: item.file_type || undefined,
        mimeType: item.mime_type || undefined,
        importanceScore: item.importance_score,
        metadata: item.metadata || undefined,
        createdAt: item.created_at
      }));
    } catch (error) {
      console.error('Exception in getUploadedFiles:', error);
      return [];
    }
  }

  /**
   * Delete a knowledge entry
   */
  static async deleteKnowledge(
    knowledgeId: string,
    accountId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('account_memories')
        .delete()
        .eq('id', knowledgeId)
        .eq('account_id', accountId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Re-generate embedding for a knowledge entry
   */
  static async regenerateEmbedding(
    knowledgeId: string,
    accountId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // First, get the content
      const { data: entry, error: fetchError } = await supabase
        .from('account_memories')
        .select('content')
        .eq('id', knowledgeId)
        .eq('account_id', accountId)
        .single();

      if (fetchError || !entry) {
        return { success: false, error: 'Knowledge entry not found' };
      }

      // Generate new embedding
      const embedding = await this.generateEmbedding(entry.content);

      if (!embedding) {
        return { success: false, error: 'Failed to generate embedding' };
      }

      // Update the entry with new embedding
      const { error: updateError } = await supabase
        .from('account_memories')
        .update({ embedding })
        .eq('id', knowledgeId)
        .eq('account_id', accountId);

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export default KnowledgeRetrievalService;
