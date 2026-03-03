import { SystemMessage } from "@langchain/core/messages";
import { z } from "zod";
import { llm } from "../llm";
import { AgentState, ROUTING_OPTIONS } from "../state";

/**
 * Supervisor: The brain of the multi-agent system.
 * It decides whether to call a researcher, a summarizer, or finish.
 */
export async function supervisor(state: AgentState): Promise<Partial<AgentState>> {
  // Define the structured output schema for the supervisor's decision
  // We use the central ROUTING_OPTIONS constant to derive the enum
  const routingSchema = z.object({
    nextAgent: z.enum(ROUTING_OPTIONS).describe("The next agent to act, or FINISH to exit."),
  });

  const structuredLlm = llm.withStructuredOutput(routingSchema);

  const response = await structuredLlm.invoke([
    new SystemMessage(
      "You are a supervisor tasked with managing a research workflow. " +
      "Your job is to coordinate a sequence of experts to fulfill the user's request. " +
      "Follow this strict linear process:\n" +
      "1. **Research**: If the conversation doesn't contain sufficient research results yet, call 'researchAgent' to gather information.\n" +
      "2. **Analysis**: Once the researcher has finished gathering data, call 'analystAgent' to synthesize the findings.\n" +
      "3. **Writing**: Once the analyst has provided a synthesis, call 'writerAgent' to create the final Markdown report.\n" +
      "4. **Finish**: Once the writer has provided the final report, select 'FINISH'.\n\n" +
      "Always call the next expert in the sequence. Do not skip steps. Base your decision on the messages in the conversation history."
    ),
    ...state.messages,
  ]);

  return {
    nextAgent: response.nextAgent,
  };
}
