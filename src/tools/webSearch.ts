import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { llm } from "../llm";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

/**
 * A mock search tool that uses the LLM to generate simulated results.
 * In a real-world scenario, you would use a search API like Tavily, Serper, or Brave Search.
 */
export const webSearch = tool(
  async ({ query }) => {
    // Simulate a search by asking the LLM for factual info
    const response = await llm.invoke([
      new SystemMessage(
        "You are a research assistant. Provide a brief factual summary (2-3 sentences) about the search query. " +
          "Include key facts, statistics, or relevant information.",
      ),
      new HumanMessage(`Search query: ${query}`),
    ]);

    return `Query: ${query}
Result: ${response.content}`;
  },
  {
    name: "web_search",
    description: "Search the web for a given query to find factual information and research details.",
    schema: z.object({
      query: z.string().describe("The search query to perform."),
    }),
  }
);
