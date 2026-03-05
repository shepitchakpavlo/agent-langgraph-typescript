# Agent Quality Evaluation

## Architecture & Design — Good

The supervisor multi-agent pattern is well-chosen for this workflow. The feedback loop (fact-checker → writer on contradictions, → researcher on missing data) is smart and shows a genuine understanding of the agentic pattern. The `NODES`/`AGENTS` constants in `state.ts` to avoid magic strings is clean practice, and separating schemas, tools, and nodes into dedicated directories makes the codebase easy to navigate.

---

## Issues Found

### Critical

**1. Infinite loop risk** — The graph has no recursion limit or escape counter. If the fact-checker persistently fails (e.g., the LLM is too strict), the system will cycle `writerAgent → factCheckerAgent → writerAgent` forever. LangGraph supports a `recursionLimit` at compile or invoke time but it's not set:

```typescript
// src/graph.ts
export const app = workflow.compile({
  checkpointer: new MemorySaver(),
  // Missing: recursionLimit: 25
});
```

**2. `researchData` deduplication is broken** — In `researchAgent.ts`, the snippet collection scans `state.messages` for all tool messages on every invocation, then returns them. Because the reducer is `concat`, every time `researchAgent` re-runs in a loop, previously seen snippets are re-added. The `new Set(...)` deduplicates *within* a single call but not against what's already in `researchData`, so the array grows with duplicates.

**3. Buggy `_getType` check** — In `researchAgent.ts` line 22:

```typescript
msg._getType === "human", // _getType is a method, not a property — always false
```

This condition can never be true. The `msg.type === "human"` check on line 21 is the only one actually working.

---

### Moderate

**4. Supervisor uses an LLM for deterministic logic** — The routing rules in `supervisor.ts` are purely state-based (`if no research → researchAgent`, etc.). This is a finite state machine, not a reasoning task. Using an LLM here adds latency, cost, and non-determinism (the LLM can still pick the wrong route). This could be replaced with a simple function that reads state directly.

**5. Context window growth** — Agents like `writerAgent` and `analystAgent` pass the full `...state.messages` into the LLM. As the workflow progresses (researcher loops, tool outputs accumulate), this grows unboundedly. The supervisor's `slice(-4)` is the only mitigation and it's inconsistent. The writer also appends the full report to messages (`messages: [new AIMessage(\`Report complete:\n\n${report}\`)]`), which gets fed back to the fact-checker and beyond.

**6. `llm.bindTools` called on every invocation** — `researchAgent.ts` calls `llm.bindTools([...])` inside the function body. This creates a new object on every call. It should be bound once at module level.

**7. Hardcoded default topic** — `default: () => "the architecture of the Llama-3 model"` in `state.ts` is confusing for any user who doesn't supply input. Consider making it `""` and having the agent fail gracefully or prompt for input.

---

### Minor

**8. Heavy `any` usage** — `index.ts` and parts of `researchAgent.ts` use `any` extensively (`result: any`, `data: any`, `msg: any`). This defeats the purpose of TypeScript. The LangChain types (`BaseMessage`, `AIMessage`, etc.) are available and should be used.

**9. Hard-coded truncation** — `factCheckerAgent.ts` silently truncates research context to 20,000 chars and the report to 8,000. This could drop relevant evidence without any warning or logging.

**10. `MemorySaver` is RAM-only** — Fine for dev, but worth a comment that it's not persistent across server restarts. The LanceDB memory *is* persistent, which creates an interesting asymmetry: the graph state is ephemeral but the semantic memory survives.

**11. Test coverage is minimal** — There's one test for `getVectorStore`. No tests for any agent logic, graph routing, or schema parsing. For an agentic system where routing bugs can cause loops, even basic unit tests for the supervisor and graph edges would be valuable.

---

## Summary

| Area | Rating |
|---|---|
| Overall architecture | Strong |
| LangGraph usage | Good |
| Routing logic | Over-engineered (LLM for a state machine) |
| Safety (loop prevention) | Needs work |
| State management | Has a duplication bug |
| TypeScript quality | Moderate (too many `any`s) |
| Test coverage | Weak |

The highest priority fixes are:
1. Add `recursionLimit` to the compiled graph.
2. Fix the `researchData` dedup logic to track which tool messages have already been added.
3. Consider replacing the supervisor LLM call with a pure routing function.
