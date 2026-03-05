import { LanceDB } from "@langchain/community/vectorstores/lancedb";
import { OpenAIEmbeddings } from "@langchain/openai";
import { CacheBackedEmbeddings } from "@langchain/classic/embeddings/cache_backed";
import { InMemoryStore } from "@langchain/core/stores";
import { connect } from "@lancedb/lancedb";
import path from "path";
import fs from "fs";

// Initialize underlying embeddings using OpenRouter
// Using openai/text-embedding-3-small - cheap ($0.02/M tokens), reliable, 1536 dimensions
const underlyingEmbeddings = new OpenAIEmbeddings({
  model: "openai/text-embedding-3-small",
  configuration: {
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: process.env.OPENROUTER_API_BASE,
  },
});

// Cache store for embeddings
const embeddingsStore = new InMemoryStore();

// Wrap embeddings with caching layer
const embeddings = CacheBackedEmbeddings.fromBytesStore(
  underlyingEmbeddings,
  embeddingsStore,
  {
    namespace: "openai/text-embedding-3-small",
  }
);

const TABLE_NAME = "agent_memory";

/**
 * Ensures the database directory and table exist, then returns a LanceDB vector store instance.
 */
export const getVectorStore = async (): Promise<LanceDB> => {
  const DB_PATH = path.join(process.cwd(), "data", "lancedb");

  // Ensure the directory exists
  if (!fs.existsSync(DB_PATH)) {
    fs.mkdirSync(DB_PATH, { recursive: true });
  }

  const db = await connect(DB_PATH);
  const tables = await db.tableNames();
  let table;

  if (!tables.includes(TABLE_NAME)) {
    // Initialize the table with a placeholder document to define the schema
    console.log(`Initializing empty memory table: ${TABLE_NAME}...`);
    const vectorStore = new LanceDB(embeddings, {
      uri: DB_PATH,
      tableName: TABLE_NAME,
    });
    
    await vectorStore.addDocuments([
      {
        pageContent: "Schema placeholder",
        metadata: { source: "system", timestamp: new Date().toISOString() },
      },
    ]);
    
    // Immediately delete the placeholder row so the table is empty but has the schema
    table = await db.openTable(TABLE_NAME);
    await table.delete("text = 'Schema placeholder'");
  } else {
    table = await db.openTable(TABLE_NAME);
  }

  return new LanceDB(embeddings, {
    table,
  });
};
