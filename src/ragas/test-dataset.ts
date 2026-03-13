import { RagasSample } from './adapter';

export const testDataset: RagasSample[] = [
  {
    question: 'What is LangGraph and how does it differ from LangChain?',
    context: [
      'LangGraph is a library for building stateful, multi-actor applications with LLMs. It extends LangChain with graph-based workflows and cycles.',
      'LangGraph allows you to define agents as nodes in a graph, with edges controlling the flow of information between them.',
      'Unlike LangChain chains which are linear, LangGraph supports cycles, branching, and persistent state.',
    ],
    answer: 'LangGraph is a framework for building stateful, multi-actor applications with LLMs using graph-based workflows. It differs from LangChain by supporting cycles, branching logic, and persistent state, whereas LangChain chains are primarily linear.',
    reference: 'LangGraph is a stateful orchestration framework that extends LangChain with graph-based workflows, cycles, and persistent state management for multi-agent systems.',
  },
  {
    question: 'What are vector embeddings used for in RAG systems?',
    context: [
      'Vector embeddings are numerical representations of text in a high-dimensional space.',
      'They enable semantic search by measuring similarity between vectors.',
      'In RAG systems, embeddings are used to index documents and find relevant context for queries.',
    ],
    answer: 'Vector embeddings are numerical representations of text that enable semantic search in RAG systems. They allow the system to find relevant documents by measuring similarity between the query and indexed content.',
    reference: 'Vector embeddings represent text as numerical vectors in high-dimensional space, enabling semantic similarity search for document retrieval in RAG systems.',
  },
  {
    question: 'How does the ReAct pattern work in AI agents?',
    context: [
      'The ReAct pattern stands for Reason + Act. It interleaves reasoning traces with actions.',
      'First, the agent reasons about what to do, then takes an action, then observes the result.',
      'This loop continues until the agent reaches a final answer or conclusion.',
    ],
    answer: 'The ReAct pattern (Reason + Act) is an agent architecture where the AI alternates between reasoning about what to do, taking actions, and observing results. This cycle continues iteratively until reaching a conclusion.',
    reference: 'ReAct is an agent pattern that interleaves reasoning traces with actions in a loop: Reason → Act → Observe, enabling more transparent and effective problem-solving.',
  },
  {
    question: 'What is chunking and why does it matter for retrieval quality?',
    context: [
      'Chunking is the process of splitting documents into smaller pieces before embedding.',
      'Smaller chunks can be more precisely matched to queries, improving relevance.',
      'However, chunks that are too small may lose important context.',
    ],
    answer: 'Chunking is splitting documents into smaller pieces before creating embeddings. It matters because smaller chunks can be more precisely matched to queries, but chunks that are too small may lose context, so finding the right chunk size is important.',
    reference: 'Chunking divides documents into smaller segments for embedding. Proper chunk size balances precision in retrieval against preserving contextual meaning.',
  },
  {
    question: 'What is the Supervisor pattern in multi-agent systems?',
    context: [
      'The Supervisor pattern uses a central agent to coordinate multiple specialized agents.',
      'The Supervisor receives queries and routes them to appropriate agents based on the task.',
      'It manages state and communication between agents.',
    ],
    answer: 'The Supervisor pattern is a multi-agent architecture where a central agent coordinates specialized agents. The Supervisor routes queries to appropriate agents, manages shared state, and handles inter-agent communication.',
    reference: 'The Supervisor pattern uses a central coordinating agent that routes tasks to specialized agents, manages state, and orchestrates communication in multi-agent systems.',
  },
  {
    question: 'What metrics does RAGAS use to evaluate RAG systems?',
    context: [
      'RAGAS evaluates RAG systems using four main metrics: faithfulness, answer relevancy, context precision, and context recall.',
      'Faithfulness measures how well the answer sticks to the provided context.',
      'Answer relevancy measures how relevant the answer is to the question.',
    ],
    answer: 'RAGAS uses four main metrics: faithfulness (answer accuracy to context), answer relevancy (answer relevance to question), context precision (relevance of retrieved context), and context recall (completeness of retrieval).',
    reference: 'RAGAS evaluates RAG systems using faithfulness, answer relevancy, context precision, and context recall to measure both retrieval and generation quality.',
  },
  {
    question: 'What is ChromaDB and why is it used for RAG?',
    context: [
      'ChromaDB is an open-source vector database designed for AI applications.',
      'It stores document embeddings and enables fast similarity search.',
      'ChromaDB is easy to set up locally and scales to production workloads.',
    ],
    answer: 'ChromaDB is an open-source vector database for AI applications. It stores document embeddings and provides fast similarity search, making it ideal for RAG systems. It is easy to set up locally and production-ready.',
    reference: 'ChromaDB is an open-source vector database that stores embeddings and enables fast similarity search, designed for building AI applications including RAG systems.',
  },
  {
    question: 'How does function calling work in LLM agents?',
    context: [
      'Function calling allows LLMs to invoke external tools by generating structured output.',
      'The LLM decides which function to call based on the user query and available function descriptions.',
      'Function results are fed back to the LLM to inform the next action.',
    ],
    answer: 'Function calling enables LLMs to use external tools by generating structured output that specifies which function to call. The LLM selects functions based on query and descriptions, then incorporates results into its response.',
    reference: 'Function calling lets LLMs invoke external tools by generating structured function calls, selecting appropriate tools based on context, and integrating results into responses.',
  },
  {
    question: 'What is the difference between context precision and context recall?',
    context: [
      'Context precision measures how much of the retrieved context is actually relevant.',
      'Context recall measures how much of the relevant information was successfully retrieved.',
      'High precision means less noise; high recall means better coverage.',
    ],
    answer: 'Context precision measures the relevance of retrieved context (how much is useful), while context recall measures completeness (how much relevant information was found). High precision reduces noise; high recall ensures coverage.',
    reference: 'Context precision measures the proportion of retrieved context that is relevant, while context recall measures the proportion of relevant information that was successfully retrieved.',
  },
  {
    question: 'What is Tavily and how is it used in AI research agents?',
    context: [
      'Tavily is an AI-optimized search API designed for LLM applications.',
      'It returns clean, structured search results optimized for agent consumption.',
      'Research agents use Tavily to fetch real-time information from the web.',
    ],
    answer: 'Tavily is an AI-optimized search API for LLM applications. It provides clean, structured search results designed for agents. Research agents use Tavily to retrieve real-time web information for answering queries.',
    reference: 'Tavily is a search API optimized for AI agents, returning structured results that LLMs can easily process for real-time information retrieval.',
  },
  {
    question: 'What are feedback loops in multi-agent systems?',
    context: [
      'Feedback loops allow agents to request revisions or additional work from other agents.',
      'For example, a Fact Checker can send results back to a Researcher if claims need verification.',
      'This iterative process improves output quality through collaboration.',
    ],
    answer: 'Feedback loops in multi-agent systems allow agents to request revisions or additional work from each other. For instance, a Fact Checker can loop back to a Researcher for verification. This iterative collaboration improves output quality.',
    reference: 'Feedback loops enable agents to iteratively request revisions or additional work from other agents, creating collaborative cycles that improve output quality.',
  },
  {
    question: 'Why is streaming important for AI user interfaces?',
    context: [
      'Streaming sends responses incrementally as they are generated rather than waiting for completion.',
      'This reduces perceived latency and improves user experience.',
      'Users can start reading results while the AI continues processing.',
    ],
    answer: 'Streaming is important for AI UIs because it sends responses incrementally as generated, reducing perceived latency. Users can start reading while processing continues, significantly improving the user experience.',
    reference: 'Streaming delivers AI responses incrementally as they are generated, reducing perceived latency and allowing users to read results while processing continues.',
  },
  {
    question: 'What is state management in LangGraph?',
    context: [
      'State in LangGraph is shared information that persists across nodes in the graph.',
      'It includes conversation history, retrieved documents, and intermediate results.',
      'State is defined using annotation and can be updated by any node.',
    ],
    answer: 'State management in LangGraph refers to shared information that persists across graph nodes, including conversation history, documents, and intermediate results. State is defined with annotations and can be updated by any node.',
    reference: 'LangGraph state is shared, persistent information across graph nodes including history and intermediate results, defined using annotations and updatable by any node.',
  },
  {
    question: 'What caching strategies reduce costs in AI applications?',
    context: [
      'Semantic caching stores responses for similar queries to avoid redundant LLM calls.',
      'Embedding caching avoids recomputing embeddings for the same text.',
      'Result caching stores final outputs for identical queries.',
    ],
    answer: 'Cost-reducing caching strategies include semantic caching (storing responses for similar queries), embedding caching (avoiding recomputation), and result caching (storing outputs for identical queries). These significantly reduce API costs.',
    reference: 'AI cost reduction strategies include semantic caching for similar queries, embedding caching to avoid recomputation, and result caching for identical queries.',
  },
  {
    question: 'What makes a RAG system production-ready?',
    context: [
      'Production RAG systems need robust error handling and retry mechanisms.',
      'They require monitoring for latency, cost, and quality metrics.',
      'Scalability considerations include vector database performance and rate limiting.',
    ],
    answer: 'A production-ready RAG system needs robust error handling with retries, monitoring for latency/cost/quality metrics, and scalability considerations including vector database performance and API rate limiting.',
    reference: 'Production RAG systems require error handling, comprehensive monitoring, scalability planning, and quality assurance through evaluation metrics.',
  },
];

export const testDatasetSimple = testDataset.map((sample) => ({
  question: sample.question,
  context: sample.context,
  answer: sample.answer,
}));
