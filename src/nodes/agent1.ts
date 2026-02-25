import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { AgentState } from "../state";
import { llm } from "../llm";

// Agent 1: Generates a short story based on user input
export async function agent1(state: AgentState): Promise<Partial<AgentState>> {
  const userInput = state.userInput;

  const response = await llm.invoke([
    new SystemMessage(
      "You are a creative story writer. Write a very short story (2-3 sentences) based on the given topic.",
    ),
    new HumanMessage(`Write a short story about: ${userInput}`),
  ]);

  return {
    agent1Output: response.content as string,
    messages: [response], // The reducer will concatenate this
  };
}
