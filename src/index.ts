import "dotenv/config";
import { Client } from "@langchain/langgraph-sdk";

// Run the application
async function main() {
  console.log("🔍 Starting LangGraph Research Agent (Remote CLI Mode)\n");
  console.log("=".repeat(50));

  const userInput = process.argv.slice(2).join(" ") || "the architecture of the Llama-3 model";
  const threadId = `cli-run-${Date.now()}`;
  
  // Connect to the local LangGraph Studio server
  const client = new Client({
    apiUrl: "http://localhost:2024",
  });

  console.log(`\n📝 Research Topic: "${userInput}"`);
  console.log(`🆔 Thread ID: "${threadId}"\n`);

  try {
    // Get the assistant ID for our 'agent' graph
    const assistants = await client.assistants.search({
      metadata: { graph_id: "agent" },
    });
    
    if (assistants.length === 0) {
      throw new Error("No assistant found for graph 'agent'. Is 'yarn dev' running?");
    }
    const assistantId = assistants[0].assistant_id;

    // Invoke the graph remotely via the LangGraph API
    // This creates a thread that will be visible in the Studio UI
    const result = (await client.runs.wait(threadId, assistantId, {
      input: {
        userInput: userInput,
        messages: [],
        summary: undefined,
      },
    })) as any;

    console.log("📚 Tools Used:");
    console.log("-".repeat(40));
    
    // The result from the SDK is the state values
    const messages = result.messages || [];
    messages.forEach((msg: any) => {
      const isToolMessage = msg.type === "tool" || msg.tool_call_id !== undefined;
      const hasToolCalls = msg.tool_calls && msg.tool_calls.length > 0;

      if (isToolMessage) {
        console.log(`[Tool Response] Content: ${msg.content.slice(0, 150)}...`);
      } else if (hasToolCalls) {
        msg.tool_calls.forEach((tc: any) => {
          console.log(`[Tool Call] Name: ${tc.name}, Args: ${JSON.stringify(tc.args)}`);
        });
      }
    });
    console.log("-".repeat(40));
    console.log();

    console.log("📋 Research Summary (Structured):");
    if (result.summary) {
      console.log(`   TITLE: ${result.summary.title}`);
      console.log(`   INSIGHTS:`);
      result.summary.mainInsights.forEach((insight: string, i: number) => {
        console.log(`     ${i + 1}. ${insight}`);
      });
      console.log(`   CONCLUSIONS: ${result.summary.conclusions}\n`);
    } else {
      console.log("   [No summary generated]");
    }

    console.log("=".repeat(50));
    console.log("✅ Research completed and thread visible in Studio!");
  } catch (error) {
    console.error("❌ Error during execution:", error);
    console.log("\n💡 Make sure you have 'yarn dev' running in another terminal!");
  }
}

main().catch(console.error);
