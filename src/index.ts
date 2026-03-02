import "dotenv/config";
import { app } from "./graph";

// Run the application
async function main() {
  console.log("🔍 Starting LangGraph Research Agent (Modern Features)\n");
  console.log("=".repeat(50));

  const userInput = process.argv.slice(2).join(" ") || "the architecture of the Llama-3 model";

  const initialState = {
    userInput: userInput,
    messages: [],
    summary: undefined,
  };

  const config = {
    configurable: { thread_id: "research-123" },
  };

  console.log(`\n📝 Research Topic: "${initialState.userInput}"\n`);

  try {
    // Invoke the graph with the initial state and thread configuration
    const result = await app.invoke(initialState, config);

    // console.log("DEBUG: All Messages:", JSON.stringify(result.messages, null, 2));

    console.log("📚 Tools Used:");
    console.log("-".repeat(40));
    result.messages.forEach((msg: any) => {
      // Use _getType() or check for ToolMessage properties to avoid instanceof issues
      const isToolMessage = msg._getType?.() === "tool" || msg.tool_call_id !== undefined;
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
    console.log("✅ Research completed successfully!");
  } catch (error) {
    console.error("❌ Error during execution:", error);
  }
}

main().catch(console.error);
