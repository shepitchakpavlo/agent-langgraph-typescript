import React from "react";
import { Text, Box } from "ink";

export interface StreamEvent {
  type: "agent" | "tool" | "message" | "error";
  content: string;
  timestamp?: string;
  metadata?: Record<string, unknown>;
}

interface EventRendererProps {
  events: StreamEvent[];
}

export default function EventRenderer({ events }: EventRendererProps) {
  // Get event styling based on type
  const getEventStyle = (type: StreamEvent["type"]) => {
    switch (type) {
      case "agent":
        return { color: "cyan", prefix: "🤖" };
      case "tool":
        return { color: "magenta", prefix: "🔧" };
      case "message":
        return { color: "green", prefix: "💬" };
      case "error":
        return { color: "red", prefix: "❌" };
    }
  };

  return (
    <Box flexDirection="column" gap={1}>
      {events.length === 0 && (
        <Text dimColor>No events to display...</Text>
      )}
      {events.map((event, index) => {
        const style = getEventStyle(event.type);
        return (
          <Box key={`${event.timestamp || ''}-${index}`}>
            <Text color={style.color}>
              {style.prefix} {event.content}
            </Text>
          </Box>
        );
      })}
    </Box>
  );
}