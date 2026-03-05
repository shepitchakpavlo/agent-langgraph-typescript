import { z } from "zod";

// Only includes claims that FAILED or are UNVERIFIABLE (not verified claims)
const FailedClaimSchema = z.object({
  claim: z.string().describe("The claim that failed verification."),
  status: z.enum(["failed", "unverifiable"]).describe(
    "failed = contradicts research data, unverifiable = no data found to verify"
  ),
  correction: z.string().describe(
    "For 'failed': the correct information. For 'unverifiable': what data is missing."
  ),
});

export const FactCheckReportSchema = z.object({
  verified: z
    .boolean()
    .describe("true if ALL claims are verified, false if any failed or unverifiable."),
  failedClaims: z
    .array(FailedClaimSchema)
    .describe("ONLY claims that failed or are unverifiable. Empty array if verified=true."),
});

export type FactCheckReport = z.infer<typeof FactCheckReportSchema>;
export type FailedClaim = z.infer<typeof FailedClaimSchema>;
