# Personal RAG Fullstack

Personal Retrieval-Augmented Generation app: knowledge ingestion (text / URL / PDF) plus streaming chat over your own data.

## Layout

- `personal-rag-backend/` – Spring Boot API (Java 21, Maven). See its README. Serves `http://localhost:8080`.
- `personal-rag-frontend/` – static chat UI. See its README. Served via `npm start` on `http://localhost:3000`, talks to the backend.

## Quickstart

1.  Start dependencies: PostgreSQL with `pgvector` (`static_rag` on `localhost:5432`) and Ollama (`localhost:11434`).
2.  Backend:
    ```bash
    cd personal-rag-backend
    mvn -pl rag-module,app-module -am compile
    mvn -pl app-module -am spring-boot:run
    ```
3.  Frontend (new terminal):
    ```bash
    cd personal-rag-frontend
    npm start
    ```
4.  Open `http://localhost:3000`.

## External model files

The backend loads ML models from disk (full details in `personal-rag-backend/README.md`):

- Reranker ONNX export: `model.onnx` + `model.onnx_data` + `tokenizer.json` under the `reranker.models-base-path` directory. Missing files degrade to keyword scoring instead of failing.
- Sentence model: `opennlp-en-ud-ewt-sentence-1.3-2.5.4.bin` at `sentence-split.model-path` — download from https://opennlp.apache.org/models.html. Required at startup.
- Ollama: `ollama pull phi4-mini:latest` and `ollama pull nomic-embed-text:137m-v1.5-fp16`.

The frontend needs no local files; it loads `marked`, `highlight.js` (CDN) and Google Fonts, so it requires internet access.
