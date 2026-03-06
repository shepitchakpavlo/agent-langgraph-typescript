import React, { useState, useEffect, useRef } from "react";
import { Text, Box } from "ink";

/**
 * ProgressBar - Visual activity indicator with elapsed time tracking.
 *
 * Since LangGraph streams don't provide a total count upfront, this
 * uses an indeterminate "bouncing" animation rather than a percentage bar.
 * The elapsed timer helps users gauge how long an operation has been running.
 *
 * Educational note: Indeterminate progress indicators are preferred over
 * fake percentage bars when the total work is unknown. They honestly
 * communicate "work is happening" without misleading the user.
 */

interface ProgressBarProps {
  /** Width of the progress bar in characters (default: 20) */
  width?: number;
  /** Whether the bar is actively animating */
  active?: boolean;
  /** Color of the active segment */
  color?: string;
  /** When the operation started (used for elapsed time display) */
  startTime?: Date;
}

/** Format elapsed seconds into a human-readable string like "1m 23s" */
function formatElapsed(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

export default function ProgressBar({
  width = 20,
  active = true,
  color = "cyan",
  startTime,
}: ProgressBarProps) {
  const [position, setPosition] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  // Use ref for direction to avoid recreating interval on every bounce
  const directionRef = useRef(1);

  // Bouncing indicator animation: a highlighted segment moves
  // back and forth across the bar, creating a "Knight Rider" effect.
  useEffect(() => {
    if (!active) return;

    const segmentWidth = 3;
    const timer = setInterval(() => {
      setPosition((prev) => {
        const next = prev + directionRef.current;
        if (next >= width - segmentWidth || next <= 0) {
          directionRef.current *= -1;
        }
        return Math.max(0, Math.min(next, width - segmentWidth));
      });
    }, 100);

    return () => clearInterval(timer);
  }, [active, width]);

  // Elapsed time counter — updates every second when a startTime is provided.
  useEffect(() => {
    if (!startTime || !active) return;

    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime, active]);

  // Build the bar string: dim background with a bright sliding segment.
  const segmentWidth = 3;
  const bar = Array.from({ length: width }, (_, i) => {
    if (active && i >= position && i < position + segmentWidth) {
      return "█";
    }
    return "░";
  }).join("");

  return (
    <Box gap={1}>
      <Text>
        <Text color={active ? color : "gray"}>{bar}</Text>
      </Text>
      {startTime && (
        <Text dimColor>
          {formatElapsed(elapsed)}
        </Text>
      )}
    </Box>
  );
}
