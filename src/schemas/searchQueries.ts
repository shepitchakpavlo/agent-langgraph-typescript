import { z } from "zod";

export const SearchQueriesSchema = z.object({
  queries: z
    .array(z.string())
    .min(3)
    .max(5)
    .describe("Diverse and specific search queries to research a topic."),
});

export type SearchQueries = z.infer<typeof SearchQueriesSchema>;
