import { Client } from "@langchain/langgraph-sdk";

const client = new Client({ apiUrl: "http://localhost:2024" });

const thread = await client.threads.create();
console.error("Thread created:", thread.thread_id);

const stream = await client.runs.stream(
  thread.thread_id,
  "agent",
  {
    input: { userInput: "what is 2+2?" },
    streamMode: ["updates"],
  }
);

let count = 0;
for await (const chunk of stream) {
  console.error("=== CHUNK ===");
  console.error("Event:", chunk.event);
  console.error("Data:", JSON.stringify(chunk.data, null, 2));
  count++;
  if (count > 15) break;
}
console.error("Done. Total chunks:", count);
