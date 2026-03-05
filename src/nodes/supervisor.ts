import { SystemMessage } from "@langchain/core/messages";
import { z } from "zod";
import { llm } from "../llm";
import { AgentState, ROUTING_OPTIONS } from "../state";

/**
 * Supervisor: The brain of the multi-agent system.
 * Uses state fields to determine next step, not just messages.
 */
export async function supervisor(state: AgentState): Promise<Partial<AgentState>> {
  const routingSchema = z.object({
    nextAgent: z.enum(ROUTING_OPTIONS).describe("The next agent to act, or FINISH to exit."),
    reasoning: z.string().describe("Brief explanation of why this agent was chosen."),
  });

  const structuredLlm = llm.withStructuredOutput(routingSchema);

  // Build state summary for the LLM to understand current progress
  const stateSummary = `
CURRENT STATE:
- Research data gathered: ${state.researchData.length > 0 ? `Yes (${state.researchData.length} items)` : "No"}
- Analysis synthesized: ${state.synthesis ? "Yes" : "No"}
- Report written: ${state.finalReport ? "Yes" : "No"}
- Verification status: ${state.verificationStatus}
${state.factCheckReport ? `- Failed claims: ${state.factCheckReport.failedClaims?.length || 0}` : ""}
`;

  const response = await structuredLlm.invoke([
    new SystemMessage(
      "You are a supervisor. Based on the CURRENT STATE, decide the next step.\n\n" +
      "**ROUTING RULES (based on state):**\n" +
      "- No research data → researchAgent\n" +
      "- Has research, no analysis → analystAgent\n" +
      "- Has analysis, no report → writerAgent\n" +
      "- Has report, not verified → factCheckerAgent\n" +
      "- Verification FAILED (contradicts data) → writerAgent\n" +
      "- Verification FAILED (missing data) → researchAgent\n" +
      "- Verification PASSED → FINISH\n\n" +
      "Respond with JSON: { \"nextAgent\": \"agentName\", \"reasoning\": \"why this choice\" }\n" +
      "Valid agents: FINISH, researchAgent, analystAgent, writerAgent, factCheckerAgent"
    ),
    new SystemMessage(stateSummary),
    ...state.messages.slice(-4), // Only last 4 messages for context
  ]);

  console.log(`[SUPERVISOR] → ${response.nextAgent}: ${response.reasoning}`);

  return {
    nextAgent: response.nextAgent,
  };
}
