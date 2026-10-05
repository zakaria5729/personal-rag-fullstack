# Personal RAG Fullstack

Personal Retrieval-Augmented Generation app: knowledge ingestion (text / URL / PDF) plus streaming chat over your own data.

> This implementation is built entirely on free and open-source models (Ollama language/embedding models,
> Apache OpenNLP, and an ONNX reranker — no paid APIs). I wrote all the code by hand, without any AI agent,
> in order to learn the RAG system properly end to end.

## Layout

- `personal-rag-backend/` – Spring Boot API (Java 21, Maven). Serves `http://localhost:8080`. See its README for module details.
- `personal-rag-frontend/` – static chat UI (no build step). Served via `npm start` on `http://localhost:3000`, talks to the backend.

## 1. Prerequisites (install on your machine)

- Java 21 and Maven 3.9+
- Node.js 18+ (for serving the frontend)
- PostgreSQL 16+ with the `pgvector` extension
- Ollama (serving on `http://localhost:11434`)
- Internet access (frontend loads `marked`, `highlight.js` and Google Fonts from CDN)

## 2. Clone

```bash
git clone https://github.com/zakaria5729/personal-rag-fullstack.git
cd personal-rag-fullstack
```

## 3. Database

Create the database (tables are migrated automatically by Flyway on startup):

```bash
createdb static_rag
```

Default connection (see `personal-rag-backend/app-module/src/main/resources/application-app.yml`):
host `localhost:5432`, db `static_rag`, user `postgres`, password `password`.
To use your own credentials, export env vars before starting the backend:

```bash
export SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/static_rag
export SPRING_DATASOURCE_USERNAME=<your-user>
export SPRING_DATASOURCE_PASSWORD=<your-password>
```

## 4. Ollama models

```bash
ollama pull phi4-mini:latest
ollama pull nomic-embed-text:137m-v1.5-fp16
```

## 5. External model files (download + placement)

The backend loads two ML models from disk. Download them, then place them at the configured paths
(configured in `personal-rag-backend/rag-module/src/main/resources/application-rag.yml`):

| File(s) | Place at | Get it from |
|---------|----------|-------------|
| `opennlp-en-ud-ewt-sentence-1.3-2.5.4.bin` | `<sentence-split.model-path>` (exact file path) | https://opennlp.apache.org/models.html |
| `model.onnx` + `model.onnx_data` + `tokenizer.json` | `<reranker.models-base-path>/` (all three side by side) | any compatible ONNX cross-encoder reranker export |

```bash
mkdir -p /path/to/sentence-split /path/to/reranker
cp opennlp-en-ud-ewt-sentence-1.3-2.5.4.bin /path/to/sentence-split/
cp model.onnx model.onnx_data tokenizer.json /path/to/reranker/
```

Then point the app at your paths (no code change needed — env vars override the yml):

```bash
export SENTENCE_SPLIT_MODEL_PATH=/path/to/sentence-split/opennlp-en-ud-ewt-sentence-1.3-2.5.4.bin
export RERANKER_MODELS_BASE_PATH=/path/to/reranker
```

Notes:

- The sentence model is required — the app fails fast at startup if it is missing.
- The reranker is optional — without it the app still starts but falls back to keyword scoring, so answer quality drops.

## 6. Run the backend

```bash
cd personal-rag-backend
mvn -pl rag-module,app-module -am compile
mvn -pl app-module -am spring-boot:run
```

API base: `http://localhost:8080/knowledge/*`. Logs: `~/logfiles/static-rag/`.

## 7. Run the frontend (new terminal)

```bash
cd personal-rag-frontend
npm start
```

Open `http://localhost:3000`. The UI calls the backend URL set in `js/config.js` (`BASE_URL`, default `http://localhost:8080`) — change it there if your backend runs elsewhere.

## 8. Use it

### Backend API (`http://localhost:8080/knowledge/*`)

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

### Frontend UI (`http://localhost:3000`)

Ask a question:

1.  Type a question in the input box, e.g. `What does RAG stand for?`, and hit send.
2.  Watch the status chips (`analyzing-query` → `retrieving-info` → `reranking-info` → `generating-response`) while the answer streams in.
3.  Use the stop button to cancel a running answer, `New Query` to start a fresh session, or the mic button to dictate instead of typing. Answers can be read aloud.
4.  Past sessions appear in the sidebar; you can rename (update query) or delete them.

Ingest knowledge — click `Ingest Knowledge` (sidebar) and pick a tab:

- TEXT tab: paste plain text, e.g. `RAG stands for Retrieval-Augmented Generation.`, then `Ingest Knowledge`.
- URL tab: enter a page URL, e.g. `https://example.com/article` — the backend scrapes and ingests it.
- PDF tab: click or drag-and-drop a `.pdf` file, then ingest.

Manage knowledge — open the `Knowledge Management` view:

- Browse ingested items (`Load More` pages through history).
- Click an item to see its full content (copy button included).
- Open `Knowledge Vector Content Chunks` to inspect the stored embedding chunks.
- Update an item's text or delete items you no longer need.
