# LangGraph Sequential Agents

A simple TypeScript application demonstrating LangGraph with two sequential agents.

## Overview

This application showcases a basic LangGraph workflow with two agents that run sequentially:

1. **Agent 1 (Story Writer)**: Takes user input and generates a short story
2. **Agent 2 (Summarizer)**: Takes the story from Agent 1 and provides a summary

## Prerequisites

- Node.js 18+
- npm or yarn
- OpenRouter API key (already configured in .env)

## Setup

1. Navigate to the project directory:
   ```bash
   cd langgraph-sequential-agents
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. The API key is already configured in the `.env` file (copied from the project).

## Running the Application

### Development mode (with ts-node):
```bash
npm run dev
```

### Production build:
```bash
npm run build
npm start
```

## Expected Output

The application will:
1. Take the user input: "a brave knight fighting a dragon"
2. Pass it to Agent 1 which generates a short story
3. Pass the story to Agent 2 which summarizes it
4. Display both outputs

## Project Structure

```
langgraph-sequential-agents/
├── src/
│   └── index.ts          # Main application code
├── .env                  # API keys (copied from project)
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── .gitignore            # Git ignore rules
└── README.md             # This file
```

## Configuration

The application uses OpenRouter with `google/gemini-2.0-flash-lite-001` model (cheap and fast).

To change the model, edit `src/index.ts` and modify the model name:
```typescript
const llm = new ChatOpenAI({
  model: "google/gemini-2.0-flash-lite-001",
  // ...
});
```

## Customization

- Modify the `userInput` in `src/index.ts` to change the input topic
- Replace the LLM with another provider or model by updating the model initialization
- Add more agents or change the workflow by modifying the StateGraph