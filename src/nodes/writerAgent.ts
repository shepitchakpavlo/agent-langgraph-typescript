import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { AgentState } from "../state";
import { llm } from "../llm";

/**
 * Writer Agent: Converts synthesized analysis and research into a polished Markdown report.
 * It focuses on tone, structure, and clarity.
 */
export async function writerAgent(state: AgentState): Promise<Partial<AgentState>> {
  const synthesisJson = JSON.stringify(state.synthesis, null, 2);
  
  const response = await llm.invoke([
    new SystemMessage(
      "You are a professional technical writer. Your task is to take a research summary and " +
      "create a polished, well-structured Markdown report. " +
      "Focus on clarity, professional tone, and logical flow. " +
      "Use headings, bullet points, and bold text to make the report readable."
    ),
    ...state.messages,
    new HumanMessage(
      `Based on the following research synthesis, please write the final report:

${synthesisJson}`
    ),
  ]);

  return {
    finalReport: response.content.toString(),
  };
}
