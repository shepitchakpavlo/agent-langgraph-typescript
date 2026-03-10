/**
 * Example usage of the RAGAS TypeScript adapter
 * 
 * This file demonstrates how to integrate RAGAS evaluation into your LangGraph project.
 */

import { RagasAdapter, evaluateRAG, evaluateRAGSample } from '../src/ragas/adapter';

/**
 * Example 1: Simple evaluation with convenience function
 */
async function example1_simpleEvaluation() {
  console.log('Example 1: Simple RAG evaluation\n');

  const sample = {
    question: 'What is RAGAS?',
    context: [
      'RAGAS is a Python framework for evaluating RAG systems.',
      'It provides metrics like faithfulness, answer relevancy, and context precision.',
    ],
    answer: 'RAGAS is a Python library that helps evaluate Retrieval-Augmented Generation systems with metrics.',
  };

  try {
    const results = await evaluateRAGSample(sample, {
      model: 'deepseek/deepseek-chat-v3-0324',  // OpenRouter DeepSeek model
      metrics: ['faithfulness', 'answer_relevancy'],
    });

    const adapter = new RagasAdapter();
    console.log(adapter.formatResults(results));
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Example 2: Evaluate multiple samples with detailed metrics
 */
async function example2_multipleSamples() {
  console.log('\nExample 2: Evaluating multiple samples\n');

  const samples = [
    {
      question: 'What is LangChain?',
      context: [
        'LangChain is a framework for developing applications powered by language models.',
        'It provides chains, agents, and tools for building complex AI applications.',
      ],
      answer: 'LangChain is a popular framework for building applications with large language models.',
    },
    {
      question: 'What is LangGraph?',
      context: [
        'LangGraph is a library for building stateful, multi-actor applications with LLMs.',
        'It extends LangChain with graph-based workflows and cycles.',
      ],
      answer: 'LangGraph is a framework for building stateful applications with LLMs using graph-based workflows.',
    },
  ];

  try {
    const results = await evaluateRAG(samples, {
      model: 'deepseek/deepseek-chat-v3-0324',  // Use OpenRouter DeepSeek
      metrics: ['faithfulness', 'answer_relevancy', 'context_precision'],
    });

    const adapter = new RagasAdapter();
    console.log(adapter.formatResults(results));
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Example 3: Evaluation with reference answers
 */
async function example3_withReferences() {
  console.log('\nExample 3: Evaluation with reference answers\n');

  const sample = {
    question: 'What are some Great Restaurants in San Francisco?',
    context: [
      'The House of Prime Rib is famous for its prime rib in SF.',
      'Tartine Bakery is known for its excellent bread and pastries.',
      'Burma Superstar offers authentic Burmese cuisine in the city.',
    ],
    answer: 'Some great restaurants in San Francisco include The House of Prime Rib, Tartine Bakery, and Burma Superstar.',
    reference: 'Great restaurants in San Francisco include The House of Prime Rib for prime rib, Tartine Bakery for pastries, and Burma Superstar for Burmese food.',
  };

  try {
    const results = await evaluateRAGSample(sample, {
      model: 'deepseek/deepseek-chat-v3-0324',  // Use OpenRouter DeepSeek
      metrics: ['faithfulness', 'answer_relevancy', 'context_precision', 'context_recall'],
    });

    const adapter = new RagasAdapter();
    console.log(adapter.formatResults(results));
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Example 4: Integrate with LangGraph workflow
 */
async function example4_langgraphIntegration() {
  console.log('\nExample 4: LangGraph workflow integration\n');

  import { evaluateRAGTool } from '../src/tools/ragasEvaluation';
  
  // Example usage within a LangGraph node
  // Note: Automatically uses OPENROUTER_API_KEY and OPENROUTER_API_BASE from environment
  const evaluationResult = await evaluateRAGTool.invoke({
    question: 'What is the capital of France?',
    context: [
      'France is a country in Western Europe.',
      'Paris is the capital city of France.',
    ],
    answer: 'Paris is the capital of France.',
    // model is optional, defaults to deepseek/deepseek-chat-v3-0324
    metrics: ['faithfulness', 'answer_relevancy'],
  });

  console.log('Tool result:');
  console.log(evaluationResult);
}

/**
 * Example 5: Batch evaluation for testing
 */
async function example5_batchEvaluation() {
  console.log('\nExample 5: Batch evaluation for testing\n');

  // Simulate evaluating your RAG system against a test dataset
  const testCases = [
    {
      question: 'What is the weather like?',
      context: ['The current temperature is 72 degrees and sunny.'],
      answer: 'The weather is sunny with a temperature of 72 degrees.',
    },
    {
      question: 'What are some popular programming languages?',
      context: [
        'Python is widely used for data science and machine learning.',
        'JavaScript is popular for web development.',
        'Rust is gaining traction for systems programming.',
      ],
      answer: 'Python, JavaScript, and Rust are popular programming languages used for machine learning, web development, and systems programming respectively.',
    },
  ];

  try {
    console.log('Running batch evaluation...');
    const results = await evaluateRAG(testCases, {
      model: 'deepseek/deepseek-chat-v3-0324',  // Use OpenRouter DeepSeek
      metrics: ['faithfulness', 'answer_relevancy'],
    });

    const adapter = new RagasAdapter();
    const formatted = adapter.formatResults(results);
    console.log(formatted);

    // Extract summary statistics
    console.log('\nSummary Statistics:');
    for (const [metric, scores] of Object.entries(results.metrics)) {
      console.log(`  ${metric}: ${scores.mean.toFixed(4)} avg`);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Run all examples
 */
async function runAllExamples() {
  await example1_simpleEvaluation();
  await example2_multipleSamples();
  await example3_withReferences();
  await example4_langgraphIntegration();
  await example5_batchEvaluation();
}

// Uncomment to run all examples:
// runAllExamples().catch(console.error);

// Or run individual examples:
// example1_simpleEvaluation().catch(console.error);
// example2_multipleSamples().catch(console.error);
// example3_withReferences().catch(console.error);
// example4_langgraphIntegration().catch(console.error);
// example5_batchEvaluation().catch(console.error);