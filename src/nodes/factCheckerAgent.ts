import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { AgentState } from "../state";
import { llm } from "../llm";
import { FactCheckReportSchema } from "../schemas/factCheckReport";

/**
 * Fact-Checker Agent: Verifies the final report against research data.
 * Passive auditor role (no external tools).
 */
export async function factCheckerAgent(state: AgentState): Promise<Partial<AgentState>> {
  if (!state.finalReport) {
    return {
      verificationStatus: "pending",
      messages: [new AIMessage("Waiting for a report to fact-check.")],
    };
  }

  // Ensure researchContext isn't too large (cap it for safety)
  // Reduced limits for OpenRouter compatibility
  const researchContext = state.researchData.join("\n\n---\n\n").substring(0, 20000);
  const reportToVerify = state.finalReport.substring(0, 8000);

  // Using tool_calling explicitly as it's generally more robust for arrays
  const structuredLlm = llm.withStructuredOutput(FactCheckReportSchema, {
    name: "fact_check_report",
    strict: false,
  });

  try {
    const report = await structuredLlm.invoke([
      new SystemMessage(
        "You are a meticulous fact-checker. Your ONLY source of truth is the 'RESEARCH DATA' provided. " +
        "Verify the 'FINAL REPORT' claim by claim. " +
        "Identify key statistics, facts, and names. If something isn't in the research data, mark it as 'unverifiable'. " +
        "If something contradicts the research data, mark it as 'failed' and provide the correction."
      ),
      new HumanMessage(
        `RESEARCH DATA:\n${researchContext}\n\n` +
        `FINAL REPORT:\n${reportToVerify}`
      ),
    ]);

    return {
      verificationStatus: report.overallStatus,
      factCheckReport: report,
      messages: [
        new AIMessage(`Fact-check ${report.overallStatus.toUpperCase()}: ${report.summary}`),
      ],
    };
  } catch (error: any) {
    console.error("Fact-checker LLM call failed:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));

    // Re-throw to let LangGraph retry policy handle it
    throw error;
  }
}
