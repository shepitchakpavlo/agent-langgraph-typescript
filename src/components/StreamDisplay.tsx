import React from "react";
import { Box, Newline, Text } from "ink";
import EventRenderer, { StreamEvent } from "./EventRenderer.js";

/**
 * StreamDisplay - Scrollable event stream with auto-scroll.
 *
 * Concept: Terminal UIs can't natively scroll like a browser. Instead,
 * we implement "virtual scrolling" by only rendering the most recent N
 * events. This keeps the display focused on the latest activity while
 * showing a count of hidden older events.
 *
 * Educational note: This pattern (windowed rendering) is also used in
 * web UIs for performance (e.g. react-window), but here it's essential
 * because terminals have limited vertical space.
 */

interface StreamDisplayProps {
  events: StreamEvent[];
  showBorder?: boolean;
  /** Max events visible at once. Older events scroll out of view. */
  maxVisible?: number;
}

export default function StreamDisplay({
  events,
  showBorder = true,
  maxVisible = 15,
}: StreamDisplayProps) {
  // Auto-scroll: slice to show only the latest `maxVisible` events.
  // This ensures the most recent activity is always visible.
  const hiddenCount = Math.max(0, events.length - maxVisible);
  const visibleEvents = hiddenCount > 0
    ? events.slice(-maxVisible)
    : events;

  return (
    <Box
      flexDirection="column"
      borderStyle={showBorder ? "single" : undefined}
      borderColor="gray"
      paddingX={1}
      minHeight={10}
    >
      <Box justifyContent="space-between">
        <Text bold dimColor>
          Stream Events
        </Text>
        {events.length > 0 && (
          <Text dimColor>
            {events.length} total
          </Text>
        )}
      </Box>
      <Newline />

      {/* Scroll indicator — tells the user there are older events above */}
      {hiddenCount > 0 && (
        <Box marginBottom={1}>
          <Text color="yellow" dimColor>
            ↑ {hiddenCount} more event{hiddenCount !== 1 ? "s" : ""} above
          </Text>
        </Box>
      )}

      <EventRenderer events={visibleEvents} />
    </Box>
  );
}
