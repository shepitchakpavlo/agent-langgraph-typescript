import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { AgentState } from "../state";
import { llm } from "../llm";
import { FactCheckReportSchema } from "../schemas/factCheckReport";

/**
 * Fact-Checker Agent: Verifies the final report against research data.
 * Returns ONLY failed/unverifiable claims for smaller LLM responses.
 */
export async function factCheckerAgent(state: AgentState): Promise<Partial<AgentState>> {
  if (!state.finalReport) {
    return {
      verificationStatus: "pending",
      messages: [new AIMessage("Waiting for a report to fact-check.")],
    };
  }

  const researchContext = state.researchData.join("\n\n---\n\n").substring(0, 20000);
  const reportToVerify = state.finalReport.substring(0, 8000);

  const structuredLlm = llm.withStructuredOutput(FactCheckReportSchema, {
    name: "fact_check_report",
    strict: false,
  });

  const report = await structuredLlm.invoke([
    new SystemMessage(
      "You are a fact-checker. Verify the FINAL REPORT against the RESEARCH DATA.\n\n" +
      "Rules:\n" +
      "- If a claim matches the research data → it's verified (DON'T include it)\n" +
      "- If a claim CONTRADICTS the research data → status='failed', provide correction\n" +
      "- If a claim has NO supporting data → status='unverifiable', describe what's missing\n\n" +
      "ONLY include claims that failed or are unverifiable. If all claims are verified, return verified=true with empty failedClaims array."
    ),
    new HumanMessage(
      `RESEARCH DATA:\n${researchContext}\n\n` +
      `FINAL REPORT:\n${reportToVerify}`
    ),
  ]);

  // Success case - all claims verified
  if (report.verified || report.failedClaims.length === 0) {
    return {
      verificationStatus: "verified",
      factCheckReport: report,
      messages: [new AIMessage("Fact-check PASSED: All claims verified.")],
    };
  }

  // Separate by failure type
  const failedClaims = report.failedClaims.filter(c => c.status === "failed");
  const unverifiableClaims = report.failedClaims.filter(c => c.status === "unverifiable");

  // Type 1: Writer misused existing data
  if (failedClaims.length > 0) {
    const failedList = failedClaims
      .map(c => `- **Claim**: "${c.claim}"\n  **Correction**: ${c.correction}`)
      .join("\n\n");

    return {
      verificationStatus: "failed",
      factCheckReport: report,
      messages: [
        new HumanMessage(
          `FACT-CHECK FAILED: ${failedClaims.length} claims contradict the research data.\n\n${failedList}`
        ),
      ],
    };
  }

  // Type 2: Research gaps - data is missing
  const unverifiableList = unverifiableClaims
    .map(c => `- "${c.claim}" (missing: ${c.correction})`)
    .join("\n");

  return {
    verificationStatus: "failed",
    factCheckReport: report,
    messages: [
      new HumanMessage(
        `FACT-CHECK FAILED: ${unverifiableClaims.length} claims cannot be verified - no data found.\n\n${unverifiableList}`
      ),
    ],
  };
}
