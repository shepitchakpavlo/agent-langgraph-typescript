import { useState, useCallback } from "react";
import { Client } from "@langchain/langgraph-sdk";
import { StreamEvent } from "../components/EventRenderer";

interface UseLangGraphStreamProps {
  apiUrl?: string;
  assistantId?: string;
  threadId?: string;
  input?: Record<string, unknown>;
}

interface UseLangGraphStreamReturn {
  events: StreamEvent[];
  status: "idle" | "loading" | "active" | "completed" | "error";
  startStream: () => Promise<void>;
  error?: string;
  /** Timestamp when the stream operation began (for elapsed time tracking) */
  startTime?: Date;
}

export function useLangGraphStream({
  apiUrl = "http://localhost:2024",
  assistantId = "agent",
  threadId,
  input = {},
}: UseLangGraphStreamProps = {}): UseLangGraphStreamReturn {
  const [events, setEvents] = useState<StreamEvent[]>([]);
  const [status, setStatus] = useState<
    "idle" | "loading" | "active" | "completed" | "error"
  >("idle");
  const [error, setError] = useState<string | undefined>();
  const [startTime, setStartTime] = useState<Date | undefined>();

  const startStream = useCallback(async () => {
    setStatus("loading");
    setError(undefined);
    setEvents([]);
    setStartTime(new Date());

    try {
      // Create client and thread with 5 second timeout
      const client = new Client({ apiUrl });

      const threadPromise = threadId
        ? client.threads.get(threadId)
        : client.threads.create();

      const thread = await Promise.race([
        threadPromise,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Connection timeout")), 5000),
        ),
      ]);

      setStatus("active");

      // Stream events from LangGraph
      const streamResponse = await client.runs.stream(
        thread.thread_id,
        assistantId,
        {
          input,
          streamMode: ["updates"],
        },
      );

      for await (const chunk of streamResponse) {
        // Small delay to allow React/Ink to re-render between updates
        // This prevents the async iterator from blocking the render cycle
        await new Promise((resolve) => setTimeout(resolve, 10));

        if (chunk.event === "updates") {
          const data = chunk.data as Record<string, unknown>;

          // LangGraph stream structure: { nodeName: { messages: [...], ...state updates } }
          for (const [nodeName, nodeOutput] of Object.entries(data)) {
            if (!nodeOutput || typeof nodeOutput !== "object") continue;

            const output = nodeOutput as Record<string, unknown>;

            // Handle supervisor routing decisions
            if (output.nextAgent) {
              setEvents((prev) => [
                ...prev,
                {
                  type: "agent",
                  content: `Routing to: ${output.nextAgent as string}`,
                  timestamp: new Date().toISOString(),
                },
              ]);
            }

            // Handle tool results
            if (
              nodeName === "tools" &&
              output.messages &&
              Array.isArray(output.messages)
            ) {
              const toolMsg = output.messages[output.messages.length - 1] as {
                name?: string;
                content?: string;
              };
              if (toolMsg?.name) {
                setEvents((prev) => [
                  ...prev,
                  {
                    type: "tool",
                    content: `Tool: ${toolMsg.name}: ${String(toolMsg.content || "executed").slice(0, 80)}`,
                    timestamp: new Date().toISOString(),
                  },
                ]);
              }
              continue;
            }

            // Handle agent messages (get the last AI message)
            if (output.messages && Array.isArray(output.messages)) {
              const lastMsg = output.messages[output.messages.length - 1] as {
                type?: string;
                content?: string | unknown[];
              };
              if (lastMsg?.content && lastMsg.type === "ai") {
                const content =
                  typeof lastMsg.content === "string" ? lastMsg.content : "";
                if (content) {
                  setEvents((prev) => [
                    ...prev,
                    {
                      type: "message",
                      content: `${nodeName}: ${content.slice(0, 120)}`,
                      timestamp: new Date().toISOString(),
                    },
                  ]);
                }
              }
            }

            // Handle special state updates
            if (output.verificationStatus) {
              setEvents((prev) => [
                ...prev,
                {
                  type: "agent",
                  content: `Verification: ${output.verificationStatus as string}`,
                  timestamp: new Date().toISOString(),
                },
              ]);
            }

            if (output.finalReport) {
              setEvents((prev) => [
                ...prev,
                {
                  type: "message",
                  content: `Report ready (${String(output.finalReport).length} chars)`,
                  timestamp: new Date().toISOString(),
                },
              ]);
            }
          }
        }
      }
      setStatus("completed");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Connection error";

      // Graceful degradation if server not available
      console.error("LangGraph stream error:", err);
      setError(errorMessage);
      setEvents([
        {
          type: "error",
          content: `Failed to connect to LangGraph: ${errorMessage}`,
        },
      ]);
      setStatus("error");
    }
  }, [assistantId, apiUrl, threadId, input]);

  return {
    events,
    status,
    startStream,
    error,
    startTime,
  };
}
