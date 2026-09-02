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
  
  // Model for RAGAS evaluation via OpenRouter (reliable OpenAI-compatible API)
  // Using openai/gpt-4o-mini for cost-effectiveness and reliability
  EVALUATION_MODEL: 'openai/gpt-4o-mini',
  
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
  // OpenRouter for evaluation (reliable OpenAI-compatible API)
  return process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || '';
}

function getEvaluationApiBaseUrl(): string {
  return process.env.OPENROUTER_API_BASE || 'https://openrouter.ai/api/v1';
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