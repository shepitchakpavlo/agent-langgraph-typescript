|# Caching Implementation Task List
|
|- [x] Enable LLM caching in `src/llm.ts` using `InMemoryCache`
|- [x] Enable embedding caching in `src/lib/memory.ts` using `CacheBackedEmbeddings`
|- [ ] Add web search cache wrapper to `src/tools/webSearch.ts`
- [ ] Implement cache invalidation rules for memory writes
- [ ] Add cache hit/miss logging and observability
- [ ] Verify no regressions with existing test suite
- [ ] Document estimated cost savings from caching
