import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";

// Initialize the LLM with OpenRouter (uses google/gemini-2.0-flash-lite-001 - cheap model)
export const llm = new ChatOpenAI({
  model: "google/gemini-2.0-flash-lite-001",
  temperature: 0,
  configuration: {
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
  },
});
