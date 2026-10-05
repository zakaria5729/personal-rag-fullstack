# Personal RAG – Backend

Spring Boot multi-module RAG API. Java 21, Spring Boot 4.0.2, Maven.

## Modules

- `rag-module` – reusable RAG library: OpenNLP chunking, Ollama embeddings/chat via LangChain4j, ONNX reranker, pgvector storage. Facade: `RagBuilder`.
- `app-module` – REST API (`KnowledgeController`, base path `/knowledge`): create text/URL, create via PDF upload, update, delete, get by id, paginated list, vectors by `hash_id`, streaming ask (SSE).

## Prerequisites

- Java 21, Maven 3.9+
- PostgreSQL 16+ with `pgvector` extension, database `static_rag` on `localhost:5432` (see `app-module/src/main/resources/application-app.yml`)
- Ollama on `localhost:11434` with models `phi4-mini:latest` and `nomic-embed-text:137m-v1.5-fp16`
- Reranker files: `/Users/zakaria/Data/rag-models/reranker/` (`model.onnx`, `model.onnx_data`, `tokenizer.json`)
- Sentence model: `/Users/zakaria/Data/rag-models/sentence-split/opennlp-en-ud-ewt-sentence-1.3-2.5.4.bin`

## External model files

The app loads these ML models from disk at startup (paths are configurable, values below are the current ones in `rag-module/src/main/resources/application-rag.yml`):

| # | File(s) | Config key | Default if unset |
|---|---------|-----------|------------------|
| 1 | `/Users/zakaria/Data/rag-models/reranker/model.onnx` + `model.onnx_data` + `tokenizer.json` | `reranker.models-base-path` | `./models/reranker` |
| 2 | `/Users/zakaria/Data/rag-models/sentence-split/opennlp-en-ud-ewt-sentence-1.3-2.5.4.bin` | `sentence-split.model-path` | `./models/opennlp-en-sent.bin` |

Setup instructions:

1.  Sentence model (file 2): download `opennlp-en-ud-ewt-sentence-1.3-2.5.4.bin` from the Apache OpenNLP models page — https://opennlp.apache.org/models.html — and place it at the `sentence-split.model-path` location. The app fails fast at startup if this file is missing (`SentenceSplitConfig`).
2.  Reranker (file 1): place a compatible ONNX cross-encoder reranker export (`model.onnx`, weights `model.onnx_data`, `tokenizer.json`) under the `reranker.models-base-path` directory. If these files are missing the app still starts but falls back to keyword scoring (`KeywordScoringModel`, see `RerankerConfig`), so retrieval quality drops.
3.  Ollama models (pulled, not files): `ollama pull phi4-mini:latest` and `ollama pull nomic-embed-text:137m-v1.5-fp16` with Ollama serving on `localhost:11434`.

## Run

```bash
cd personal-rag-backend
mvn -pl rag-module,app-module -am compile
mvn -pl app-module -am spring-boot:run
```

API base: `http://localhost:8080/knowledge/*`. Flyway migrates the `knowledge` schema on startup. Logs: `~/logfiles/static-rag/`.
