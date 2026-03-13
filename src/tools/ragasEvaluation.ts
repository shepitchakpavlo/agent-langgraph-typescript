/**
 * RagasEvaluation Tool
 * 
 * A LangChain tool for evaluating RAG outputs using the RAGAS framework.
 * This tool can be used in LangGraph workflows to assess the quality of responses.
 */

import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { RagasAdapter, RagasConfig, RagasSample } from '../ragas/adapter';
import { RAGAS_CONFIG } from '../config';

/**
 * Schema for the ragas_evaluation tool
 */
const ragasMetricSchema = z.enum(['faithfulness', 'answer_relevancy', 'context_precision', 'context_recall']);

const ragasEvaluationSchema = z.object({
  question: z.string().describe('The question to evaluate'),
  context: z.array(z.string()).describe('The context passages retrieved'),
  answer: z.string().describe('The generated answer to evaluate'),
  metrics: z.array(ragasMetricSchema).optional().describe('Metrics to evaluate'),
  apiKey: z.string().optional().describe('API key for the LLM'),
  model: z.string().optional().describe('Model to use for evaluation'),
  reference: z.string().optional().describe('Reference answer for comparison'),
});

export type RagasEvaluationInput = z.infer<typeof ragasEvaluationSchema>;

/**
 * Creates a LangChain tool for RAGAS evaluation
 */
export const evaluateRAGTool = tool(
  async (input: RagasEvaluationInput) => {
    try {
      // Configure RAGAS (uses defaults from config.ts)
      const config: RagasConfig = {
        api_key: input.apiKey || RAGAS_CONFIG.apiKey,
        model: input.model || RAGAS_CONFIG.model,
        metrics: input.metrics || [...RAGAS_CONFIG.defaultMetrics],
      };

      // Create sample for evaluation
      const sample: RagasSample = {
        question: input.question,
        context: input.context,
        answer: input.answer,
        reference: input.reference,
      };

      // Run evaluation
      const adapter = new RagasAdapter(config);
      const results = await adapter.evaluate([sample]);

      // Format results
      let output = `RAGAS Evaluation Results:\n`;
      output += '========================\n\n';
      
      output += `Overall Metrics:\n`;
      for (const [metric, scores] of Object.entries(results.metrics)) {
        output += `  ${metric}: ${scores.mean !== null ? scores.mean.toFixed(4) : 'N/A'}\n`;
      }
      
      output += `\nPer-Sample Scores:\n`;
      if (results.per_sample.length > 0) {
        for (const [metric, score] of Object.entries(results.per_sample[0].scores)) {
          output += `  ${metric}: ${score !== null ? score.toFixed(4) : 'N/A'}\n`;
        }
      }

      // Add interpretation
      output += `\nInterpretation:\n`;
      output += `  Faithfulness: How faithful the answer is to the retrieved context (0-1 scale)\n`;
      output += `  Answer Relevancy: How relevant the answer is to the question (0-1 scale)\n`;
      output += `  Context Precision: How precise the retrieval was (0-1 scale)\n`;
      output += `  Context Recall: How complete the retrieval was (0-1 scale)\n`;
      
      output += `\nGeneral Guidelines:\n`;
      output += `  Scores > 0.9: Excellent\n`;
      output += `  Scores 0.7-0.9: Good\n`;
      output += `  Scores 0.5-0.7: Needs improvement\n`;
      output += `  Scores < 0.5: Poor\n`;

      return output;
    } catch (error) {
      return `Error during RAGAS evaluation: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
  {
    name: 'ragas_evaluation',
    description: 'Evaluate the quality of a RAG (Retrieval-Augmented Generation) response using RAGAS metrics. Provides faithfulness, relevancy, context precision, and context recall scores.',
    schema: ragasEvaluationSchema,
  }
);

/**
 * Creates a function that evaluates RAG outputs and returns structured results
 */
export async function evaluateRAGOutput(input: RagasEvaluationInput): Promise<{
  results: any;
  summary: string;
  lowScores?: string[];
}> {
  const config: RagasConfig = {
    api_key: input.apiKey || RAGAS_CONFIG.apiKey,
    model: input.model || RAGAS_CONFIG.model,
    metrics: input.metrics || [...RAGAS_CONFIG.defaultMetrics],
  };

  const sample: RagasSample = {
    question: input.question,
    context: input.context,
    answer: input.answer,
    reference: input.reference,
  };

  const adapter = new RagasAdapter(config);
  const results = await adapter.evaluate([sample]);

  // Identify low scores
  const lowScores: string[] = [];
  for (const [metric, scores] of Object.entries(results.metrics)) {
    if (scores.mean !== null && scores.mean < 0.7) {
      lowScores.push(metric);
    }
  }

  // Create summary
  const summary = lowScores.length > 0
    ? `Evaluation complete. Low scores detected in: ${lowScores.join(', ')}. Consider improving the ${
      lowScores.includes('faithfulness') ? 'answer alignment with context' : ''
    }${lowScores.includes('answer_relevancy') ? 'answer relevance' : ''
    }${lowScores.includes('context_precision') ? 'retrieval precision' : ''
    }${lowScores.includes('context_recall') ? 'retrieval coverage' : ''}.`
    : 'Evaluation complete. All metrics show acceptable performance.';

  return { results, summary, lowScores };
}