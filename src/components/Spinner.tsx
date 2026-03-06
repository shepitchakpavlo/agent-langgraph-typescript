import React, { useState, useEffect } from "react";
import { Text } from "ink";

/**
 * Spinner - Animated text spinner for terminal UI.
 *
 * Uses braille dot characters that cycle at a configurable interval,
 * creating a smooth spinning animation in the terminal. This avoids
 * needing an external `ink-spinner` dependency.
 *
 * Educational note: Terminal spinners work by rapidly replacing characters
 * in-place using React re-renders. Ink handles the terminal cursor
 * management, so we just need to cycle through frames with setInterval.
 */

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

interface SpinnerProps {
  /** Text label displayed next to the spinner */
  label?: string;
  /** Color applied to the spinner character */
  color?: string;
  /** Frame cycle interval in milliseconds (default: 80ms) */
  intervalMs?: number;
}

export default function Spinner({
  label,
  color = "cyan",
  intervalMs = 80,
}: SpinnerProps) {
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    // Cycle through spinner frames on an interval.
    // Cleanup on unmount prevents memory leaks — a common pitfall
    // with setInterval in React components.
    const timer = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % SPINNER_FRAMES.length);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [intervalMs]);

  return (
    <Text>
      <Text color={color}>{SPINNER_FRAMES[frameIndex]}</Text>
      {label && <Text> {label}</Text>}
    </Text>
  );
}
