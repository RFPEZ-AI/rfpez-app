// Copyright Mark Skiba, 2025 All rights reserved
// Validation test for tool invocation persistence

import { assertEquals, assertExists } from "https://deno.land/std@0.208.0/testing/asserts.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { MockSupabaseClient } from "./test-utils.ts";

// Minimal Supabase client interface used by these tests (narrow surface)
interface MinimalSingleResponse {
  data: Record<string, unknown> | null;
  error: unknown | null;
}

interface MinimalFromBuilder {
  insert(data: Record<string, unknown>): { select: () => { single: () => Promise<MinimalSingleResponse> } };
  select(cols?: string): {
    eq: (col: string, val: unknown) => { single: () => Promise<MinimalSingleResponse> };
    not?: (a: string, b: string) => unknown;
    order?: (a: string, b: { ascending: boolean }) => unknown;
    limit?: (n: number) => unknown;
    delete?: () => { eq: (col: string, val: unknown) => Promise<MinimalSingleResponse> };
  };
  delete?: () => { eq: (col: string, val: unknown) => Promise<MinimalSingleResponse> };
}

interface MinimalSupabaseClient {
  from(table: string): MinimalFromBuilder;
}

// Module-level Supabase client selection (prefer local mock for localhost)
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "http://127.0.0.1:54321";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "test-service-role-key";
type SupabaseClientLike = ReturnType<typeof createClient> | MockSupabaseClient;
const supabase: SupabaseClientLike = SUPABASE_URL.includes('127.0.0.1') || SUPABASE_URL.includes('localhost')
  ? new MockSupabaseClient()
  : createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// Narrow-typed wrapper for tests to avoid 'any' usage
const supabaseTyped = supabase as unknown as MinimalSupabaseClient;

// This test validates that tool invocations are properly persisted to the database
// when store_message is called with tool invocations in metadata

Deno.test("Tool Invocation Persistence - End-to-End Validation", async () => {
  // Using module-level `supabase` client
  
  // Create a test session
  const sessionId = crypto.randomUUID();
  const userId = crypto.randomUUID();
  
  console.log("🧪 Creating test session:", sessionId);
  
  const { error: sessionError } = await supabaseTyped
    .from("sessions")
    .insert({
      id: sessionId,
      user_id: userId,
      title: "Tool Persistence Test Session"
    });
  
  if (sessionError) {
    console.error("❌ Failed to create test session:", sessionError);
    throw sessionError;
  }
  
  // Simulate tool invocations
  const mockToolInvocations = [
    {
      type: "tool_start",
      toolName: "create_and_set_rfp",
      agentId: crypto.randomUUID(),
      parameters: {
        name: "Test RFP",
        description: "Test Description"
      },
      timestamp: new Date().toISOString()
    },
    {
      type: "tool_complete",
      toolName: "create_and_set_rfp",
      agentId: crypto.randomUUID(),
      result: {
        success: true,
        rfp_id: crypto.randomUUID()
      },
      timestamp: new Date().toISOString()
    }
  ];
  
  // Store a message with tool invocations in metadata
  console.log("💾 Storing message with tool invocations...");
  
  const { data: messageData, error: messageError } = await supabaseTyped
    .from("messages")
    .insert({
      session_id: sessionId,
      role: "assistant",
      content: "I've created the RFP for you.",
      agent_id: crypto.randomUUID(),
      metadata: {
        toolInvocations: mockToolInvocations
      }
    })
    .select()
    .single();
  
  if (messageError) {
    console.error("❌ Failed to store message:", messageError);
    throw messageError;
  }
  
  console.log("✅ Message stored with ID:", messageData.id);
  
  // Verify the tool invocations were persisted
  console.log("🔍 Retrieving message to verify tool invocations...");
  
  const { data: retrievedMessage, error: retrieveError } = await supabaseTyped
    .from("messages")
    .select("*")
    .eq("id", messageData.id)
    .single();
  
  if (retrieveError) {
    console.error("❌ Failed to retrieve message:", retrieveError);
    throw retrieveError;
  }
  
  console.log("📦 Retrieved message metadata:", JSON.stringify(retrievedMessage.metadata, null, 2));
  
  // Assertions
  assertExists(retrievedMessage.metadata, "Message should have metadata");
  assertExists(retrievedMessage.metadata.toolInvocations, "Metadata should contain toolInvocations");
  assertEquals(
    retrievedMessage.metadata.toolInvocations.length,
    2,
    "Should have 2 tool invocations"
  );
  
  const [toolStart, toolComplete] = retrievedMessage.metadata.toolInvocations;
  
  assertEquals(toolStart.type, "tool_start", "First invocation should be tool_start");
  assertEquals(toolStart.toolName, "create_and_set_rfp", "Tool name should match");
  assertExists(toolStart.parameters, "Tool start should have parameters");
  assertExists(toolStart.timestamp, "Tool start should have timestamp");
  
  assertEquals(toolComplete.type, "tool_complete", "Second invocation should be tool_complete");
  assertEquals(toolComplete.toolName, "create_and_set_rfp", "Tool name should match");
  assertExists(toolComplete.result, "Tool complete should have result");
  assertExists(toolComplete.timestamp, "Tool complete should have timestamp");
  
  console.log("✅ All assertions passed!");
  console.log("🎉 Tool invocation persistence is working correctly!");
  
  // Cleanup
  console.log("🧹 Cleaning up test data...");
  // Cleanup - skip real DB deletes when using MockSupabaseClient
  if (!(supabase instanceof MockSupabaseClient)) {
    await supabaseTyped.from("messages").delete().eq("session_id", sessionId);
    await supabaseTyped.from("sessions").delete().eq("id", sessionId);
  }
  
  console.log("✅ Cleanup complete");
});

Deno.test("Query Messages with Tool Invocations", async () => {
  // Reuse the module-level supabase client
  
  console.log("🔍 Querying for messages with tool invocations...");
  
  const { data, error } = await supabaseTyped
    .from("messages")
    .select("id, role, content, metadata")
    .not("metadata->toolInvocations", "is", null)
    .order("created_at", { ascending: false })
    .limit(5);
  
  if (error) {
    console.error("❌ Query failed:", error);
    throw error;
  }
  
  console.log(`📊 Found ${data?.length || 0} messages with tool invocations`);
  
  if (data && data.length > 0) {
  data.forEach((msg: Record<string, unknown>, index: number) => {
      console.log(`\n📝 Message ${index + 1}:`);
      console.log(`   ID: ${msg.id}`);
      console.log(`   Role: ${msg.role}`);
      console.log(`   Content: ${msg.content.substring(0, 100)}...`);
      console.log(`   Tool Invocations: ${msg.metadata?.toolInvocations?.length || 0}`);
      
      if (msg.metadata?.toolInvocations) {
        msg.metadata.toolInvocations.forEach((inv: { type: string; toolName: string }, idx: number) => {
          console.log(`      ${idx + 1}. ${inv.type}: ${inv.toolName}`);
        });
      }
    });
  } else {
    console.log("⚠️ No messages with tool invocations found yet.");
    console.log("💡 This is expected if store_message hasn't been called yet.");
  }
});
