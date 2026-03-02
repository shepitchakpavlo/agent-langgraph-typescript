import { DynamicTool } from "@langchain/core/tools";
import { getVectorStore } from "../lib/memory";
import { Document } from "@langchain/core/documents";

/**
 * A tool that saves important research findings to the long-term agent memory (LanceDB).
 */
export const saveMemoryTool = new DynamicTool({
  name: "save_to_memory",
  description: "Save NEW high-quality research findings or technical summaries to the long-term memory. IMPORTANT: DO NOT use this tool for information that was already retrieved from memory via 'query_memory'. Use it only for new info gathered from web search.",
  func: async (content: string) => {
    try {
      const vectorStore = await getVectorStore();

      // Check for existing similar content to avoid redundancy
      const existing = await vectorStore.similaritySearchWithScore(content, 1);
      if (existing.length > 0) {
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

      await vectorStore.addDocuments([doc]);
      return "Successfully saved information to long-term memory.";
    } catch (error) {
      console.error("Error saving to memory:", error);
      return "An error occurred while saving to the long-term memory.";
    }
  },
});
