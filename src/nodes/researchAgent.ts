import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { AgentState } from "../state";
import { llm } from "../llm";
import { webSearch } from "../tools/webSearch";

// Research Agent: Decides which search queries to execute using the WebSearch tool
export async function researchAgent(state: AgentState): Promise<Partial<AgentState>> {
  const userInput = state.userInput;

  // Bind the webSearch tool to the LLM
  const llmWithTools = llm.bindTools([webSearch]);

  const response = await llmWithTools.invoke([
    new SystemMessage(
      "You are a research assistant. You MUST use the 'web_search' tool to research the given topic. " +
        "Perform at least 3 separate, specific searches to gather real-time factual information. " +
        "Only after you have the search results should you proceed. " +
        "Always start by calling the tool with at least one query.",
    ),
    ...state.messages,
    new HumanMessage(`Research this topic: ${userInput}`),
  ]);

  return {
    messages: [response],
  };
}
