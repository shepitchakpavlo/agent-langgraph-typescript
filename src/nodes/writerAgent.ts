import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { AgentState } from "../state";
import { llm } from "../llm";

/**
 * Writer Agent: Converts synthesized analysis and research into a polished Markdown report.
 * It focuses on answering the original question directly with clarity and accuracy.
 */
export async function writerAgent(state: AgentState): Promise<Partial<AgentState>> {
  const synthesisJson = JSON.stringify(state.synthesis, null, 2);
  const rawResearch = state.researchData.join("\n\n---\n\n");
  const originalQuestion = state.userInput || "this topic";
  
  const response = await llm.invoke([
    new SystemMessage(
      "You are a professional technical writer. Write a focused, accurate response that directly answers the question.\n" +
      "BALANCED APPROACH:\n" +
      "1. **DIRECTNESS**: Start with a clear, concise answer to the question (1-2 sentences)\n" +
      "2. **GROUNDING**: Support your answer with facts from the research - quote specific details\n" +
      "3. **RELEVANCE**: Only include information that directly addresses the question\n" +
      "4. **ACCURACY**: Never claim anything not explicitly stated in the research data\n" +
      "5. **ACKNOWLEDGE GAPS**: If research doesn't fully answer, say so clearly"
    ),
    ...state.messages,
    new HumanMessage(
      `Question: "${originalQuestion}"\n\n` +
      `SYNTHESIS (summary):\n${synthesisJson}\n\n` +
      `RAW RESEARCH (use specific facts):\n${rawResearch.substring(0, 12000)}\n\n` +
      `Write a response that is BOTH relevant to the question AND grounded in the research.`
    ),
  ]);

  const report = response.content.toString();

  return {
    finalReport: report,
    messages: [new AIMessage(`Report complete:\n\n${report}`)],
    writerAttempts: state.writerAttempts + 1,
  };
}
