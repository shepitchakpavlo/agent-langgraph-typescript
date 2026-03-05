import { Annotation, MessagesAnnotation } from "@langchain/langgraph";
import { ResearchSummary } from "./schemas/researchSummary";
import { FactCheckReport } from "./schemas/factCheckReport";

// Central source of truth for node names to avoid duplication
export const AGENTS = {
  RESEARCHER: "researchAgent",
  ANALYST: "analystAgent",
  WRITER: "writerAgent",
  FACT_CHECKER: "factCheckerAgent",
} as const;

export const NODES = {
  SUPERVISOR: "supervisor",
  ...AGENTS,
  TOOLS: "tools",
} as const;

export const ROUTING_OPTIONS = ["FINISH", NODES.SUPERVISOR, ...Object.values(AGENTS)] as const;
export type RoutingOption = (typeof ROUTING_OPTIONS)[number];

// Define the state using MessagesAnnotation.extend (modern LangGraph API)
// This ensures it is correctly recognized by LangGraph Studio's "Chat" mode.
export const AgentStateAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  // Full conversation history is already in messages (from MessagesAnnotation)

  // Array of raw facts/snippets gathered by the Researcher.
  researchData: Annotation<string[]>({
    default: () => [],
    reducer: (old, newVal) => old.concat(newVal),
  }),

  // Structured insights/outline created by the Analyst.
  synthesis: Annotation<ResearchSummary | undefined>(),

  // The polished Markdown output from the Writer.
  finalReport: Annotation<string | undefined>(),

  // Status flag (pending/verified/failed) from the Fact-Checker
  verificationStatus: Annotation<"pending" | "verified" | "failed">({
    default: () => "pending",
    reducer: (_, newVal) => newVal,
  }),

  // Detailed fact-checking report with claim-by-claim verification
  factCheckReport: Annotation<FactCheckReport | undefined>(),

  // Routing instruction for the Graph.
  nextAgent: Annotation<RoutingOption>({
    default: () => NODES.SUPERVISOR,
    reducer: (_, newVal) => newVal,
  }),

  // Original userInput if needed as a helper
  userInput: Annotation<string>({
    default: () => "the architecture of the Llama-3 model",
    reducer: (_, newVal) => newVal,
  }),

  // Attempt counters to prevent infinite loops
  writerAttempts: Annotation<number>({
    default: () => 0,
    reducer: (_, newVal) => newVal,
  }),

  researcherAttempts: Annotation<number>({
    default: () => 0,
    reducer: (_, newVal) => newVal,
  }),

  // Maximum allowed attempts before forcing completion
  maxAttempts: Annotation<number>({
    default: () => 3,
    reducer: (_, newVal) => newVal,
  }),
});

// For easier typing in functions
export type AgentState = typeof AgentStateAnnotation.State;
