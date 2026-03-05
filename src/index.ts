import "dotenv/config";
import { Client } from "@langchain/langgraph-sdk";

// Run the application
async function main() {
  console.log("🔍 Starting LangGraph Research Agent (Remote CLI Mode)\n");
  console.log("=".repeat(50));

  const userInput = process.argv.slice(2).join(" ");

  // Connect to the local LangGraph Studio server
  const client = new Client({
    apiUrl: "http://localhost:2024",
  });

  if (userInput) {
    console.log(`\n📝 Research Topic: "${userInput}"`);
  } else {
    console.log("\n📝 No research topic provided. Using default from state.");
  }

  try {
    // Get the assistant ID for our 'agent' graph
    // Search all assistants and filter by graph_id (it's a top-level field, not in metadata)
    const assistants = await client.assistants.search({});
    const agentAssistant = assistants.find((a: any) => a.graph_id === "agent");

    if (!agentAssistant) {
      throw new Error("No assistant found for graph 'agent'. Is 'yarn dev' running?");
    }
    const assistantId = agentAssistant.assistant_id;

    // Create a new thread for this run
    const thread = await client.threads.create();
    console.log(`🆔 Thread ID: "${thread.thread_id}"\n`);

    // Stream the run to see progress
    console.log("🚀 Starting agent execution...\n");

    const streamResponse = client.runs.stream(
      thread.thread_id,
      assistantId,
      {
        input: {
          ...(userInput ? { userInput } : {}),
          messages: [],
        },
        streamMode: "updates",
      }
    );

    // Process the stream
    for await (const chunk of streamResponse) {
      if (chunk.event === "updates") {
        const data = chunk.data as any;
        // Print agent transitions
        if (data.nextAgent) {
          console.log(`📍 Routing to: ${data.nextAgent}`);
        }
        // Print tool calls
        if (data.tool_calls) {
          (data.tool_calls as any[]).forEach((tc: any) => {
            console.log(`🔧 Tool Call: ${tc.name}`);
          });
        }
      }
    }

    console.log("\n✅ Agent execution completed!\n");

    // Get the final state
    const state = await client.threads.getState(thread.thread_id);
    const result = state.values as any;

    console.log("📚 Tools Used:");
    console.log("-".repeat(40));

    // The result from the SDK is the state values
    const messages = result.messages || [];
    messages.forEach((msg: any) => {
      const isToolMessage = msg.type === "tool" || msg.tool_call_id !== undefined;
      const hasToolCalls = msg.tool_calls && msg.tool_calls.length > 0;

      if (isToolMessage) {
        const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
        console.log(`[Tool Response] ${content.slice(0, 150)}...`);
      } else if (hasToolCalls) {
        msg.tool_calls.forEach((tc: any) => {
          console.log(`[Tool Call] Name: ${tc.name}, Args: ${JSON.stringify(tc.args)}`);
        });
      }
    });
    console.log("-".repeat(40));
    console.log();

    console.log("📋 Research Summary (Structured):");
    if (result.synthesis) {
      console.log(`   TITLE: ${result.synthesis.title}`);
      console.log(`   INSIGHTS:`);
      result.synthesis.mainInsights.forEach((insight: string, i: number) => {
        console.log(`     ${i + 1}. ${insight}`);
      });
      console.log(`   CONCLUSIONS: ${result.synthesis.conclusions}\n`);
    } else {
      console.log("   [No synthesis generated]");
    }

    console.log("=".repeat(50));
    console.log("✅ Research completed and thread visible in Studio!");
  } catch (error) {
    console.error("❌ Error during execution:", error);
    console.log("\n💡 Make sure you have 'yarn dev' running in another terminal!");
  }
}

main().catch(console.error);
