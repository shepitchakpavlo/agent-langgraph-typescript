import { DynamicTool } from "@langchain/core/tools";
import { getVectorStore } from "../lib/memory";
import { Document } from "@langchain/core/documents";
import { retry } from "../lib/retry";

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
        console.log(`[saveMemory] Vector store connection retry ${attempt}/2 after ${Math.round(delay)}ms`);
      },
    }
  );
  return vectorStore;
}

/**
 * Check for existing similar content with retry logic
 */
async function checkExistingWithRetry(vectorStore: any, content: string) {
  const results = await retry(
    () => vectorStore.similaritySearchWithScore(content, 1) as Promise<any[]>,
    {
      maxAttempts: 2,
      initialDelay: 1000,
      backoffMultiplier: 1.5,
    }
  );
  return results;
}

/**
 * Add documents with retry logic
 */
async function addDocumentsWithRetry(vectorStore: any, docs: Document[]) {
  await retry(
    () => vectorStore.addDocuments(docs),
    {
      maxAttempts: 2,
      initialDelay: 1000,
      backoffMultiplier: 1.5,
      onRetry: (attempt, error, delay) => {
        console.log(`[saveMemory] Document save retry ${attempt}/2 after ${Math.round(delay)}ms`);
      },
    }
  );
}

/**
 * A tool that saves important research findings to the long-term agent memory (LanceDB).
 */
export const saveMemoryTool = new DynamicTool({
  name: "save_to_memory",
  description: "Save NEW high-quality research findings or technical summaries to the long-term memory. IMPORTANT: DO NOT use this tool for information that was already retrieved from memory via 'query_memory'. Use it only for new info gathered from web search.",
  func: async (content: string) => {
    try {
      const vectorStore = await getVectorStoreWithRetry();

      // Check for existing similar content to avoid redundancy
      const existing = await checkExistingWithRetry(vectorStore, content);
      if (existing && existing.length > 0) {
        const [doc, score] = existing[0];
        // LanceDB distance: lower is more similar. 0.1 is very close.
        if (score !== null && score < 0.1) {
          return "This information is already present in long-term memory. Skipping redundant save.";
        }
      }

      const doc = new Document({
        pageContent: content,
        metadata: {
          timestamp: new Date().toISOString(),
          source: "research_agent",
        },
      });

      await addDocumentsWithRetry(vectorStore, [doc]);
      return "Successfully saved information to long-term memory.";
    } catch (error: any) {
      console.error("Error saving to memory:", error);
      return `An error occurred while saving to the long-term memory: ${error.message}`;
    }
  },
});
