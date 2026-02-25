import "dotenv/config";
import { app } from "./graph";

// Run the application
async function main() {
  console.log("🚀 Starting LangGraph Sequential Agents App\n");
  console.log("=".repeat(50));

  const initialState = {
    messages: [],
    userInput: "a brave knight fighting a dragon",
    agent1Output: "",
    agent2Output: "",
  };

  console.log(`\n📝 User Input: "${initialState.userInput}"\n`);

  try {
    const result = await app.invoke(initialState);

    console.log("🤖 Agent 1 (Story Writer) Output:");
    console.log(`   "${result.agent1Output}"\n`);

    console.log("🤖 Agent 2 (Summarizer) Output:");
    console.log(`   "${result.agent2Output}"\n`);

    console.log("=".repeat(50));
    console.log("✅ Execution completed successfully!");
  } catch (error) {
    console.error("❌ Error during execution:", error);
  }
}

main().catch(console.error);
