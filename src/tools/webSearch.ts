import { TavilySearch } from "@langchain/tavily";

/**
 * A search tool that uses the Tavily Search API to find factual information.
 */
export const webSearch = new TavilySearch({
  maxResults: 5,
  name: "web_search",
  description: "Search the web for a given query to find factual information and research details.",
});
