import "dotenv/config";
import { app } from "./graph";

// Run the application
async function main() {
  console.log("🔍 Starting LangGraph Research Agent\n");
  console.log("=".repeat(50));

  const initialState = {
    messages: [] as never[],
    userInput: "the latest developments in quantum computing",
    searchQueries: [] as string[],
    searchResults: [] as string[],
    summary: "",
  };

  console.log(`\n📝 Research Topic: "${initialState.userInput}"\n`);

  try {
    const result = await app.invoke(initialState);

    console.log("🔎 Search Queries Generated:");
    result.searchQueries.forEach((query, i) => {
      console.log(`   ${i + 1}. ${query}`);
    });
    console.log();

    console.log("📚 Search Results:");
    console.log("-".repeat(40));
    result.searchResults.forEach((res) => {
      console.log(res);
      console.log("-".repeat(40));
    });
    console.log();

    console.log("📋 Research Summary:");
    console.log(`   ${result.summary}\n`);

    console.log("=".repeat(50));
    console.log("✅ Research completed successfully!");
  } catch (error) {
    console.error("❌ Error during execution:", error);
  }
}

main().catch(console.error);
