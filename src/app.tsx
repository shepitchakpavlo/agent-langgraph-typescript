import React, { useEffect, useRef } from "react";
import { Text, Box, useApp } from "ink";
import Layout from "./components/Layout.js";
import StreamDisplay from "./components/StreamDisplay.js";
import StatusIndicator from "./components/StatusIndicator.js";
import { useLangGraphStream } from "./hooks/useLangGraphStream.js";

interface AppProps {
  /** User query to research */
  userInput?: string;
}

export default function App({ userInput }: AppProps) {
  const { exit } = useApp();
  const { events, status, startStream, error, startTime } = useLangGraphStream({
    input: { userInput: userInput || "the architecture of the Llama-3 model" },
  });

  // Stable ref to startStream to avoid dependency array issues
  const startStreamRef = useRef(startStream);
  startStreamRef.current = startStream;

  // Auto-start stream on mount
  useEffect(() => {
    startStreamRef.current();
  }, []);

  // Auto-exit on completion after showing result
  useEffect(() => {
    if (status === "completed") {
      const timer = setTimeout(() => exit(), 2000);
      return () => clearTimeout(timer);
    }
  }, [status, exit]);

  return (
    <Layout
      header={
        <Text bold color="cyan">
          LangGraph Research Agent - Streaming UI
        </Text>
      }
      footer={
        <StatusIndicator
          status={status}
          message={error || "Phase 4: Enhanced Features"}
          startTime={startTime}
        />
      }
    >
      <Box flexDirection="column" padding={1}>
        <StreamDisplay events={events} />
      </Box>
    </Layout>
  );
}
