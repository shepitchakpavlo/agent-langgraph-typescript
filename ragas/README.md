# RAGAS TypeScript Adapter

This directory contains a TypeScript adapter that allows you to use the Python RAGAS evaluation framework from your TypeScript/LangGraph project.

## Overview

**RAGAS** is a Python framework for evaluating Retrieval-Augmented Generation (RAG) systems. This TypeScript adapter provides a clean TypeScript interface that calls the Python evaluation script and parses the results.

## Architecture

```
TypeScript (your project)
    ↓
RagasAdapter (TypeScript wrapper)
    ↓ calls via stdin/file
Python RAGAS script (ragas/evaluate.py)
    ↓
RAGAS Python library (pip install ragas)
```

## Installation

### 1. Install Python RAGAS

First, ensure you have Python 3.8+ installed, then install RAGAS:

```bash
pip install ragas
```

For optional dependencies (recommended):

```bash
pip install ragas[complete]
```

### 2. Verify Python is accessible

Ensure `python3` is in your PATH:

```bash
which python3
```

If not, you can configure the custom path in the `RagasConfig`.

## Usage

### Basic Usage

```typescript
import { evaluateRAGSample } from './src/ragas/adapter';

const results = await evaluateRAGSample({
  question: 'What is RAGAS?',
  context: ['RAGAS evaluates RAG systems.'],
  answer: 'RAGAS is a Python library for evaluating RAG systems.'
});

console.log(results);
```

### Evaluate Multiple Samples

```typescript
import { evaluateRAG } from './src/ragas/adapter';

const samples = [
  {
    question: 'What is LangChain?',
    context: ['LangChain is an LLM framework.'],
    answer: 'LangChain is a framework for LLM applications.'
  },
  // ... more samples
];

const results = await evaluateRAG(samples);
```

### Using with LangGraph Tools

```typescript
import { evaluateRAGTool } from './src/tools/ragasEvaluation';

// The tool can now be called by agents in your LangGraph workflow
const result = await evaluateRAGTool.invoke({
  question: 'What is the capital of France?',
  context: ['Paris is the capital.'],
  answer: 'The capital is Paris.',
  metrics: ['faithfulness', 'answer_relevancy']
});
```

## API Reference

### RagasAdapter

Main class for RAGAS evaluation.

```typescript
const adapter = new RagasAdapter({
  api_key?: string,        // API key (optional, uses OPENROUTER_API_KEY or OPENAI_API_KEY)
  model?: string,          // Model (default: 'deepseek/deepseek-chat-v3-0324')
  baseURL?: string,       // Base URL for custom providers (default: from OPENROUTER_API_BASE)
  metrics?: RagasMetric[], // Metrics (default: ['faithfulness', 'answer_relevancy'])
  timeout?: number,       // Timeout in seconds (default: 60)
  pythonPath?: string,    // Path to Python interpreter (default: 'python3')
  scriptPath?: string     // Path to evaluation script
});
```

#### Methods

- `evaluateSample(sample)`: Evaluate a single RAG sample
- `evaluate(samples)`: Evaluate multiple samples
- `evaluateWithFile(samples, outputPath?)`: Evaluate using temporary files
- `formatResults(results)`: Format results as a readable string

### RagasMetric

Supported evaluation metrics:

| Metric | Description |
|--------|-------------|
| `faithfulness` | How faithful the answer is to retrieved context |
| `answer_relevancy` | How relevant the answer is to the question |
| `context_precision` | How precise the retrieval was |
| `context_recall` | How complete the retrieval was |

### RagasSample

Input data structure for evaluation:

```typescript
interface RagasSample {
  question?: string;          // User question
  user_input?: string;       // Alternative name for question
  context?: string[];        // Retrieved context
  retrieved_contexts?: string[];  // Alternative name for context
  answer?: string;           // Generated answer
  response?: string;         // Alternative name for answer
  reference?: string;        // Reference answer (optional)
  ground_truth?: string;     // Alternative reference (optional)
}
```

### RagasEvaluationResults

Output structure:

```typescript
interface RagasEvaluationResults {
  metrics: {
    [metric: string]: {
      mean: number;
      std: number;
      min: number;
      max: number;
    };
  };
  per_sample: {
    index: number;
    scores: { [metric: string]: number };
  }[];
}
```

## Configuration

### Environment Variables

The adapter uses OpenRouter with DeepSeek by default. Set up your OpenRouter credentials:

```bash
export OPENROUTER_API_KEY="your-openrouter-api-key"
export OPENROUTER_APIBase="https://openrouter.ai/api/v1"  # Optional, defaults to this
```

Or use OpenAI:
```bash
export OPENAI_API_KEY="your-openai-api-key"
```

