import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { AgentState } from "../state";
import { llm } from "../llm";

// Summarization Agent: Synthesizes all search results into a comprehensive summary
export async function summarizationAgent(state: AgentState): Promise<Partial<AgentState>> {
  const allResults = state.searchResults.join("\n\n---\n\n");

  const response = await llm.invoke([
    new SystemMessage(
      "You are a research summarizer. Create a comprehensive, well-organized summary of the research findings. " +
        "Structure your summary with key insights, main points, and conclusions. " +
        "Be concise but thorough.",
    ),
    new HumanMessage(`Summarize the following research findings:\n\n${allResults}`),
  ]);

  return {
    summary: response.content as string,
    messages: [response],
  };
}
