import 'dotenv/config';
import { app } from './graph';
import { RagasAdapter, RagasSample } from './ragas/adapter';
import { testDataset } from './ragas/test-dataset';
import { HumanMessage } from '@langchain/core/messages';
import { RAGAS_CONFIG } from './config';
import fs from 'fs/promises';
import path from 'path';

interface EvaluationResult {
  index: number;
  question: string;
  expectedAnswer: string;
  actualAnswer: string;
  retrievedContext: string[];
  ragasScores: Record<string, number>;
  latencyMs: number;
  error?: string;
}

async function processSample(
  sample: RagasSample,
  index: number,
  ragasAdapter: RagasAdapter
): Promise<EvaluationResult> {
  const logPrefix = `[${index + 1}/${testDataset.length}]`;
  console.log(`${logPrefix} Starting: "${sample.question?.substring(0, 50)}..."`);

  try {
    const startTime = Date.now();

    const result = await app.invoke(
      {
        messages: [new HumanMessage(sample.question || '')],
        userInput: sample.question,
      },
      {
        configurable: { thread_id: `eval-${Date.now()}-${index}` },
        recursionLimit: RAGAS_CONFIG.recursionLimit,
      }
    );

    const latencyMs = Date.now() - startTime;
    const actualAnswer = result.finalReport || 'No answer generated';
    const retrievedContext = result.researchData || [];

    console.log(`${logPrefix} ✅ Graph done (${(latencyMs / 1000).toFixed(1)}s, ${retrievedContext.length} chunks)`);

    const ragasSample: RagasSample = {
      question: sample.question,
      context: retrievedContext,
      answer: actualAnswer,
      reference: sample.reference,
    };

    const ragasResults = await ragasAdapter.evaluate([ragasSample]);

    const ragasScores: Record<string, number> = {};
    for (const [metric, scores] of Object.entries(ragasResults.metrics)) {
      ragasScores[metric] = scores.mean ?? 0;
    }

    const scoresStr = Object.entries(ragasScores)
      .map(([m, s]) => `${m.split('_')[0]}:${s.toFixed(2)}`)
      .join(' ');
    console.log(`${logPrefix} 📊 RAGAS: ${scoresStr}`);

    return {
      index,
      question: sample.question || '',
      expectedAnswer: sample.reference || '',
      actualAnswer,
      retrievedContext,
      ragasScores,
      latencyMs,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`${logPrefix} ❌ Error: ${errorMessage.substring(0, 100)}`);

    return {
      index,
      question: sample.question || '',
      expectedAnswer: sample.reference || '',
      actualAnswer: '',
      retrievedContext: [],
      ragasScores: {},
      latencyMs: 0,
      error: errorMessage,
    };
  }
}

async function runInParallel(
  samples: RagasSample[],
  ragasAdapter: RagasAdapter,
  concurrency: number
): Promise<EvaluationResult[]> {
  const results: EvaluationResult[] = [];
  const executing: Promise<EvaluationResult>[] = [];

  for (let i = 0; i < samples.length; i++) {
    const promise = processSample(samples[i], i, ragasAdapter).then((result) => {
      results.push(result);
      return result;
    });
    executing.push(promise);

    if (executing.length >= concurrency) {
      await Promise.race(executing);
      executing.splice(
        executing.findIndex((p) => p === promise),
        1
      );
    }
  }

  await Promise.all(executing);
  return results.sort((a, b) => a.index - b.index);
}

async function runEvaluation() {
  const metrics = RAGAS_CONFIG.defaultMetrics;
  const concurrency = RAGAS_CONFIG.concurrencyLimit;

  console.log('🔬 Starting Multi-Agent RAGAS Evaluation (Parallel)\n');
  console.log(`📊 Dataset size: ${testDataset.length} queries`);
  console.log(`📈 Metrics: ${metrics.join(', ')}`);
  console.log(`🔄 Concurrency: ${concurrency}\n`);

  const ragasAdapter = new RagasAdapter({ metrics: [...metrics] });

  const startTime = Date.now();
  const results = await runInParallel(testDataset, ragasAdapter, concurrency);
  const totalTime = Date.now() - startTime;

  const successCount = results.filter((r) => !r.error).length;
  const errorCount = results.filter((r) => r.error).length;

  console.log('\n' + '='.repeat(60));
  console.log('📊 EVALUATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Successful: ${successCount}/${testDataset.length}`);
  console.log(`❌ Errors: ${errorCount}/${testDataset.length}`);
  console.log(`⏱️  Total time: ${(totalTime / 1000).toFixed(1)}s`);

  if (successCount > 0) {
    const avgLatency = results.reduce((sum, r) => sum + r.latencyMs, 0) / successCount;
    console.log(`⏱️  Avg latency per query: ${(avgLatency / 1000).toFixed(2)}s`);

    console.log('\n📈 Average RAGAS Scores:');
    const metricAvgs: Record<string, { sum: number; count: number }> = {};

    for (const result of results) {
      for (const [metric, score] of Object.entries(result.ragasScores)) {
        if (!metricAvgs[metric]) metricAvgs[metric] = { sum: 0, count: 0 };
        metricAvgs[metric].sum += score;
        metricAvgs[metric].count++;
      }
    }

    for (const [metric, { sum, count }] of Object.entries(metricAvgs)) {
      const avg = sum / count;
      const status = avg > RAGAS_CONFIG.scoreThresholds.good ? '✅' : avg > RAGAS_CONFIG.scoreThresholds.acceptable ? '⚠️' : '❌';
      console.log(`   ${status} ${metric}: ${avg.toFixed(4)}`);
    }

    const overallScore =
      Object.values(metricAvgs).reduce((total, { sum, count }) => total + sum / count, 0) /
      Object.keys(metricAvgs).length;
    console.log(`\n🎯 Overall Score: ${overallScore.toFixed(4)}`);
  }

  const reportPath = path.join(process.cwd(), 'evaluation-report.json');
  await fs.writeFile(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n💾 Full report saved to: ${reportPath}`);

  return results;
}

runEvaluation().catch(console.error);
