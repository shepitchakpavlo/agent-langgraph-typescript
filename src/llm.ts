import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";

// Initialize the LLM with OpenRouter. 
// Using openai/gpt-4o-mini as it provides robust tool-calling support.
export const llm = new ChatOpenAI({
  model: "openai/gpt-4o-mini",
  temperature: 0,
  configuration: {
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
  },
});
