/**
 * Vitest test suite for RAGAS implementation
 */

import 'dotenv/config';
import { describe, it, expect } from 'vitest';
import { spawn } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';
import { RAGAS_CONFIG } from '../config';
import { RagasAdapter, evaluateRAGSample } from './adapter';
import { evaluateRAGTool } from '../tools/ragasEvaluation';

// These tests invoke real APIs and Python processes — allow extra time
const API_TIMEOUT = 120_000;

describe('RAGAS Implementation', () => {
  describe('Basic Evaluation', () => {
    it('evaluates a single RAG sample and returns structured results', async () => {
      const sample = {
        question: 'What is RAGAS?',
        context: [
          'RAGAS is a Python framework for evaluating RAG systems.',
          'It provides metrics like faithfulness, answer relevancy, and context precision.',
        ],
        answer:
          'RAGAS is a Python library that helps evaluate Retrieval-Augmented Generation systems with metrics.',
      };

      const results = await evaluateRAGSample(sample, {
        metrics: ['faithfulness', 'answer_relevancy'],
      });

      // Verify the top-level structure
      expect(results.metrics).toBeDefined();
      expect(results.per_sample).toBeDefined();
      expect(Array.isArray(results.per_sample)).toBe(true);

      // Verify the formatted output contains the expected header
      const adapter = new RagasAdapter();
      expect(adapter.formatResults(results)).toContain('RAGAS Evaluation Results');
    }, API_TIMEOUT);
  });

  describe('Multiple Samples', () => {
    it('evaluates multiple RAG samples and aggregates metrics', async () => {
      const samples = [
        {
          question: 'What is LangChain?',
          context: [
            'LangChain is a framework for developing applications powered by language models.',
            'It provides chains, agents, and tools for building complex AI applications.',
          ],
          answer:
            'LangChain is a popular framework for building applications with large language models.',
        },
        {
          question: 'What is LangGraph?',
          context: [
            'LangGraph is a library for building stateful, multi-actor applications with LLMs.',
            'It extends LangChain with graph-based workflows and cycles.',
          ],
          answer:
            'LangGraph is a framework for building stateful applications with LLMs using graph-based workflows.',
        },
      ];

      const adapter = new RagasAdapter();
      const results = await adapter.evaluate(samples);

      // All submitted samples should appear in per_sample
      expect(results.per_sample).toHaveLength(2);

      // Each metric should expose a numeric mean score
      for (const [, scores] of Object.entries(results.metrics)) {
        expect(scores.mean).toBeTypeOf('number');
      }
    }, API_TIMEOUT);
  });

  describe('LangChain Tool Interface', () => {
    it('invokes the evaluateRAGTool and returns a formatted string', async () => {
      const result = await evaluateRAGTool.invoke({
        question: 'What is TypeScript?',
        context: [
          'TypeScript is a typed superset of JavaScript that compiles to plain JavaScript.',
          'It was developed by Microsoft.',
        ],
        answer:
          'TypeScript is a programming language developed by Microsoft that is a typed superset of JavaScript.',
        metrics: ['faithfulness', 'answer_relevancy'],
      });

      expect(result).toContain('RAGAS Evaluation Results');
    }, API_TIMEOUT);
  });

  describe('Direct Python Script Call', () => {
    it('spawns the Python evaluation script and parses its JSON output', async () => {
      const mockData = {
        api_key: RAGAS_CONFIG.apiKey,
        model: RAGAS_CONFIG.model,
        baseURL: RAGAS_CONFIG.baseUrl,
        metrics: ['faithfulness'],
        samples: [
          {
            question: 'Test question',
            context: ['Test context'],
            answer: 'Test answer',
          },
        ],
      };

      // Prefer the project-local venv interpreter when available
      const venvPython = path.join(process.cwd(), '.venv/bin/python3');
      const pythonPath = existsSync(venvPython) ? venvPython : 'python3';

      const result = await new Promise<{ metrics: unknown; per_sample: unknown }>(
        (resolve, reject) => {
          const child = spawn(pythonPath, ['ragas/evaluate.py']);

          let stdout = '';
          let stderr = '';

          child.stdout.on('data', (data) => { stdout += data; });
          child.stderr.on('data', (data) => { stderr += data; });

          child.on('close', (code) => {
            if (code === 0) {
              try {
                resolve(JSON.parse(stdout));
              } catch {
                reject(new Error('Failed to parse JSON output from Python script'));
              }
            } else {
              reject(new Error(`Script failed with code ${code}: ${stderr}`));
            }
          });

          child.on('error', reject);

          child.stdin.write(JSON.stringify(mockData));
          child.stdin.end();
        },
      );

      expect(result.metrics).toBeDefined();
      expect(result.per_sample).toBeDefined();
    }, API_TIMEOUT);
  });
});
