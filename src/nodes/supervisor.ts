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
      "Follow this process:\n" +
      "1. **Research**: If more information is needed, call 'researchAgent'.\n" +
      "2. **Analysis**: Once research is sufficient, call 'analystAgent' to synthesize findings.\n" +
      "3. **Writing**: Call 'writerAgent' to generate the final report draft based on the analysis.\n" +
      "4. **Fact-Checking**: AFTER the 'writerAgent' provides the 'finalReport', call 'factCheckerAgent' to verify it.\n" +
      "5. **Feedback Loop (CRITICAL)**: If the 'factCheckerAgent' reports errors (status 'failed'), " +
      "route back to 'researchAgent' or 'analystAgent' to fix the content based on the feedback.\n" +
      "6. **Finish**: ONLY once the 'factCheckerAgent' has marked the 'finalReport' as 'verified', select 'FINISH'.\n\n" +
      "Base your decision on the conversation history, the state of 'finalReport', and the 'verificationStatus'."
    ),
    ...state.messages,
  ]);

  return {
    nextAgent: response.nextAgent,
  };
}
