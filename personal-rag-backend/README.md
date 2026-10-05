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

## Run

```bash
cd personal-rag-backend
mvn -pl rag-module,app-module -am compile
mvn -pl app-module -am spring-boot:run
```

API base: `http://localhost:8080/knowledge/*`. Flyway migrates the `knowledge` schema on startup. Logs: `~/logfiles/static-rag/`.
