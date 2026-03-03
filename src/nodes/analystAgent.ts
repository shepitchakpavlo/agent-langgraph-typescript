import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { AgentState } from "../state";
import { llm } from "../llm";
import { ResearchSummarySchema } from "../schemas/researchSummary";

// Summarization Agent: Synthesizes all research results into a structured summary
export async function analystAgent(state: AgentState): Promise<Partial<AgentState>> {
  // Use structured output for the summary
  const structuredLlm = llm.withStructuredOutput(ResearchSummarySchema);

  // The state contains all researchData gathered by the Researcher
  const researchContext = state.researchData.join("\n\n---\n\n");

  const response = await structuredLlm.invoke([
    new SystemMessage(
      "You are a research summarizer. Based on the search results gathered, create a comprehensive, well-organized summary. " +
        "Synthesize all key findings into the structured format provided.",
    ),
    ...state.messages,
    new HumanMessage(`Synthesize the following research data:\n\n${researchContext}`),
  ]);

  return {
    synthesis: response,
    messages: [new AIMessage("Analysis complete. I have synthesized the research data into a structured summary.")],
  };
}
