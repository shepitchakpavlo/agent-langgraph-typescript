import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getVectorStore } from "./memory";
import fs from "fs";
import path from "path";

// Mock the OpenAIEmbeddings to prevent actual API calls during the test
vi.mock("@langchain/openai", () => {
  return {
    OpenAIEmbeddings: class {
      embedDocuments = vi.fn().mockResolvedValue([[0.1, 0.2, 0.3]]);
      embedQuery = vi.fn().mockResolvedValue([0.1, 0.2, 0.3]);
    },
  };
});

describe("getVectorStore", () => {
  const TEST_DB_DIR = path.join(__dirname, "..", "..", "data", "lancedb_test");
  
  beforeEach(() => {
    // Override process.cwd to use a test-specific directory so we don't mess with real data
    vi.spyOn(process, "cwd").mockReturnValue(path.join(__dirname, "..", "..", "data", "lancedb_test_env"));
    
    // Create the dummy dir if it doesn't exist so process.cwd() has a place
    const mockCwdPath = path.join(__dirname, "..", "..", "data", "lancedb_test_env");
    if (!fs.existsSync(mockCwdPath)) {
      fs.mkdirSync(mockCwdPath, { recursive: true });
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // Clean up test database directory
    const mockCwdPath = path.join(__dirname, "..", "..", "data", "lancedb_test_env");
    if (fs.existsSync(mockCwdPath)) {
      fs.rmSync(mockCwdPath, { recursive: true, force: true });
    }
  });

  it("should initialize the vector store empty but with a schema", async () => {
    // 1. Get the vector store (this should trigger initialization)
    const vectorStore = await getVectorStore();
    
    expect(vectorStore).toBeDefined();

    // 2. A search on an empty table should return empty array, not throw
    const results_empty = await vectorStore.similaritySearch("test query", 1);
    expect(results_empty).toEqual([]);
    
    // 3. Adding a document should work now that the schema exists
    await vectorStore.addDocuments([{
      pageContent: "Test content",
      metadata: { source: "test" }
    }]);

    const results = await vectorStore.similaritySearch("Test content", 1);
    expect(results.length).toBe(1);
    expect(results[0].pageContent).toBe("Test content");
  });
});
