import { StateGraph, END, START } from "@langchain/langgraph";
import { AgentStateAnnotation } from "./state";
import { agent1, agent2 } from "./nodes";

// Define the workflow using the state annotation
export const workflow = new StateGraph(AgentStateAnnotation)
  // Add nodes
  .addNode("agent1", agent1)
  .addNode("agent2", agent2)

  // Set entry point
  .addEdge(START, "agent1")

  // Add edges
  .addEdge("agent1", "agent2")
  .addEdge("agent2", END);

// Compile the graph
export const app = workflow.compile();
