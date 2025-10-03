#!/usr/bin/env -S deno run --allow-all
// Copyright Mark Skiba, 2025 All rights reserved
// Development runner with all permissions enabled

/**
 * Development utility script that runs with all permissions enabled
 * Usage: deno run dev-runner.ts [script-path]
 */

if (import.meta.main) {
  const scriptPath = Deno.args[0];
  
  if (!scriptPath) {
    console.log("Usage: deno run dev-runner.ts [script-path]");
    Deno.exit(1);
  }

  // Import and run the specified script
  try {
    await import(scriptPath);
  } catch (error) {
    console.error("Error running script:", error);
    Deno.exit(1);
  }
}