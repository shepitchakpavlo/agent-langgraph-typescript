import { SystemMessage } from "@langchain/core/messages";
import { z } from "zod";
import { llm } from "../llm";
import { AgentState, ROUTING_OPTIONS } from "../state";

/**
 * Supervisor: Routes the workflow based on explicit state data.
 * Enhanced to pass the LLM all the information it needs to distinguish
 * between failed fact-checks (contradictions vs. missing data)
 * and incorporates attempt counters for loop prevention.
 */
export async function supervisor(state: AgentState): Promise<Partial<AgentState>> {
  // Check attempt limits first - hard stop if exceeded
  if (state.writerAttempts >= state.maxAttempts && state.verificationStatus === "failed") {
    console.log(
      `[SUPERVISOR] Writer hit max attempts (${state.writerAttempts}/${state.maxAttempts}). Forcing completion.`
    );
    return {
      nextAgent: "FINISH",
      messages: [
        ...state.messages,
      ],
    };
  }

  if (state.researcherAttempts >= state.maxAttempts && state.verificationStatus === "failed") {
    console.log(
      `[SUPERVISOR] Researcher hit max attempts (${state.researcherAttempts}/${state.maxAttempts}). Moving to writer.`
    );
    return {
      nextAgent: "writerAgent",
    };
  }

  const routingSchema = z.object({
    nextAgent: z.enum(ROUTING_OPTIONS).describe("The next agent to act, or FINISH to exit."),
    reasoning: z.string().describe("Brief explanation of why this agent was chosen."),
  });

  const structuredLlm = llm.withStructuredOutput(routingSchema);

  // Build detailed state summary with explicit fact-check breakdown
  let factCheckBreakdown = "";
  if (state.factCheckReport && state.verificationStatus === "failed") {
    const failedClaims = state.factCheckReport.failedClaims?.filter(c => c.status === "failed") || [];
    const unverifiableClaims = state.factCheckReport.failedClaims?.filter(c => c.status === "unverifiable") || [];
    
    factCheckBreakdown = `\n- CONTRADICTIONS (claims that conflict with research): ${failedClaims.length}`;
    if (failedClaims.length > 0) {
      factCheckBreakdown += `\n  Examples: ${failedClaims.slice(0, 2).map(c => `"${c.claim}"`).join(", ")}`;
    }
    
    factCheckBreakdown += `\n- UNVERIFIABLE (claims lacking supporting data): ${unverifiableClaims.length}`;
    if (unverifiableClaims.length > 0) {
      factCheckBreakdown += `\n  Examples: ${unverifiableClaims.slice(0, 2).map(c => `"${c.claim}"`).join(", ")}`;
    }
  }

  const stateSummary = `
CURRENT STATE:
- Research data gathered: ${state.researchData.length > 0 ? `Yes (${state.researchData.length} items)` : "No"}
- Analysis synthesized: ${state.synthesis ? "Yes" : "No"}
- Report written: ${state.finalReport ? "Yes" : "No"}
- Verification status: ${state.verificationStatus}
- Writer attempts: ${state.writerAttempts}/${state.maxAttempts}
- Researcher attempts: ${state.researcherAttempts}/${state.maxAttempts}${factCheckBreakdown}
`;

  const response = await structuredLlm.invoke([
    new SystemMessage(
      "You are a supervisor. Based on the CURRENT STATE, decide the next step.\n\n" +
      "**ROUTING RULES (based on state):**\n" +
      "- No research data → researchAgent\n" +
      "- Has research, no analysis → analystAgent\n" +
      "- Has analysis, no report → writerAgent\n" +
      "- Has report, not verified → factCheckerAgent\n" +
      "- Verification FAILED with CONTRADICTIONS (writer error) → writerAgent (fix the claims)\n" +
      "- Verification FAILED with UNVERIFIABLE (missing data) → researchAgent (gather more info)\n" +
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
