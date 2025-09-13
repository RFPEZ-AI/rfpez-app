// Copyright Mark Skiba, 2025 All rights reserved

import { AgentService } from './agentService';
import { supabase } from '../supabaseClient';
import type { Agent } from '../types/database';

// Mock the supabase client
jest.mock('../supabaseClient', () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn()
  }
}));

// Mock the RoleService
jest.mock('./roleService', () => ({
  RoleService: {
    hasRoleAccess: jest.fn()
  }
}));

describe('AgentService', () => {
  const mockSupabase = supabase as jest.Mocked<typeof supabase>;
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockAgents: Agent[] = [
    {
      id: '1',
      name: 'Solutions',
      description: 'Sales agent',
      instructions: 'You are a sales agent',
      initial_prompt: 'How can I help you?',
      is_active: true,
      is_default: true,
      is_restricted: false,
      is_free: false,
      sort_order: 0,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z'
    },
    {
      id: '2',
      name: 'RFP Design',
      description: 'Free RFP design agent',
      instructions: 'You are an RFP design specialist',
      initial_prompt: 'I can help you design RFPs',
      is_active: true,
      is_default: false,
      is_restricted: false,
      is_free: true,
      sort_order: 1,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z'
    },
    {
      id: '3',
      name: 'Technical Support',
      description: 'Premium support agent',
      instructions: 'You provide technical support',
      initial_prompt: 'How can I assist you?',
      is_active: true,
      is_default: false,
      is_restricted: true,
      is_free: false,
      sort_order: 2,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z'
    }
  ];

  describe('getActiveAgents', () => {
    it('should return all active agents', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockAgents,
              error: null
            })
          })
        })
      } as any);

      const result = await AgentService.getActiveAgents();

      expect(result).toEqual(mockAgents);
      expect(mockSupabase.from).toHaveBeenCalledWith('agents');
    });

    it('should handle database errors gracefully', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' }
            })
          })
        })
      } as any);

      const result = await AgentService.getActiveAgents();

      expect(result).toEqual([]);
    });
  });

  describe('getFreeAgents', () => {
    it('should return only free agents', async () => {
      const freeAgents = mockAgents.filter(agent => agent.is_free);
      
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockImplementation((field, _value) => {
            if (field === 'is_active') {
              return {
                eq: jest.fn().mockImplementation((field2, _value2) => {
                  if (field2 === 'is_free') {
                    return {
                      order: jest.fn().mockResolvedValue({
                        data: freeAgents,
                        error: null
                      })
                    };
                  }
                })
              };
            }
          })
        })
      } as any);

      const result = await AgentService.getFreeAgents();

      expect(result).toEqual(freeAgents);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('RFP Design');
    });
  });

  describe('getAvailableAgents', () => {
    beforeEach(() => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockAgents,
              error: null
            })
          })
        })
      } as any);
    });

    it('should return only default agent for non-authenticated users', async () => {
      const result = await AgentService.getAvailableAgents(false, false);

      expect(result).toHaveLength(1);
      expect(result[0].is_default).toBe(true);
      expect(result[0].name).toBe('Solutions');
    });

    it('should return default and free agents for authenticated users without billing', async () => {
      const result = await AgentService.getAvailableAgents(false, true);

      expect(result).toHaveLength(2);
      expect(result.some(agent => agent.is_default)).toBe(true);
      expect(result.some(agent => agent.is_free)).toBe(true);
      expect(result.every(agent => !agent.is_restricted)).toBe(true);
    });

    it('should return all agents for authenticated users with proper account setup', async () => {
      const result = await AgentService.getAvailableAgents(true, true);

      expect(result).toHaveLength(3);
      expect(result.some(agent => agent.is_default)).toBe(true);
      expect(result.some(agent => agent.is_free)).toBe(true);
      expect(result.some(agent => agent.is_restricted)).toBe(true);
    });

    it('should exclude restricted agents for authenticated users without proper account setup', async () => {
      const result = await AgentService.getAvailableAgents(false, true);

      const restrictedAgents = result.filter(agent => agent.is_restricted);
      expect(restrictedAgents).toHaveLength(0);
    });

    it('should include free agents for authenticated users regardless of billing setup', async () => {
      const resultWithoutBilling = await AgentService.getAvailableAgents(false, true);
      const resultWithBilling = await AgentService.getAvailableAgents(true, true);

      const freeAgentWithoutBilling = resultWithoutBilling.find(agent => agent.is_free);
      const freeAgentWithBilling = resultWithBilling.find(agent => agent.is_free);

      expect(freeAgentWithoutBilling).toBeDefined();
      expect(freeAgentWithBilling).toBeDefined();
      expect(freeAgentWithoutBilling?.name).toBe('RFP Design');
      expect(freeAgentWithBilling?.name).toBe('RFP Design');
    });
  });

  describe('getDefaultAgent', () => {
    it('should return the default agent', async () => {
      const defaultAgent = mockAgents.find(agent => agent.is_default);
      
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockImplementation((field, _value) => {
            if (field === 'is_active') {
              return {
                eq: jest.fn().mockImplementation((field2, _value2) => {
                  if (field2 === 'is_default') {
                    return {
                      single: jest.fn().mockResolvedValue({
                        data: defaultAgent,
                        error: null
                      })
                    };
                  }
                })
              };
            }
          })
        })
      } as any);

      const result = await AgentService.getDefaultAgent();

      expect(result).toEqual(defaultAgent);
      expect(result?.is_default).toBe(true);
    });

    it('should fallback to first active agent if no default is set', async () => {
      // Mock no default agent found
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'No default agent' }
              })
            })
          })
        })
      } as any);

      // Mock getActiveAgents call
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockAgents,
              error: null
            })
          })
        })
      } as any);

      const result = await AgentService.getDefaultAgent();

      expect(result).toEqual(mockAgents[0]);
    });
  });

  describe('Agent access control scenarios', () => {
    beforeEach(() => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockAgents,
              error: null
            })
          })
        })
      } as any);
    });

    it('should handle guest user access correctly', async () => {
      const result = await AgentService.getAvailableAgents(false, false);
      
      // Guest users should only see default agent
      expect(result).toHaveLength(1);
      expect(result[0].is_default).toBe(true);
    });

    it('should handle authenticated user without billing correctly', async () => {
      const result = await AgentService.getAvailableAgents(false, true);
      
      // Should include default, free, and non-restricted agents
      const hasDefault = result.some(agent => agent.is_default);
      const hasFree = result.some(agent => agent.is_free);
      const hasRestricted = result.some(agent => agent.is_restricted);
      
      expect(hasDefault).toBe(true);
      expect(hasFree).toBe(true);
      expect(hasRestricted).toBe(false);
    });

    it('should handle authenticated user with billing correctly', async () => {
      const result = await AgentService.getAvailableAgents(true, true);
      
      // Should include all agents
      const hasDefault = result.some(agent => agent.is_default);
      const hasFree = result.some(agent => agent.is_free);
      const hasRestricted = result.some(agent => agent.is_restricted);
      
      expect(hasDefault).toBe(true);
      expect(hasFree).toBe(true);
      expect(hasRestricted).toBe(true);
      expect(result).toHaveLength(3);
    });
  });
});
