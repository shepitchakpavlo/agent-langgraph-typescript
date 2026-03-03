import { StateGraph, END, START, MemorySaver } from "@langchain/langgraph";
import { ToolNode, toolsCondition } from "@langchain/langgraph/prebuilt";
import { AgentStateAnnotation, NODES, AGENTS } from "./state";
import { researchAgent, analystAgent, supervisor, writerAgent } from "./nodes";
import { webSearch } from "./tools/webSearch";
import { queryMemoryTool } from "./tools/queryMemory";
import { saveMemoryTool } from "./tools/saveMemory";

// Initialize the tool node with our search and memory tools
const toolNode = new ToolNode([webSearch, queryMemoryTool, saveMemoryTool]);

// Define the workflow using the state annotation
export const workflow = new StateGraph(AgentStateAnnotation)
  // Add nodes using central constants
  .addNode(NODES.SUPERVISOR, supervisor)
  .addNode(NODES.RESEARCHER, researchAgent)
  .addNode(NODES.TOOLS, toolNode)
  .addNode(NODES.ANALYST, analystAgent)
  .addNode(NODES.WRITER, writerAgent)

  // Set entry point to the supervisor
  .addEdge(START, NODES.SUPERVISOR)

  // Supervisor decides what to do next
  .addConditionalEdges(
    NODES.SUPERVISOR,
    (state) => state.nextAgent,
    {
      [NODES.RESEARCHER]: NODES.RESEARCHER,
      [NODES.ANALYST]: NODES.ANALYST,
      [NODES.WRITER]: NODES.WRITER,
      FINISH: END,
    }
  )

  // Add conditional edges from researchAgent to tools or back to supervisor
  .addConditionalEdges(
    NODES.RESEARCHER,
    toolsCondition,
    {
      [NODES.TOOLS]: NODES.TOOLS,
      [END]: NODES.SUPERVISOR // Returns to supervisor if no tools are called
    }
  )

  // After tools execute, route back to researchAgent
  .addEdge(NODES.TOOLS, NODES.RESEARCHER)

  // After analystAgent, route back to supervisor to decide if complete
  .addEdge(NODES.ANALYST, NODES.SUPERVISOR)

  // After writerAgent, route back to supervisor
  .addEdge(NODES.WRITER, NODES.SUPERVISOR);

// Compile the graph
export const app = workflow.compile({
  checkpointer: new MemorySaver(),
});
