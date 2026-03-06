import { DynamicTool } from "@langchain/core/tools";
import { getVectorStore } from "../lib/memory";
import { retry } from "../lib/retry";

/**
 * Query vector store with retry logic for transient connection errors
 */
async function queryVectorStoreWithRetry(vectorStore: any, query: string) {
  const results = await retry(
    () => vectorStore.similaritySearch(query, 3) as Promise<any[]>,
    {
      maxAttempts: 2,
      initialDelay: 1000,
      backoffMultiplier: 2,
      onRetry: (attempt, error, delay) => {
        console.log(`[queryMemory] Retry attempt ${attempt}/2 after ${Math.round(delay)}ms due to:`, error.message || error);
      },
    }
  );
  return results;
}

/**
 * Get vector store with retry logic for connection errors
 */
async function getVectorStoreWithRetry() {
  const vectorStore = await retry(
    () => getVectorStore() as Promise<any>,
    {
      maxAttempts: 2,
      initialDelay: 1000,
      backoffMultiplier: 1.5,
      onRetry: (attempt, error, delay) => {
        console.log(`[queryMemory] Vector store connection retry ${attempt}/2 after ${Math.round(delay)}ms`);
      },
    }
  );
  return vectorStore;
}

/**
 * A tool that queries the long-term agent memory (LanceDB) to find previously researched information.
 */
export const queryMemoryTool = new DynamicTool({
  name: "query_memory",
  description: "Search the long-term memory for previously researched information, facts, and technical details. Use this before searching the web to see if we already have the answer.",
  func: async (query: string) => {
    try {
      const vectorStore = await getVectorStoreWithRetry();
      const results = await queryVectorStoreWithRetry(vectorStore, query);
      
      if (!results || results.length === 0) {
        return "No relevant information found in long-term memory.";
      }

      return results
        .map((doc: any, i: number) => `[Result ${i + 1}]:\n${doc.pageContent}`)
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
