import { DynamicTool } from "@langchain/core/tools";
import { getVectorStore } from "../lib/memory";
import { Document } from "@langchain/core/documents";

/**
 * A tool that saves important research findings to the long-term agent memory (LanceDB).
 */
export const saveMemoryTool = new DynamicTool({
  name: "save_to_memory",
  description: "Save high-quality research findings, facts, or technical summaries to the long-term memory for future use. Only save verified and useful information.",
  func: async (content: string) => {
    try {
      const vectorStore = await getVectorStore();
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
