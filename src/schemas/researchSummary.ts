import { z } from "zod";

export const ResearchSummarySchema = z.object({
  title: z.string().describe("A professional title for the research summary."),
  mainInsights: z
    .array(z.string())
    .describe("Key findings or insights gathered from the research."),
  conclusions: z.string().describe("Final synthesis and concluding remarks."),
});

export type ResearchSummary = z.infer<typeof ResearchSummarySchema>;
