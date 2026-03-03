import { Annotation, MessagesAnnotation } from "@langchain/langgraph";
import { ResearchSummary } from "./schemas/researchSummary";

// Central source of truth for node names to avoid duplication
export const AGENTS = {
  RESEARCHER: "researchAgent",
  ANALYST: "analystAgent",
  WRITER: "writerAgent",
} as const;

export const NODES = {
  SUPERVISOR: "supervisor",
  ...AGENTS,
  TOOLS: "tools",
} as const;

export const ROUTING_OPTIONS = ["FINISH", ...Object.values(AGENTS)] as const;
export type RoutingOption = (typeof ROUTING_OPTIONS)[number];

// Define the state using MessagesAnnotation.extend (modern LangGraph API)
// This ensures it is correctly recognized by LangGraph Studio's "Chat" mode.
export const AgentStateAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  userInput: Annotation<string | undefined>({
    default: () => "Explain the benefits of LangGraph for multi-agent systems.",
    reducer: (old, newVal) => newVal ?? old,
  }),
  summary: Annotation<ResearchSummary | undefined>(),
  finalReport: Annotation<string | undefined>(),
  next: Annotation<RoutingOption>({
    default: () => NODES.SUPERVISOR,
  }),
});

// For easier typing in functions
export type AgentState = typeof AgentStateAnnotation.State;
