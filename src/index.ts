import "dotenv/config";
import { StateGraph, END, START, Annotation } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage, BaseMessage } from "@langchain/core/messages";

// Define the state using Annotation.Root (modern LangGraph API)
const AgentStateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y),
    default: () => [],
  }),
  userInput: Annotation<string>(),
  agent1Output: Annotation<string>(),
  agent2Output: Annotation<string>(),
});

// For easier typing in functions
type AgentState = typeof AgentStateAnnotation.State;

// Initialize the LLM with OpenRouter (uses google/gemini-2.0-flash-lite-001 - cheap model)
const llm = new ChatOpenAI({
  model: "google/gemini-2.0-flash-lite-001",
  temperature: 0,
  configuration: {
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
  },
});

// Agent 1: Generates a short story based on user input
async function agent1(state: AgentState): Promise<Partial<AgentState>> {
  const userInput = state.userInput;

  const response = await llm.invoke([
    new SystemMessage("You are a creative story writer. Write a very short story (2-3 sentences) based on the given topic."),
    new HumanMessage(`Write a short story about: ${userInput}`)
  ]);

  return {
    agent1Output: response.content as string,
    messages: [response] // The reducer will concatenate this
  };
}

// Agent 2: Summarizes the story from Agent 1
async function agent2(state: AgentState): Promise<Partial<AgentState>> {
  const story = state.agent1Output;

  const response = await llm.invoke([
    new SystemMessage("You are a helpful summarizer. Provide a brief summary of the given text."),
    new HumanMessage(`Summarize this story: ${story}`)
  ]);

  return {
    agent2Output: response.content as string,
    messages: [response] // The reducer will concatenate this
  };
}

// Define the workflow using the state annotation
const workflow = new StateGraph(AgentStateAnnotation)
  // Add nodes
  .addNode("agent1", agent1)
  .addNode("agent2", agent2)

  // Set entry point
  .addEdge(START, "agent1")

  // Add edges
  .addEdge("agent1", "agent2")
  .addEdge("agent2", END);

// Compile the graph
const app = workflow.compile();

// Run the application
async function main() {
  console.log("🚀 Starting LangGraph Sequential Agents App\n");
  console.log("=".repeat(50));

  const initialState = {
    messages: [],
    userInput: "a brave knight fighting a dragon",
    agent1Output: "",
    agent2Output: "",
  };

  console.log(`\n📝 User Input: "${initialState.userInput}"\n`);

  try {
    const result = await app.invoke(initialState);

    console.log("🤖 Agent 1 (Story Writer) Output:");
    console.log(`   "${result.agent1Output}"\n`);

    console.log("🤖 Agent 2 (Summarizer) Output:");
    console.log(`   "${result.agent2Output}"\n`);

    console.log("=".repeat(50));
    console.log("✅ Execution completed successfully!");
  } catch (error) {
    console.error("❌ Error during execution:", error);
  }
}

main().catch(console.error);
