import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { AgentState } from "../state";
import { llm } from "../llm";

// Agent 2: Summarizes the story from Agent 1
export async function agent2(state: AgentState): Promise<Partial<AgentState>> {
  const story = state.agent1Output;

  const response = await llm.invoke([
    new SystemMessage(
      "You are a helpful summarizer. Provide a brief summary of the given text.",
    ),
    new HumanMessage(`Summarize this story: ${story}`),
  ]);

  return {
    agent2Output: response.content as string,
    messages: [response], // The reducer will concatenate this
  };
}
