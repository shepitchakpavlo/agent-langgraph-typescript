/**
 * RAGAS Adapter for TypeScript
 * 
 * This adapter provides a TypeScript interface to RAGAS evaluation by calling
 * the Python evaluation script and parsing the results.
 */

import { spawn } from 'child_process';
import { promisify } from 'util';
import { writeFile, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { RAGAS_CONFIG } from '../config';

const exec = promisify(require('child_process').exec);

/**
 * Supported RAGAS evaluation metrics
 */
export type RagasMetric = 'faithfulness' | 'answer_relevancy' | 'context_precision' | 'context_recall';

/**
 * Sample data for RAGAS evaluation
 */
export interface RagasSample {
  /** The user's question or input */
  question?: string;
  user_input?: string;
  
  /** Retrieved context chunks */
  context?: string[];
  retrieved_contexts?: string[];
  
  /** Generated answer/response */
  answer?: string;
  response?: string;
  
  /** Reference answer (optional) */
  reference?: string;
  ground_truth?: string;
}

/**
 * Individual metric score
 */
export interface RagasMetricScores {
  mean: number | null;
  std: number | null;
  min: number | null;
  max: number | null;
}

/**
 * Evaluation results for a single sample
 */
export interface RagasSampleResult {
  index: number;
  scores: Record<RagasMetric, number | null>;
}

/**
 * Complete evaluation results
 */
export interface RagasEvaluationResults {
  metrics: Record<RagasMetric, RagasMetricScores>;
  per_sample: RagasSampleResult[];
}

/**
 * Configuration options for RAGAS evaluation
 */
export interface RagasConfig {
  /** API key for LLM provider (defaults to OPENCODE_GO_API_KEY) */
  api_key?: string;
  
  /** Model to use for evaluation (default from config.ts) */
  model?: string;
  
  /** Base URL for LLM provider (default from config.ts) */
  baseURL?: string;
  
  /** Metrics to evaluate */
  metrics?: RagasMetric[];
  
  /** Timeout in seconds (default: 60) */
  timeout?: number;
  
  /** Path to Python interpreter (default: 'python3') */
  pythonPath?: string;
  
  /** Path to RAGAS evaluation script */
  scriptPath?: string;
}

/**
 * Class for evaluating RAG outputs using RAGAS
 */
export class RagasAdapter {
  private config: Omit<Required<RagasConfig>, 'scriptPath'> & { pythonPath: string };
  private scriptPath: string;

  constructor(config: RagasConfig = {}) {
// Detect venv Python path
    const projectRoot = path.resolve(__dirname, '../..');
    const venvPython = path.join(projectRoot, '.venv/bin/python3');
    const defaultPython = existsSync(venvPython) ? venvPython : 'python3';

    // Set default configuration from central config
    this.config = {
      api_key: config.api_key || RAGAS_CONFIG.apiKey,
      model: config.model || RAGAS_CONFIG.model,
      baseURL: config.baseURL || RAGAS_CONFIG.baseUrl,
      metrics: config.metrics || [...RAGAS_CONFIG.defaultMetrics],
      timeout: config.timeout || RAGAS_CONFIG.timeout,
      pythonPath: config.pythonPath || defaultPython,
    };

    // Calculate script path (relative to this file)
    const thisDir = path.dirname(path.resolve(__filename));
    this.scriptPath = config.scriptPath || path.join(thisDir, '../../ragas/evaluate.py');

    // Verify script exists
    if (!existsSync(this.scriptPath)) {
      throw new Error(
        `RAGAS evaluation script not found at: ${this.scriptPath}\n` +
        `Please ensure the script exists or provide custom scriptPath.`
      );
    }
  }

  /**
   * Evaluate a single RAG sample
   */
  async evaluateSample(sample: RagasSample): Promise<RagasEvaluationResults> {
    return this.evaluate([sample]);
  }

  /**
   * Evaluate multiple RAG samples
   */
  async evaluate(samples: RagasSample[]): Promise<RagasEvaluationResults> {
    // Prepare input data
    const inputData = {
      api_key: this.config.api_key,
      model: this.config.model,
      baseURL: this.config.baseURL,
      metrics: this.config.metrics,
      timeout: this.config.timeout,
      samples,
    };

    // Execute Python script
    const resultStr = await this.executePythonScript(inputData);

    // Parse and validate results
    try {
      const results = JSON.parse(resultStr);
      this.validateResults(results);
      return results as RagasEvaluationResults;
    } catch (error) {
      throw new Error(`Failed to parse RAGAS results: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Evaluate using a temporary JSON file
   */
  async evaluateWithFile(samples: RagasSample[], outputPath?: string): Promise<RagasEvaluationResults> {
    // Create temp file for input
    const tempDir = path.join(process.cwd(), '.tmp');
    if (!existsSync(tempDir)) {
      await exec(`mkdir -p ${tempDir}`);
    }

    const inputFile = path.join(tempDir, `ragas_input_${Date.now()}.json`);
    const outputFile = outputPath || path.join(tempDir, `ragas_output_${Date.now()}.json`);

    // Write input file
    const inputData = {
      api_key: this.config.api_key,
      model: this.config.model,
      baseURL: this.config.baseURL,
      metrics: this.config.metrics,
      timeout: this.config.timeout,
      samples,
    };
    await writeFile(inputFile, JSON.stringify(inputData, null, 2));

    try {
      // Execute Python script with file paths
      const cmd = [
        this.config.pythonPath,
        this.scriptPath,
        '--input-file', inputFile,
        '--output-file', outputFile,
      ].join(' ');

      await exec(cmd);

      // Read and parse results
      const resultStr = await readFile(outputFile, 'utf-8');
      const results = JSON.parse(resultStr);
      this.validateResults(results);

      return results as RagasEvaluationResults;
    } finally {
      // Cleanup input file (output file kept for inspection)
      await exec(`rm -f ${inputFile}`);
    }
  }

  /**
   * Execute the Python RAGAS evaluation script and return stdout
   */
  private async executePythonScript(inputData: any): Promise<string> {
    return new Promise((resolve, reject) => {
      const args = [this.scriptPath];
      const child = spawn(this.config.pythonPath, args);

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Python script failed with code ${code}\nStderr: ${stderr}`));
        } else {
          resolve(stdout);
        }
      });

      child.on('error', (error) => {
        reject(new Error(`Failed to spawn Python process: ${error.message}`));
      });

      // Send input data via stdin
      child.stdin.write(JSON.stringify(inputData));
      child.stdin.end();
    });
  }

  /**
   * Validate the structure of evaluation results
   */
  private validateResults(results: any): void {
    if (!results || typeof results !== 'object') {
      throw new Error('Invalid results: not an object');
    }

    if (!results.metrics || typeof results.metrics !== 'object') {
      throw new Error('Invalid results: missing metrics');
    }

    if (!results.per_sample || !Array.isArray(results.per_sample)) {
      throw new Error('Invalid results: missing per_sample array');
    }
  }

  /**
   * Format evaluation results as a readable string
   */
  formatResults(results: RagasEvaluationResults): string {
    let output = 'RAGAS Evaluation Results\n';
    output += '='.repeat(50) + '\n\n';

    output += 'Overall Metrics:\n';
    output += '-'.repeat(40) + '\n';
    for (const [metric, scores] of Object.entries(results.metrics)) {
      output += `${metric}:\n`;
      output += `  Mean: ${scores.mean !== null ? scores.mean.toFixed(4) : 'N/A'}\n`;
      output += `  Std:  ${scores.std !== null ? scores.std.toFixed(4) : 'N/A'}\n`;
      output += `  Min:  ${scores.min !== null ? scores.min.toFixed(4) : 'N/A'}\n`;
      output += `  Max:  ${scores.max !== null ? scores.max.toFixed(4) : 'N/A'}\n\n`;
    }

    output += '\nPer-Sample Results:\n';
    output += '-'.repeat(40) + '\n';
    for (const sampleResult of results.per_sample) {
      output += `Sample ${sampleResult.index}:\n`;
      for (const [metric, score] of Object.entries(sampleResult.scores)) {
        output += `  ${metric}: ${score !== null ? score.toFixed(4) : 'N/A'}\n`;
      }
      output += '\n';
    }

    return output;
  }
}

/**
 * Convenience function to evaluate RAG outputs
 */
export async function evaluateRAG(
  samples: RagasSample[],
  config?: RagasConfig
): Promise<RagasEvaluationResults> {
  const adapter = new RagasAdapter(config);
  return adapter.evaluate(samples);
}

/**
 * Convenience function to evaluate a single RAG output
 */
export async function evaluateRAGSample(
  sample: RagasSample,
  config?: RagasConfig
): Promise<RagasEvaluationResults> {
  const adapter = new RagasAdapter(config);
  return adapter.evaluate([sample]);
}