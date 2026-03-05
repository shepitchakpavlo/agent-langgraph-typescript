import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { AgentState } from "../state";
import { llm } from "../llm";
import { webSearch } from "../tools/webSearch";
import { queryMemoryTool } from "../tools/queryMemory";
import { saveMemoryTool } from "../tools/saveMemory";

// Research Agent: Decides which tools to execute using WebSearch and Memory tools
export async function researchAgent(
  state: AgentState,
): Promise<Partial<AgentState>> {
  const userInput = state.userInput;

  // Bind the tools to the LLM
  const llmWithTools = llm.bindTools([webSearch, queryMemoryTool, saveMemoryTool]);

  // Check if we already have the initial human message in history
  const hasHumanMessage = state.messages.some(
    (msg: any) =>
      msg._getType?.() === "human" ||
      msg.type === "human" ||
      msg._getType === "human",
  );

  const inputMessages = hasHumanMessage
    ? []
    : [new HumanMessage(`Research this topic: ${userInput}`)];

  const response = await llmWithTools.invoke([
    new SystemMessage(
      "You are a research assistant with access to long-term memory and real-time web search. " +
        "Follow this strategy:\n" +
        "1. **Check Memory First**: Use 'query_memory' to see if you already have information on the topic.\n" +
        "2. **Search Web if Needed**: If memory is insufficient or outdated, use 'web_search' to gather more info.\n" +
        "3. **Synthesize**: Combine info from memory and web search.\n" +
        "4. **Save New Findings**: Use 'save_to_memory' ONLY for NEW, high-quality information gathered from 'web_search'.\n" +
        "**CRITICAL - DO NOT REDUNDANTLY SAVE**: Never use 'save_to_memory' for information that you just retrieved via 'query_memory'. " +
        "Only save information if it was NOT found in memory or if the memory info was significantly outdated and you got fresh info from the web.\n" +
        "Always perform at least one query (either memory or web) before concluding. " +
        "If you find sufficient info in memory, you don't have to use web search.",
    ),
    ...state.messages,
    ...inputMessages,
  ]);

  // Extract research data from tool calls if present in the messages after tools run
  // Note: Since this node returns messages, LangGraph will run toolsCondition and loop.
  // We'll capture the data in a separate reducer if needed, but for now we'll just return the response.
  // The actual population of researchData is better done in a post-tool node or by analyzing history.
  // However, the document says the Researcher "populates with search results".
  // Let's refine the logic to check if we have any ToolMessages in the state that aren't in researchData yet.
  
  // Extract unique research data from tool calls in history
  const researchSnippets = Array.from(
    new Set(
      state.messages
        .filter((msg: any) => msg.type === "tool" || msg._getType?.() === "tool")
        .map((msg: any) => msg.content.toString())
    )
  );

  return {
    messages: [...inputMessages, response],
    researchData: researchSnippets, // This will be merged via the concat reducer
    researcherAttempts: state.researcherAttempts + 1,
  };
}
