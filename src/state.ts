import { Annotation, MessagesAnnotation } from "@langchain/langgraph";

// Define the state using MessagesAnnotation.extend (modern LangGraph API)
// This ensures it is correctly recognized by LangGraph Studio's "Chat" mode.
export const AgentStateAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  userInput: Annotation<string | undefined>(),
  agent1Output: Annotation<string | undefined>(),
  agent2Output: Annotation<string | undefined>(),
});

// For easier typing in functions
export type AgentState = typeof AgentStateAnnotation.State;
