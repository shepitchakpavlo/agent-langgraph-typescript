import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { AgentState } from "../state";
import { llm } from "../llm";
import { ResearchSummarySchema } from "../schemas/researchSummary";
import { retry } from "../lib/retry";
import { z } from "zod";

// Summarization Agent: Synthesizes all research results into a structured summary
async function invokeWithRetry<T>(
  llm: any,
  messages: any[],
  schema: z.ZodType<T>,
  name: string = "structuredOutput"
): Promise<T> {
  return retry(
    async () => {
      const structuredLlm = llm.withStructuredOutput(schema, { name, strict: false });
      const result = await structuredLlm.invoke(messages);
      
      // Validate the result structure
      if (!result || typeof result !== 'object') {
        throw new Error(`Invalid structure returned from ${name}`);
      }
      
      return result;
    },
    {
      maxAttempts: 2,
      initialDelay: 500,
      backoffMultiplier: 2,
      onRetry: (attempt, error, delay) => {
        console.log(`[analystAgent] ${name} validation retry ${attempt}/2 after ${Math.round(delay)}ms due to:`, error.message || error);
      },
    }
  );
}

export async function analystAgent(state: AgentState): Promise<Partial<AgentState>> {
  // The state contains all researchData gathered by the Researcher
  const researchContext = state.researchData.join("\n\n---\n\n");

  const response = await invokeWithRetry(
    llm,
    [
      new SystemMessage(
        "You are a research summarizer. Based on the search results gathered, create a comprehensive, well-organized summary. " +
          "Synthesize all key findings into the structured format provided.",
      ),
      ...state.messages,
      new HumanMessage(`Synthesize the following research data:\n\n${researchContext}`),
    ],
    ResearchSummarySchema,
    "researchSummary"
  );

  return {
    synthesis: response,
    messages: [new AIMessage("Analysis complete. I have synthesized the research data into a structured summary.")],
  };
}
