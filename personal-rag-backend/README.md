# Personal RAG – Backend

Spring Boot multi-module RAG API. Java 21, Spring Boot 4.0.2, Maven.

## Modules

- `rag-module` – reusable RAG library: OpenNLP chunking, Ollama embeddings/chat via LangChain4j, ONNX reranker, pgvector storage. Facade: `RagBuilder`.
- `app-module` – REST API (`KnowledgeController`, base path `/knowledge`): create text/URL, create via PDF upload, update, delete, get by id, paginated list, vectors by `hash_id`, streaming ask (SSE).

## Prerequisites

- Java 21, Maven 3.9+
- PostgreSQL 16+ with the `pgvector` extension
- Ollama serving on `http://localhost:11434`
- The two model files below

## Database

1.  Install PostgreSQL and the `pgvector` extension.
2.  Create the database (tables and the `vector` extension are created automatically by Flyway on startup via `V1__create_knowledge_table_and_indexes.sql`):
    ```bash
    createdb static_rag
    ```
3.  Default connection (see `app-module/src/main/resources/application-app.yml`): host `localhost:5432`, db `static_rag`, user `postgres`, password `password`. To use your own credentials, export env vars before starting:
    ```bash
    export SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/static_rag
    export SPRING_DATASOURCE_USERNAME=<your-user>
    export SPRING_DATASOURCE_PASSWORD=<your-password>
    ```

## Ollama

```bash
ollama pull phi4-mini:latest
ollama pull nomic-embed-text:137m-v1.5-fp16
```

Chat uses `phi4-mini:latest`, embeddings use `nomic-embed-text:137m-v1.5-fp16` (see `rag-module/src/main/resources/application-rag.yml`).

## External model files

The app loads these ML models from disk at startup (paths are configurable, values below are the current ones in `rag-module/src/main/resources/application-rag.yml`):

| # | File(s) | Config key | Default if unset |
|---|---------|-----------|------------------|
| 1 | `model.onnx` + `model.onnx_data` + `tokenizer.json` | `reranker.models-base-path` (directory) | `./models/reranker` |
| 2 | `opennlp-en-ud-ewt-sentence-1.3-2.5.4.bin` | `sentence-split.model-path` (exact file path) | `./models/opennlp-en-sent.bin` |

Setup instructions:

1.  Sentence model: download `opennlp-en-ud-ewt-sentence-1.3-2.5.4.bin` from https://opennlp.apache.org/models.html and place it at the `sentence-split.model-path` location:
    ```bash
    mkdir -p /path/to/sentence-split
    cp opennlp-en-ud-ewt-sentence-1.3-2.5.4.bin /path/to/sentence-split/
    export SENTENCE_SPLIT_MODEL_PATH=/path/to/sentence-split/opennlp-en-ud-ewt-sentence-1.3-2.5.4.bin
    ```
    The app fails fast at startup if this file is missing (`SentenceSplitConfig`).
2.  Reranker: place a compatible ONNX cross-encoder reranker export (`model.onnx`, weights `model.onnx_data`, `tokenizer.json`) side by side under one directory and point the app at it:
    ```bash
    mkdir -p /path/to/reranker
    cp model.onnx model.onnx_data tokenizer.json /path/to/reranker/
    export RERANKER_MODELS_BASE_PATH=/path/to/reranker
    ```
    If these files are missing the app still starts but falls back to keyword scoring (`KeywordScoringModel`, see `RerankerConfig`), so retrieval quality drops.

## Run

```bash
cd personal-rag-backend
mvn -pl rag-module,app-module -am compile
mvn -pl app-module -am spring-boot:run
```

API base: `http://localhost:8080/knowledge/*`. Logs: `~/logfiles/static-rag/`.

## Use the API

Ingest text:

```bash
curl -X POST localhost:8080/knowledge/create \
  -H 'Content-Type: application/json' \
  -d '{"content":"RAG stands for Retrieval-Augmented Generation.","type":"TEXT"}'
```

Ingest a web page (the backend scrapes it):

```bash
curl -X POST localhost:8080/knowledge/create \
  -H 'Content-Type: application/json' \
  -d '{"content":"https://example.com/article","type":"URL"}'
```

Ingest a PDF:

```bash
curl -X POST localhost:8080/knowledge/create/pdf \
  -F pdf_file=@document.pdf
```

Ask (streams the answer as SSE):

```bash
curl -N -X POST localhost:8080/knowledge/ask \
  -H 'Content-Type: application/json' \
  -d '{"query":"What does RAG stand for?"}'
```

Manage knowledge (`id` is the numeric knowledge id, `hash_id` comes from create responses):

```bash
curl -X PUT 'localhost:8080/knowledge/update?id=1' \
  -H 'Content-Type: application/json' \
  -d '{"content":"Updated content."}'

curl 'localhost:8080/knowledge/id?id=1'
curl 'localhost:8080/knowledge/all?size=20'
curl 'localhost:8080/knowledge/vector?hash_id=<hash_id>'
curl -X DELETE 'localhost:8080/knowledge/delete?id=1'
```
