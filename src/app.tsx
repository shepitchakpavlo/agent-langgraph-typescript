import React, { useEffect } from "react";
import { Text, Box, useApp } from "ink";
import Layout from "./components/Layout.js";
import StreamDisplay from "./components/StreamDisplay.js";
import StatusIndicator from "./components/StatusIndicator.js";
import { useLangGraphStream } from "./hooks/useLangGraphStream.js";

export default function App() {
  const { exit } = useApp();
  const { events, status, startStream, error, startTime } = useLangGraphStream();

  // Auto-start stream on mount
  useEffect(() => {
    startStream();
  }, []);

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
