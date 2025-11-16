// Copyright Mark Skiba, 2025 All rights reserved
// Agent Inheritance Module
// Handles recursive agent loading, instruction merging, and caching

// deno-lint-ignore-file no-explicit-any

export interface Agent {
  id: string;
  name: string;
  instructions: string;
  initial_prompt?: string;
  role?: string;
  access?: string[]; // Array of allowed tool names
  parent_agent_id?: string | null;
  is_abstract?: boolean;
  access_override?: boolean;
}

export interface InheritanceChain {
  agentId: string;
  agentName: string;
  depth: number;
  instructionsLength: number;
  toolsCount: number;
}

export interface MergedAgent extends Agent {
  _inheritanceChain?: InheritanceChain[];
  _mergedInstructionsLength?: number;
  _mergedToolsCount?: number;
  _cacheTimestamp?: number;
}

// Agent cache for performance
const agentCache = new Map<string, { agent: MergedAgent; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get cached agent if available and not expired
 */
function getCachedAgent(agentId: string): MergedAgent | null {
  const cached = agentCache.get(agentId);
  if (!cached) {
    return null;
  }
  
  const age = Date.now() - cached.timestamp;
  if (age > CACHE_TTL_MS) {
    console.log(`🗑️ CACHE EXPIRED - Removing stale cache for agent: ${agentId} (age: ${Math.round(age / 1000)}s)`);
    agentCache.delete(agentId);
    return null;
  }
  
  console.log(`✅ CACHE HIT - Retrieved agent from cache: ${cached.agent.name} (age: ${Math.round(age / 1000)}s)`);
  return cached.agent;
}

/**
 * Cache merged agent for future requests
 */
function setCachedAgent(agentId: string, agent: MergedAgent): void {
  const timestamp = Date.now();
  agent._cacheTimestamp = timestamp;
  agentCache.set(agentId, { agent, timestamp });
  console.log(`💾 CACHE SET - Cached merged agent: ${agent.name} (tools: ${agent._mergedToolsCount}, instructions: ${agent._mergedInstructionsLength} chars)`);
}

/**
 * Invalidate cache for specific agent (called on agent updates)
 */
export function invalidateAgentCache(agentId: string): void {
  if (agentCache.has(agentId)) {
    console.log(`🗑️ CACHE INVALIDATE - Removing cache for agent: ${agentId}`);
    agentCache.delete(agentId);
  }
}

/**
 * Clear all cached agents
 */
export function clearAgentCache(): void {
  const size = agentCache.size;
  agentCache.clear();
  console.log(`🗑️ CACHE CLEAR - Removed ${size} cached agents`);
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { size: number; entries: Array<{ agentId: string; agentName: string; age: number }> } {
  const now = Date.now();
  const entries = Array.from(agentCache.entries()).map(([agentId, cached]) => ({
    agentId,
    agentName: cached.agent.name,
    age: Math.round((now - cached.timestamp) / 1000) // age in seconds
  }));
  
  return { size: agentCache.size, entries };
}

/**
 * Recursively load agent with all parent agents in inheritance chain
 * @param supabase - Supabase client
 * @param agentId - ID of agent to load
 * @param depth - Current recursion depth (prevents infinite loops)
 * @param maxDepth - Maximum allowed depth (default: 10)
 * @param inheritanceChain - Accumulated chain for logging
 * @returns Fully merged agent with inherited instructions and tools
 */
export async function loadAgentWithInheritance(
  supabase: any,
  agentId: string,
  depth = 0,
  maxDepth = 10,
  inheritanceChain: InheritanceChain[] = []
): Promise<MergedAgent | null> {
  
  // Check cache first (only at depth 0 to cache final merged result)
  if (depth === 0) {
    const cached = getCachedAgent(agentId);
    if (cached) {
      return cached;
    }
  }
  
  // Prevent infinite recursion
  if (depth > maxDepth) {
    console.error('🚨 AGENT INHERITANCE - Maximum depth exceeded:', {
      agentId,
      depth,
      maxDepth,
      chain: inheritanceChain.map(c => c.agentName).join(' → ')
    });
    throw new Error(`Agent inheritance depth exceeds maximum (${maxDepth})`);
  }

  // Load current agent
  console.log(`🔗 AGENT INHERITANCE - Loading agent (depth ${depth}):`, agentId);
  
  const { data: agent, error } = await supabase
    .from('agents')
    .select('id, name, instructions, initial_prompt, role, access, parent_agent_id, is_abstract, access_override')
    .eq('id', agentId)
    .single();

  if (error || !agent) {
    console.error('❌ AGENT INHERITANCE - Failed to load agent:', {
      agentId,
      error: error?.message || 'Agent not found',
      depth
    });
    return null;
  }

  // Add current agent to inheritance chain
  const currentChainEntry: InheritanceChain = {
    agentId: agent.id,
    agentName: agent.name,
    depth: depth,
    instructionsLength: agent.instructions?.length || 0,
    toolsCount: agent.access?.length || 0
  };
  
  const updatedChain = [...inheritanceChain, currentChainEntry];

  // Base case: no parent agent (root)
  if (!agent.parent_agent_id) {
    console.log('✅ AGENT INHERITANCE - Reached root agent:', {
      name: agent.name,
      depth,
      instructionsLength: agent.instructions?.length || 0,
      toolsCount: agent.access?.length || 0,
      isAbstract: agent.is_abstract || false
    });
    
    const rootAgent: MergedAgent = {
      ...agent,
      _inheritanceChain: updatedChain,
      _mergedInstructionsLength: agent.instructions?.length || 0,
      _mergedToolsCount: agent.access?.length || 0
    };
    
    return rootAgent;
  }

  // Recursive case: load parent and merge
  console.log('🔄 AGENT INHERITANCE - Loading parent agent:', {
    childName: agent.name,
    parentId: agent.parent_agent_id,
    depth
  });

  const parentAgent = await loadAgentWithInheritance(
    supabase,
    agent.parent_agent_id,
    depth + 1,
    maxDepth,
    updatedChain
  );

  if (!parentAgent) {
    console.error('❌ AGENT INHERITANCE - Parent agent not found:', {
      childName: agent.name,
      parentId: agent.parent_agent_id
    });
    // Return child agent without parent inheritance
    return {
      ...agent,
      _inheritanceChain: updatedChain,
      _mergedInstructionsLength: agent.instructions?.length || 0,
      _mergedToolsCount: agent.access?.length || 0
    };
  }

  // Merge parent and child
  const merged = mergeAgentWithParent(parentAgent, agent, updatedChain);
  
  // Cache the final merged result (only at depth 0)
  if (depth === 0) {
    setCachedAgent(agentId, merged);
  }
  
  return merged;
}

/**
 * Merge parent and child agents
 * Instructions: parent first, then child (child can override/extend)
 * Tools: union of parent and child (unless access_override is true)
 */
function mergeAgentWithParent(
  parent: MergedAgent,
  child: Agent,
  inheritanceChain: InheritanceChain[]
): MergedAgent {
  
  console.log('🔧 AGENT INHERITANCE - Merging agents:', {
    parent: parent.name,
    child: child.name,
    parentInstructionsLength: parent.instructions?.length || 0,
    childInstructionsLength: child.instructions?.length || 0,
    parentToolsCount: parent.access?.length || 0,
    childToolsCount: child.access?.length || 0
  });

  // Merge instructions: parent → child
  // Add clear separator between parent and child instructions
  const mergedInstructions = [
    parent.instructions || '',
    '\n\n' + '='.repeat(80),
    `\n## SPECIALIZED AGENT: ${child.name}`,
    '='.repeat(80) + '\n',
    child.instructions || ''
  ].join('');

  // Merge tools
  let mergedAccess: string[];
  
  if (child.access_override) {
    // Child explicitly overrides parent tools (rare case)
    mergedAccess = child.access || [];
    console.log('⚠️ AGENT INHERITANCE - Child overrides parent tools:', {
      child: child.name,
      childTools: child.access?.length || 0,
      tools: child.access
    });
  } else {
    // Union of parent and child tools (default behavior)
    const parentTools = parent.access || [];
    const childTools = child.access || [];
    mergedAccess = [...new Set([...parentTools, ...childTools])];
    
    console.log('✅ AGENT INHERITANCE - Merged tools:', {
      parent: parent.name,
      child: child.name,
      parentTools: parentTools.length,
      childTools: childTools.length,
      mergedTools: mergedAccess.length,
      addedTools: childTools.filter(t => !parentTools.includes(t))
    });
  }

  const merged: MergedAgent = {
    ...child, // Child properties take precedence (name, role, etc.)
    instructions: mergedInstructions,
    access: mergedAccess,
    _inheritanceChain: inheritanceChain,
    _mergedInstructionsLength: mergedInstructions.length,
    _mergedToolsCount: mergedAccess.length
  };

  console.log('✅ AGENT INHERITANCE - Merge complete:', {
    finalAgent: merged.name,
    totalInstructions: merged._mergedInstructionsLength,
    totalTools: merged._mergedToolsCount,
    chainDepth: inheritanceChain.length,
    chain: inheritanceChain.map(c => c.agentName).join(' → ')
  });

  return merged;
}

/**
 * Log detailed inheritance information for debugging
 */
export function logInheritanceDetails(agent: MergedAgent): void {
  if (!agent._inheritanceChain || agent._inheritanceChain.length <= 1) {
    console.log('ℹ️ AGENT INHERITANCE - No inheritance for agent:', agent.name);
    return;
  }

  console.log('📊 AGENT INHERITANCE - Detailed breakdown:');
  console.log('━'.repeat(80));
  console.log(`Final Agent: ${agent.name} (ID: ${agent.id})`);
  console.log(`Total Instructions: ${agent._mergedInstructionsLength} characters`);
  console.log(`Total Tools: ${agent._mergedToolsCount}`);
  console.log('');
  console.log('Inheritance Chain:');
  
  agent._inheritanceChain.forEach((link, index) => {
    const indent = '  '.repeat(link.depth);
    const isRoot = index === 0;
    const chainLength = agent._inheritanceChain?.length || 0;
    const isLeaf = index === chainLength - 1;
    console.log(`${indent}${index + 1}. ${link.agentName}${isRoot ? ' (root)' : ''}${isLeaf ? ' (final)' : ''}`);
    console.log(`${indent}   - Instructions: ${link.instructionsLength} chars`);
    console.log(`${indent}   - Tools: ${link.toolsCount}`);
    console.log(`${indent}   - Depth: ${link.depth}`);
  });
  
  console.log('━'.repeat(80));
  console.log('');
  
  // Show instruction preview
  const preview = agent.instructions;
  console.log('Merged Instructions Preview:');
  console.log('First 300 chars:', preview.substring(0, 300) + '...');
  console.log('...');
  console.log('Last 300 chars:', '...' + preview.substring(preview.length - 300));
  console.log('━'.repeat(80));
  
  // Show all tools
  console.log('');
  console.log('All Merged Tools:', agent.access);
  console.log('━'.repeat(80));
}
