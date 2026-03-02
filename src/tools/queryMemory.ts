import { DynamicTool } from "@langchain/core/tools";
import { getVectorStore } from "../lib/memory";

/**
 * A tool that queries the long-term agent memory (LanceDB) to find previously researched information.
 */
export const queryMemoryTool = new DynamicTool({
  name: "query_memory",
  description: "Search the long-term memory for previously researched information, facts, and technical details. Use this before searching the web to see if we already have the answer.",
  func: async (query: string) => {
    try {
      const vectorStore = await getVectorStore();
      const results = await vectorStore.similaritySearch(query, 3);
      
      if (results.length === 0) {
        return "No relevant information found in long-term memory.";
      }

      return results
        .map((doc, i) => `[Result ${i + 1}]:\n${doc.pageContent}`)
        .join("\n\n---\n\n");
    } catch (error: any) {
      console.error("Error querying memory details:", {
        message: error.message,
        stack: error.stack,
        query
      });
      return `An error occurred while querying the long-term memory: ${error.message}`;
    }
  },
});
