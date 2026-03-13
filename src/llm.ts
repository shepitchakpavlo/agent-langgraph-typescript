import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";
import { InMemoryCache } from "@langchain/core/caches";
import { MODEL_CONFIG, API_CONFIG } from "./config";

const llmCache = new InMemoryCache();

// Initialize the LLM with configured provider
// Model: DeepSeek via OpenRouter for agents (supports structured output)
// Config: Change MODEL_CONFIG.DEFAULT_MODEL and API_CONFIG in config.ts
export const llm = new ChatOpenAI({
  model: MODEL_CONFIG.DEFAULT_MODEL,  // deepseek/deepseek-chat-v3-0324
  temperature: MODEL_CONFIG.DEFAULT_TEMPERATURE,
  cache: llmCache,
  configuration: {
    apiKey: API_CONFIG.agent.apiKey,  // OpenRouter for DeepSeek
    baseURL: API_CONFIG.agent.baseUrl,
  },
});
