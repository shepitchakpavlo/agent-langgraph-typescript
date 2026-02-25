import { StateGraph, END, START } from "@langchain/langgraph";
import { AgentStateAnnotation } from "./state";
import { researchAgent, summarizationAgent } from "./nodes";

// Define the workflow using the state annotation
export const workflow = new StateGraph(AgentStateAnnotation)
  // Add nodes
  .addNode("researchAgent", researchAgent)
  .addNode("summarizationAgent", summarizationAgent)

  // Set entry point
  .addEdge(START, "researchAgent")

  // Add edges
  .addEdge("researchAgent", "summarizationAgent")
  .addEdge("summarizationAgent", END);

// Compile the graph
export const app = workflow.compile();
