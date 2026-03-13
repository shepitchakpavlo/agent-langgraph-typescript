/**
 * Central configuration for the application
 * 
 * All models, API keys, and default values are configured here.
 * Change these values once to update the entire application.
 */

import 'dotenv/config';

// Model configuration
export const MODEL_CONFIG = {
  // Default model for the production agent (needs structured output support)
  // DeepSeek via OpenRouter - supports .withStructuredOutput()
  DEFAULT_MODEL: 'deepseek/deepseek-chat-v3-0324',
  
  // Alternative model for comparisons (e.g., model_comparison experiments)
  COMPARISON_MODEL: 'openai/gpt-4o-mini',
  
  // Model for RAGAS evaluation from OpenCode Go (cost-effective: 20K req/5hrs)
  // MiniMax M2.5 returns JSON in content field (works with RAGAS)
  EVALUATION_MODEL: 'minimax-m2.5',
  
  // Default metrics for RAGAS evaluation
  DEFAULT_METRICS: ['faithfulness', 'answer_relevancy', 'context_precision', 'context_recall'] as const,
  
  // Default temperature for agent
  DEFAULT_TEMPERATURE: 0,
} as const;

// API configuration - separate providers for different purposes
function getAgentApiKey(): string {
  // DeepSeek via OpenRouter for agents (structured output support)
  return process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || '';
}

function getAgentApiBaseUrl(): string {
  return process.env.OPENROUTER_API_BASE || 'https://openrouter.ai/api/v1';
}

function getEvaluationApiKey(): string {
  // MiniMax M2.5 via OpenCode Go for evaluation (most cost-effective)
  return process.env.OPENCODE_GO_API_KEY || process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || '';
}

function getEvaluationApiBaseUrl(): string {
  return process.env.OPENCODE_GO_API_BASE || 'https://opencode.ai/zen/go/v1';
}

// Unified API config for general use (prefers OpenRouter for DeepSeek)
function getApiKey(): string {
  return (
    process.env.OPENROUTER_API_KEY ||
    process.env.OPENCODE_GO_API_KEY ||
    process.env.OPENAI_API_KEY ||
    ''
  );
}

function getApiBaseUrl(): string {
  return (
    process.env.OPENROUTER_API_BASE ||
    process.env.OPENCODE_GO_API_BASE ||
    'https://openrouter.ai/api/v1'
  );
}

export const API_CONFIG = {
  apiKey: getApiKey(),
  baseUrl: getApiBaseUrl(),
  // Specific configs for different use cases
  agent: {
    apiKey: getAgentApiKey(),
    baseUrl: getAgentApiBaseUrl(),
  },
  evaluation: {
    apiKey: getEvaluationApiKey(),
    baseUrl: getEvaluationApiBaseUrl(),
  },
} as const;

// RAGAS evaluation configuration
export const RAGAS_CONFIG = {
  model: MODEL_CONFIG.EVALUATION_MODEL,  // MiniMax M2.5 via OpenCode Go
  apiKey: getEvaluationApiKey(),  // OpenCode Go API key
  baseUrl: getEvaluationApiBaseUrl(),  // OpenCode Go base URL
  defaultMetrics: MODEL_CONFIG.DEFAULT_METRICS,
  timeout: 60, // seconds
  concurrencyLimit: 5,  // Max parallel evaluations
  recursionLimit: 50,  // Graph recursion limit
  scoreThresholds: {
    good: 0.7,
    acceptable: 0.5,
  },
} as const;

// Experiment configuration defaults
export const EXPERIMENT_DEFAULTS = {
  model: MODEL_CONFIG.DEFAULT_MODEL,  // DeepSeek for agents (structured output)
  temperature: MODEL_CONFIG.DEFAULT_TEMPERATURE,
  maxIterations: 10,
  useMemory: true,
  useFactChecker: true,
} as const;