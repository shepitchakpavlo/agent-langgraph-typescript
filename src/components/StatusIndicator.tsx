import React from "react";
import { Text, Box } from "ink";
import Spinner from "./Spinner.js";
import ProgressBar from "./ProgressBar.js";

/**
 * StatusIndicator - Shows current operation status with visual feedback.
 *
 * Concept: Different states get different visual treatments:
 * - idle/completed/error: static icons (no animation needed)
 * - loading/active: animated spinner + progress bar to show liveness
 *
 * Educational note: Animated indicators are critical for long operations.
 * Without them, users can't tell if the app is frozen or working.
 * The progress bar + elapsed timer together communicate "work is happening"
 * and "this is how long it's been".
 */

export type Status = "idle" | "loading" | "active" | "completed" | "error";

interface StatusIndicatorProps {
  status: Status;
  message?: string;
  /** When the current operation started (enables elapsed time display) */
  startTime?: Date;
}

export default function StatusIndicator({ status, message, startTime }: StatusIndicatorProps) {
  const getStatusDisplay = () => {
    switch (status) {
      case "idle":
        return { icon: "⏸️", color: "yellow" as const, text: "Idle" };
      case "loading":
        return { icon: "⏳", color: "yellow" as const, text: "Connecting..." };
      case "active":
        return { icon: "🔄", color: "cyan" as const, text: "Streaming" };
      case "completed":
        return { icon: "✅", color: "green" as const, text: "Completed" };
      case "error":
        return { icon: "❌", color: "red" as const, text: "Error" };
    }
  };

  const { icon, color, text } = getStatusDisplay();
  const isAnimating = status === "loading" || status === "active";

  return (
    <Box flexDirection="column" gap={0}>
      <Box gap={1}>
        {/* Show animated spinner for active states, static icon otherwise */}
        {isAnimating ? (
          <Spinner label={text} color={color} />
        ) : (
          <Text color={color}>
            {icon} {text}
          </Text>
        )}
        {message && <Text dimColor>- {message}</Text>}
      </Box>

      {/* Progress bar only visible during active operations */}
      {isAnimating && (
        <ProgressBar active color={color} startTime={startTime} />
      )}
    </Box>
  );
}
