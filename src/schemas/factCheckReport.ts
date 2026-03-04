import { z } from "zod";

// Individual claim verification result
const ClaimVerificationSchema = z.object({
  claim: z.string().describe("The claim or statement being verified."),
  status: z.enum(["verified", "failed", "unverifiable"]).describe("Verification status of the claim."),
  evidence: z.string().describe("Summary of evidence found for or against the claim."),
  correction: z
    .string()
    .nullable()
    .describe("If status is 'failed', provide the corrected information. Otherwise null."),
});

export const FactCheckReportSchema = z.object({
  overallStatus: z
    .enum(["verified", "failed", "pending"])
    .describe("Overall fact-check status: verified if all claims pass, failed if any fail, pending if still verifying."),
  claims: z
    .array(ClaimVerificationSchema)
    .describe("List of claims that were fact-checked with their verification details."),
  summary: z.string().describe("Human-readable summary of the fact-checking results."),
});

export type FactCheckReport = z.infer<typeof FactCheckReportSchema>;
export type ClaimVerification = z.infer<typeof ClaimVerificationSchema>;
