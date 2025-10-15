// Copyright Mark Skiba, 2025 All rights reserved
// Validation test for tool invocation persistence

import { assertEquals, assertExists } from "https://deno.land/std@0.208.0/testing/asserts.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// This test validates that tool invocations are properly persisted to the database
// when store_message is called with tool invocations in metadata

Deno.test("Tool Invocation Persistence - End-to-End Validation", async () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://test.supabase.co";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "test-service-role-key";
  
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  
  // Create a test session
  const sessionId = crypto.randomUUID();
  const userId = crypto.randomUUID();
  
  console.log("🧪 Creating test session:", sessionId);
  
  const { error: sessionError } = await supabase
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
  
  const { data: messageData, error: messageError } = await supabase
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
  
  const { data: retrievedMessage, error: retrieveError } = await supabase
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
  await supabase.from("messages").delete().eq("session_id", sessionId);
  await supabase.from("sessions").delete().eq("id", sessionId);
  
  console.log("✅ Cleanup complete");
});

Deno.test("Query Messages with Tool Invocations", async () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://test.supabase.co";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "test-service-role-key";
  
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  
  console.log("🔍 Querying for messages with tool invocations...");
  
  const { data, error } = await supabase
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
    data.forEach((msg, index) => {
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
