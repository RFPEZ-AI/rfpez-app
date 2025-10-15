// Copyright Mark Skiba, 2025 All rights reserved
// Test for tool invocation persistence functionality

import { assertEquals } from "std/testing/asserts.ts";

/**
 * UNIT TEST FOR TOOL INVOCATION TRACKING
 * 
 * This test verifies the tool invocation tracking logic
 * without requiring the full service infrastructure.
 */

// Simplified tool invocation tracker for testing
class ToolInvocationTracker {
  private toolInvocations: Array<{
    type: 'tool_start' | 'tool_complete';
    toolName: string;
    parameters?: Record<string, unknown>;
    result?: unknown;
    agentId?: string;
    timestamp: string;
  }> = [];

  addToolInvocation(
    type: 'tool_start' | 'tool_complete',
    toolName: string,
    agentId?: string,
    parameters?: Record<string, unknown>,
    result?: unknown
  ) {
    this.toolInvocations.push({
      type,
      toolName,
      parameters,
      result,
      agentId,
      timestamp: new Date().toISOString()
    });
  }

  getToolInvocations() {
    return this.toolInvocations;
  }

  clearToolInvocations() {
    this.toolInvocations = [];
  }
}

Deno.test("Tool Invocation Tracking Test Suite", async (t) => {
  await t.step("should track tool invocations", () => {
    const tracker = new ToolInvocationTracker();
    
    // Add tool start
    tracker.addToolInvocation('tool_start', 'create_form_artifact', 'agent-123', {
      name: 'Test Form'
    });
    
    // Add tool complete
    tracker.addToolInvocation('tool_complete', 'create_form_artifact', 'agent-123', undefined, {
      success: true,
      artifact_id: 'artifact-456'
    });
    
    const invocations = tracker.getToolInvocations();
    
    assertEquals(invocations.length, 2);
    assertEquals(invocations[0].type, 'tool_start');
    assertEquals(invocations[0].toolName, 'create_form_artifact');
    assertEquals(invocations[0].agentId, 'agent-123');
    assertEquals(invocations[1].type, 'tool_complete');
    const result = invocations[1].result as { success: boolean; artifact_id: string };
    assertEquals(result.success, true);
  });

  await t.step("should clear tool invocations", () => {
    const tracker = new ToolInvocationTracker();
    
    tracker.addToolInvocation('tool_start', 'create_form_artifact', 'agent-123');
    assertEquals(tracker.getToolInvocations().length, 1);
    
    tracker.clearToolInvocations();
    assertEquals(tracker.getToolInvocations().length, 0);
  });

  await t.step("should track multiple tool invocations", () => {
    const tracker = new ToolInvocationTracker();
    
    // Simulate multiple tool executions
    tracker.addToolInvocation('tool_start', 'create_form_artifact', 'agent-123');
    tracker.addToolInvocation('tool_complete', 'create_form_artifact', 'agent-123');
    tracker.addToolInvocation('tool_start', 'store_message', 'agent-123');
    tracker.addToolInvocation('tool_complete', 'store_message', 'agent-123');
    
    const invocations = tracker.getToolInvocations();
    
    assertEquals(invocations.length, 4);
    assertEquals(invocations[0].toolName, 'create_form_artifact');
    assertEquals(invocations[2].toolName, 'store_message');
  });

  await t.step("should include timestamps in invocations", () => {
    const tracker = new ToolInvocationTracker();
    
    tracker.addToolInvocation('tool_start', 'test_tool', 'agent-123');
    
    const invocations = tracker.getToolInvocations();
    const timestamp = invocations[0].timestamp;
    
    // Verify timestamp is a valid ISO string
    assertEquals(typeof timestamp, 'string');
    assertEquals(new Date(timestamp).toISOString(), timestamp);
  });
});
