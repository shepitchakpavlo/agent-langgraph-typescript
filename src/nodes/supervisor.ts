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
    next: z.enum(ROUTING_OPTIONS).describe("The next agent to act, or FINISH to exit."),
  });

  const structuredLlm = llm.withStructuredOutput(routingSchema);

  const response = await structuredLlm.invoke([
    new SystemMessage(
      "You are a supervisor tasked with managing a research workflow. " +
      "Your job is to decide which expert should act next based on the conversation history. " +
      "If you have enough information to provide a final summary, select 'FINISH'. " +
      "Otherwise, select the most appropriate expert to continue the task."
    ),
    ...state.messages,
  ]);

  return {
    next: response.next,
  };
}
