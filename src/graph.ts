import { StateGraph, END, START, MemorySaver } from "@langchain/langgraph";
import { ToolNode, toolsCondition } from "@langchain/langgraph/prebuilt";
import { AgentStateAnnotation } from "./state";
import { researchAgent, summarizationAgent } from "./nodes";
import { webSearch } from "./tools/webSearch";

// Initialize the tool node with our search tool
const toolNode = new ToolNode([webSearch]);

// Define the workflow using the state annotation
export const workflow = new StateGraph(AgentStateAnnotation)
  // Add nodes
  .addNode("researchAgent", researchAgent)
  .addNode("tools", toolNode)
  .addNode("summarizationAgent", summarizationAgent)

  // Set entry point
  .addEdge(START, "researchAgent")

  // Add conditional edges based on tool calls from researchAgent
  .addConditionalEdges(
    "researchAgent",
    toolsCondition,
    {
      tools: "tools",
      [END]: "summarizationAgent"
    }
  )

  // After tools execute, route back to researchAgent to see if more research is needed
  .addEdge("tools", "researchAgent")

  // SummarizationAgent completes the research
  .addEdge("summarizationAgent", END);

// Compile the graph with a MemorySaver checkpointer for persistence and human-in-the-loop
export const app = workflow.compile({
  checkpointer: new MemorySaver(),
});
