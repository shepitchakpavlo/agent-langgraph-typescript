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
  const [status, setStatus] = useState<"idle" | "loading" | "active" | "completed" | "error">("idle");
  const [error, setError] = useState<string | undefined>();
  const [startTime, setStartTime] = useState<Date | undefined>();

  const startStream = useCallback(async () => {
    setStatus("loading");
    setError(undefined);
    setEvents([]);
    setStartTime(new Date());

    try {
      const client = new Client({ apiUrl });
      
      // Create thread if none provided
      const thread = threadId
        ? await client.threads.get(threadId)
        : await client.threads.create();
      
      setStatus("active");
      
      // Stream events from LangGraph
      const streamResponse = await client.runs.stream(
        thread.thread_id,
        assistantId,
        {
          input,
          streamMode: ["updates", "messages"],
        }
      );
      
      for await (const chunk of streamResponse) {
        if (chunk.event === "updates") {
          const data = chunk.data as Record<string, unknown>;
          
          // Agent routing events
          if (data.nextAgent) {
            setEvents(prev => [
              ...prev,
              {
                type: "agent",
                content: `Routing to ${data.nextAgent as string}`,
                timestamp: new Date().toISOString(),
              },
            ]);
          }
          
          // Tool call events
          if (data.tool_calls) {
            const toolCalls = data.tool_calls as Array<{
              name: string;
            }>;
            toolCalls.forEach((tc) => {
              setEvents(prev => [
                ...prev,
                {
                  type: "tool",
                  content: `${tc.name}: executed`,
                  timestamp: new Date().toISOString(),
                },
              ]);
            });
          }
        }
        
        if (chunk.event === "messages") {
          const messages = chunk.data as Array<{
            content: string | Array<{ text: string }>;
          }>;
          messages.forEach((msg) => {
            const content = 
              typeof msg.content === 'string'
                ? msg.content
                : msg.content.map((m: any) => m.text || '').join('');
            
            setEvents(prev => [
              ...prev,
              {
                type: "message",
                content: content.slice(0, 200),
                timestamp: new Date().toISOString(),
              },
            ]);
          });
        }
      }
      
      setStatus("completed");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Connection error";
      
      // Graceful degradation if server not available
      console.error("LangGraph stream error:", err);
      setError(errorMessage);
      setEvents([
        {
          type: "error",
          content: ` Failed to connect to LangGraph: ${errorMessage}`,
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