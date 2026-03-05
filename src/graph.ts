import { StateGraph, END, START, MemorySaver } from "@langchain/langgraph";
import { ToolNode, toolsCondition } from "@langchain/langgraph/prebuilt";
import { AgentStateAnnotation, NODES } from "./state";
import { researchAgent, analystAgent, supervisor, writerAgent, factCheckerAgent } from "./nodes";
import { webSearch } from "./tools/webSearch";
import { queryMemoryTool } from "./tools/queryMemory";
import { saveMemoryTool } from "./tools/saveMemory";/

// Initialize the tool node with our search and memory tools
const toolNode = new ToolNode([webSearch, queryMemoryTool, saveMemoryTool]);

// Retry policy for LLM nodes (handles rate limits, transient errors)
const llmRetryPolicy = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryOn: (e: any): boolean => {
    // Retry on 5xx errors, rate limits (429), or transient 400s
    const status = e?.status || e?.statusCode;
    if (status === 429) return true; // Rate limit
    if (status && status >= 500) return true; // Server error
    // Don't retry on 400 (bad request) - those need fixes
    return false;
  },
};

// Define the workflow using the state annotation
export const workflow = new StateGraph(AgentStateAnnotation)
  // 1. ADD ALL NODES FIRST (Crucial for TypeScript inference)
  .addNode(NODES.SUPERVISOR, supervisor, { retryPolicy: llmRetryPolicy })
  .addNode(NODES.RESEARCHER, researchAgent, { retryPolicy: llmRetryPolicy })
  .addNode(NODES.TOOLS, toolNode)
  .addNode(NODES.ANALYST, analystAgent, { retryPolicy: llmRetryPolicy })
  .addNode(NODES.FACT_CHECKER, factCheckerAgent, { retryPolicy: llmRetryPolicy })
  .addNode(NODES.WRITER, writerAgent, { retryPolicy: llmRetryPolicy })

  // 2. DEFINE EDGES
  .addEdge(START, NODES.SUPERVISOR)

  // Supervisor decides what to do next
  .addConditionalEdges(
    NODES.SUPERVISOR,
    (state) => state.nextAgent,
    {
      [NODES.RESEARCHER]: NODES.RESEARCHER,
      [NODES.ANALYST]: NODES.ANALYST,
      [NODES.FACT_CHECKER]: NODES.FACT_CHECKER,
      [NODES.WRITER]: NODES.WRITER,
      FINISH: END,
    }
  )

  // Researcher tool loop
  .addConditionalEdges(
    NODES.RESEARCHER,
    toolsCondition,
    {
      [NODES.TOOLS]: NODES.TOOLS,
      [END]: NODES.SUPERVISOR // Returns to supervisor if no tools are called
    }
  )
  .addEdge(NODES.TOOLS, NODES.RESEARCHER)

  // Linear flow back to supervisor
  .addEdge(NODES.FACT_CHECKER, NODES.SUPERVISOR)
  .addEdge(NODES.ANALYST, NODES.SUPERVISOR)
  .addEdge(NODES.WRITER, NODES.SUPERVISOR);

// Compile the graph
export const app = workflow.compile({
  checkpointer: new MemorySaver(),
});