The adapter will automatically use:. `OPENROUTER_API_KEY` + `OPENROUTER_API_BASE` (preferred, uses DeepSeek v3)
2. `OPENAI_API_KEY` (fallback, uses OpenAI models)

Or pass it in the configuration:

```typescript
const adapter = new RagasAdapter({
  api_key: 'your-openai-api-key'
});
```

### Custom Python Path

If your Python is at a custom location:

```typescript
const adapter = new RagasAdapter({
  pythonPath: '/usr/local/bin/python3'
});
```

### Custom LLM Provider

You can specify a different LLM provider:

```typescript
const adapter = new RagasAdapter({
  model: 'gpt-4o-mini',
  baseURL: 'https://api.openai.com/v1',
  api_key: 'your-openai-key'
});
```

## Integration with LangGraph

The adapter includes a LangChain tool (`evaluateRAGTool`) that can be used in your LangGraph workflows. This tool is automatically available to agents when added to the tool node.

In your `graph.ts`:

```typescript
import { evaluateRAGTool } from './tools/ragasEvaluation';

// Add to tool node
const toolNode = new ToolNode([
  webSearch,
  queryMemoryTool,
  saveMemoryTool,
  evaluateRAGTool  // ← Add RAGAS evaluation
]);
```

Agents can now call this tool to evaluate their RAG outputs:

```typescript
// In an agent's response, it can evaluate its output:
"Let me evaluate if my answer is grounded in the context..."
```

## Examples

See `examples/ragas-usage.ts` for complete examples including:

1. Simple single-sample evaluation
2. Batch evaluation of multiple samples
3. Evaluation with reference answers
4. LangGraph workflow integration
5. Test dataset evaluation

## Interpretation of Scores

| Score Range | Quality Level |
|-------------|---------------|
| > 0.9       | Excellent     |
| 0.7 - 0.9   | Good          |
| 0.5 - 0.7   | Needs improvement |
| < 0.5       | Poor         |

## Default Behavior

The adapter is configured to use **OpenRouter with DeepSeek v3** by default:
- Model: `deepseek/deepseek-chat-v3-0324`
- API key: `OPENROUTER_API_KEY` environment variable
- Base URL: `OPENROUTER_API_BASE` environment variable (default: `https://openrouter.ai/api/v1`)
- Embeddings: `openai/text-embedding-3-small` via OpenRouter (same as LangGraph agent)

DeepSeek v3 is chosen for its:
- Excellent tool calling capabilities
- Free tier availability
- Strong performance for evaluation tasks
- Cost-effectiveness compared to GPT-4

All RAGAS metrics are supported with OpenRouter:
- `faithfulness` - How faithful the answer is to retrieved context
- `answer_relevancy` - How relevant the answer is to the question
- `context_precision` - How precise the retrieval was
- `context_recall` - How complete the retrieval was

## Error Handling

Common issues and solutions:

### Python not found

```
Error: Failed to spawn Python process: python3: command not found
```

Solution: Set the correct Python path:

```typescript
const adapter = new RagasAdapter({
  pythonPath: '/path/to/python3'
});
```

### RAGAS not installed

```
ModuleNotFoundError: No module named 'ragas'
```

Solution: Install RAGAS in Python:

```bash
pip install ragas
```

### Missing API key

```
ValueError: API key must be provided via input or OPENROUTER_API_KEY/OPENAI_API_KEY environment variable
```

Solution: Set `OPENROUTER_API_KEY` (preferred) or `OPENAI_API_KEY` environment variable:

```bash
export OPENROUTER_API_KEY="your-openrouter-key"
```

Or pass in config:

```typescript
const adapter = new RagasAdapter({
  api_key: 'your-key'
});
```

## Performance Considerations

- Each evaluation makes calls to OpenAI API, which costs money
- Time out defaults to 60 seconds per evaluation
- Batch evaluation is more efficient than single evaluations
- Consider caching results for repeated evaluations

## Limitations

1. **Language**: RAGAS is Python-only, this adapter bridges to it
2. **API dependency**: Requires LLM API key (OpenRouter or OpenAI)
3. **Network**: Requires internet access for LLM API calls
4. **Cost**: Evaluation incurs API costs per sample (DeepSeek is cost-effective)

## Future Enhancements

Potential improvements:

- [ ] Support for alternative LLM providers (Anthropic, Google, etc.)
- [ ] Async batch evaluation
- [ ] Results caching
- [ ] Custom metrics support
- [ ] Statistical analysis and trend tracking

## Contributing

To extend the adapter:

1. Modify `ragas/evaluate.py` to add new metrics
2. Update TypeScript types in `src/ragas/adapter.ts`
3. Add examples in `examples/ragas-usage.ts`

## License

This adapter follows the same license as your LangGraph project.