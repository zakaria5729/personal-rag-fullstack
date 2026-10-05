# Personal RAG Fullstack

Personal Retrieval-Augmented Generation app: knowledge ingestion (text / URL / PDF) plus streaming chat over your own data.

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
