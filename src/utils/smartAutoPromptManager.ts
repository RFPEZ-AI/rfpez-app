// Copyright Mark Skiba, 2025 All rights reserved

// Smart auto-prompt system to reduce unnecessary Claude API calls

interface AutoPromptContext {
  formType: string;
  formData: Record<string, unknown>;
  currentPhase: string;
  rfpStatus: string;
  lastAgentAction: string;
}

interface AutoPromptRule {
  condition: (context: AutoPromptContext) => boolean;
  prompt: (context: AutoPromptContext) => string;
  skipIfRecentSimilar?: boolean;
  priority: number;
}

export class SmartAutoPromptManager {
  private static recentPrompts: Array<{ prompt: string; timestamp: number }> = [];
  private static readonly RECENT_THRESHOLD = 30000; // 30 seconds

  /**
   * Auto-prompt rules ordered by priority (higher = more important)
   */
  private static autoPromptRules: AutoPromptRule[] = [
    {
      // High priority: Critical workflow transitions
      condition: () => false, // Disabled for now
      prompt: () => `I completed the buyer questionnaire with project details. Please proceed to Phase 5-6 auto-generation.`,
      priority: 100,
      skipIfRecentSimilar: false
    },
    
    {
      // Medium priority: Form submissions that should trigger actions
      condition: (ctx) => ctx.formType.includes('questionnaire') && !ctx.lastAgentAction.includes('create_form'),
      prompt: (ctx) => `I submitted the ${ctx.formType.replace('_', ' ')} form. Please process this and continue the workflow.`,
      priority: 50,
      skipIfRecentSimilar: true
    },
    
    {
      // Low priority: General form completions
      condition: (ctx) => ctx.formType !== 'test' && !ctx.formType.includes('preview'),
      prompt: (ctx) => `I completed the ${ctx.formType.replace('_', ' ')} form.`,
      priority: 10,
      skipIfRecentSimilar: true
    }
  ];

  /**
   * Decide whether to send an auto-prompt and what to send
   */
  static shouldSendAutoPrompt(
    formName: string, 
    formData: Record<string, unknown>,
    rfpContext?: { status?: string; phase?: string },
    lastMessages?: Array<{ content: string; isUser: boolean; timestamp: Date }>
  ): { shouldSend: boolean; prompt?: string; reason?: string } {
    
    // Skip auto-prompts for test/preview forms
    if (formName.toLowerCase().includes('test') || 
        formName.toLowerCase().includes('preview') || 
        formName.toLowerCase().includes('demo')) {
      return { 
        shouldSend: false, 
        reason: 'Skipping auto-prompt for test/preview form' 
      };
    }

    // Skip if user just sent a manual message (within last 10 seconds)
    const recentUserMessage = lastMessages?.find(msg => 
      msg.isUser && 
      Date.now() - msg.timestamp.getTime() < 10000
    );
    
    if (recentUserMessage) {
      return { 
        shouldSend: false, 
        reason: 'User sent manual message recently' 
      };
    }

    // Build context for rules
    const context: AutoPromptContext = {
      formType: this.normalizeFormType(formName),
      formData,
      currentPhase: this.detectCurrentPhase(formName),
      rfpStatus: rfpContext?.status || 'unknown',
      lastAgentAction: this.getLastAgentAction(lastMessages)
    };

    // Find highest priority applicable rule
    const applicableRules = this.autoPromptRules
      .filter(rule => rule.condition(context))
      .sort((a, b) => b.priority - a.priority);

    if (applicableRules.length === 0) {
      return { 
        shouldSend: false, 
        reason: 'No applicable auto-prompt rules' 
      };
    }

    const selectedRule = applicableRules[0];
    const prompt = selectedRule.prompt(context);

    // Check for recent similar prompts if required
    if (selectedRule.skipIfRecentSimilar && this.hasRecentSimilarPrompt(prompt)) {
      return { 
        shouldSend: false, 
        reason: 'Similar prompt sent recently' 
      };
    }

    // Record this prompt
    this.recordPrompt(prompt);

    return {
      shouldSend: true,
      prompt,
      reason: `Priority ${selectedRule.priority} rule triggered`
    };
  }

  /**
   * Normalize form type for consistent matching
   */
  private static normalizeFormType(formName: string): string {
    return formName
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }

  /**
   * Detect current workflow phase based on form
   */
  private static detectCurrentPhase(formName: string): string {
    const normalizedName = formName.toLowerCase();
    
    if (normalizedName.includes('buyer') || normalizedName.includes('questionnaire')) {
      return 'phase_4_collection';
    }
    if (normalizedName.includes('supplier') || normalizedName.includes('bid')) {
      return 'phase_5_supplier';
    }
    if (normalizedName.includes('rfp') || normalizedName.includes('request')) {
      return 'phase_6_generation';
    }
    
    return 'unknown';
  }

  /**
   * Extract last agent action from conversation history
   */
  private static getLastAgentAction(messages?: Array<{ content: string; isUser: boolean }>): string {
    if (!messages) return '';
    
    const lastAgentMessage = [...messages]
      .reverse()
      .find(msg => !msg.isUser);
    
    return lastAgentMessage?.content || '';
  }

  /**
   * Check if a similar prompt was sent recently
   */
  private static hasRecentSimilarPrompt(prompt: string): boolean {
    const now = Date.now();
    
    // Clean up old prompts
    this.recentPrompts = this.recentPrompts.filter(
      p => now - p.timestamp < this.RECENT_THRESHOLD
    );

    // Check for similarity (simple string comparison for now)
    const promptWords = prompt.toLowerCase().split(' ');
    
    return this.recentPrompts.some(recent => {
      const recentWords = recent.prompt.toLowerCase().split(' ');
      const intersection = promptWords.filter(word => recentWords.includes(word));
      return intersection.length / promptWords.length > 0.7; // 70% similarity threshold
    });
  }

  /**
   * Record a prompt as sent
   */
  private static recordPrompt(prompt: string) {
    this.recentPrompts.push({
      prompt,
      timestamp: Date.now()
    });
  }

  /**
   * Clear recent prompts (for testing)
   */
  static clearRecentPrompts() {
    this.recentPrompts = [];
  }

  /**
   * Get stats for debugging
   */
  static getStats() {
    return {
      recentPromptsCount: this.recentPrompts.length,
      rulesCount: this.autoPromptRules.length,
      recentPrompts: this.recentPrompts.map(p => ({
        prompt: p.prompt.substring(0, 50) + '...',
        age: Date.now() - p.timestamp
      }))
    };
  }
}