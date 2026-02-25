import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { AgentState } from "../state";
import { llm } from "../llm";

// Research Agent: Generates 5 search queries and executes WebSearch
export async function researchAgent(state: AgentState): Promise<Partial<AgentState>> {
  const userInput = state.userInput;

  // Step 1: Generate 5 diverse search queries using LLM
  const queryResponse = await llm.invoke([
    new SystemMessage(
      "You are a research assistant. Generate exactly 5 diverse, specific search queries to thoroughly research the given topic. " +
        "Return ONLY the queries, one per line, numbered 1-5. No explanations or additional text.",
    ),
    new HumanMessage(`Generate 5 search queries to research: ${userInput}`),
  ]);

  // Step 2: Parse queries from LLM response
  const queries = (queryResponse.content as string)
    .split("\n")
    .map((line) => line.replace(/^\d+\.\s*/, "").trim())
    .filter((line) => line.length > 0)
    .slice(0, 5);

  // Step 3: Execute WebSearch for each query (parallel)
  // Note: WebSearch is available via the tool system, but here we simulate
  // by using the LLM to generate mock research results for demonstration
  const searchResults: string[] = [];

  for (const query of queries) {
    try {
      const searchResponse = await llm.invoke([
        new SystemMessage(
          "You are a research assistant. Provide a brief factual summary (2-3 sentences) about the search query. " +
            "Include key facts, statistics, or relevant information.",
        ),
        new HumanMessage(`Search query: ${query}`),
      ]);
      searchResults.push(`Query: ${query}\nResult: ${searchResponse.content as string}`);
    } catch (error) {
      searchResults.push(`Query: ${query}\nResult: [Search failed]`);
    }
  }

  return {
    searchQueries: queries,
    searchResults,
    messages: [queryResponse],
  };
}
