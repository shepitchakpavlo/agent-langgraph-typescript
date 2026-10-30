# LangGraph Research Agents (Modern Features)

This project is a TypeScript-based implementation of a multi-agent research system using **LangGraph**. It demonstrates modern LangGraph features like `ToolNode`, structured output, and persistent memory.

## Overview

The application uses **LangGraph** to orchestrate a research workflow:
1.  **Supervisor Agent**: Routes the task to the appropriate specialist agent.
2.  **Research Agent**: Analyzes the user's topic and decides which search queries to execute using the `web_search` tool (powered by **Tavily**) and long-term memory (powered by **LanceDB**).
3.  **Analyst Agent**: Synthesizes the search results into a structured JSON analysis.
4.  **Fact-Checker Agent**: Verifies claims against the retrieved research.
5.  **Writer Agent**: Produces the final grounded report.

## Example Output

**Input:** `"What is LangGraph and how does it differ from LangChain?"`

**Agent trace:**
```
[supervisor]  → routes to researchAgent
[research]    → web_search("LangGraph vs LangChain") via Tavily
               → queryMemory (LanceDB, no prior context)
[analyst]     → synthesizes 3 results into structured JSON
[fact-checker]→ verifies 4 claims against retrieved context
[writer]      → produces final grounded report
```

**RAGAS evaluation scores** (from `evaluation-report.json`):

| Metric | Score |
|---|---|
| Faithfulness | 0.86 |
| Answer Relevancy | 0.93 |
| Context Precision | 0.83 (avg) |
| Context Recall | 0.88 (avg) |

Full evaluation: see [`EVALUATION.md`](./EVALUATION.md) and [`evaluation-report.json`](./evaluation-report.json).

## Prerequisites

- Node.js 18+
- Yarn 4 (node-modules linker)
- OpenRouter API key
- Tavily API key

## Setup

1. Navigate to the project directory:
   ```bash
   cd agent-langgraph-typescript
   ```

2. Install dependencies:
   ```bash
   yarn install
   ```

3. Configure environment variables in `.env` (copy from `.env.example`):
   ```env
   OPENROUTER_API_KEY=your_openrouter_key
   OPENROUTER_API_BASE=https://openrouter.ai/api/v1
   TAVILY_API_KEY=your_tavily_key
   ```

## Running the Application

### Development mode:
```bash
yarn dev
```

### Production build:
```bash
yarn build
yarn start
```

### Run RAGAS Evaluation:
```bash
yarn eval
```

## Project Structure

- `src/index.ts`: Entry point with `app.invoke` and thread configuration.
- `src/graph.ts`: Workflow definition with nodes and conditional edges.
- `src/state.ts`: State definition using `Annotation.Root`.
- `src/nodes/`: Agent implementations (`supervisor`, `researchAgent`, `analystAgent`, `factCheckerAgent`, `writerAgent`).
- `src/tools/`: Tool definitions (`webSearch`, `queryMemory`, `saveMemory`, `ragasEvaluation`).
- `src/lib/memory.ts`: LanceDB vector store configuration using OpenRouter embeddings (`google/gemini-embedding-001`).
- `src/schemas/`: Zod schemas for structured output.

## Core Technologies

- **LangGraph (@langchain/langgraph)**: Orchestration framework.
- **LangChain (@langchain/openai, @langchain/core)**: Used for LLM interaction and message schemas.
- **Tavily (@langchain/tavily)**: Used for real-time web search.
- **OpenRouter**: API gateway for `openai/gpt-4o-mini` and `google/gemini-embedding-001`.
- **LanceDB**: Local vector database for long-term memory.
- **Yarn PnP**: Dependency management.
