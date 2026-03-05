import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";
import { InMemoryCache } from "@langchain/core/caches";

const llmCache = new InMemoryCache();

// Initialize the LLM with OpenRouter.
// Using deepseek/deepseek-chat-v3-0324 - open source, excellent tool calling, free tier available
export const llm = new ChatOpenAI({
  model: "deepseek/deepseek-chat-v3-0324",
  temperature: 0,
  cache: llmCache,
  configuration: {
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: process.env.OPENROUTER_API_BASE
  },
});
